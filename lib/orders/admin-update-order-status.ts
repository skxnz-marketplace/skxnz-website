"use server";

// SKXNZ admin order-status transition action (D4-6).
//
// Lets an ADMIN move an order along the INTERNAL fulfilment path only.
//
// Why the service-role client is used for the write: D4-2 deliberately
// grants `authenticated` NO UPDATE on orders and NO INSERT on order_events —
// buyers must never mutate order state, and PostgREST grants are
// all-or-nothing per role. So this action (a) verifies the caller is ADMIN
// from public.users.role via the SESSION client, then (b) performs the
// update + audit insert with the service-role client (lib/supabase/admin.ts,
// server-only). The service key never reaches the browser; this file is
// "use server".
//
// Allowed transitions (conservative, honest — no provider exists yet):
//   DRAFT            -> CANCELLED
//   PAYMENT_PENDING  -> CANCELLED
//   PAID             -> FULFILLING | CANCELLED
//   FULFILLING       -> SHIPPED   | CANCELLED
//   SHIPPED          -> DELIVERED
//   DELIVERED / CANCELLED / REFUNDED -> terminal here
//
// NEVER allowed from this action:
//   -> PAID      only the future signature-verified payment webhook sets it.
//   -> REFUNDED  only a provider-confirmed refund flow sets it.
//   No courier/tracking/payment reference is written — none exist.
//
// FULFILLING/SHIPPED/DELIVERED record REAL internal operational events an
// admin asserts happened; they are unreachable today because nothing can
// become PAID until a real payment provider is wired. Every successful
// transition writes an order_events row with the acting admin's user id.
//
// Migration status: 0005 finalized, NOT applied live. 42P01 -> NOT_WIRED.

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  isOrderIdShape,
  type BuyerOrderStatus,
} from "@/lib/orders/read-buyer-orders";

const MAX_NOTE_LENGTH = 500;

/** Transitions this internal action may perform. Everything else rejects. */
const ALLOWED_TRANSITIONS: Record<BuyerOrderStatus, BuyerOrderStatus[]> = {
  DRAFT: ["CANCELLED"],
  PAYMENT_PENDING: ["CANCELLED"],
  PAID: ["FULFILLING", "CANCELLED"],
  FULFILLING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export type AdminUpdateOrderStatusInput = {
  orderId: string;
  nextStatus: string;
  note?: string | null;
};

export type AdminUpdateOrderStatusResult =
  | {
      ok: true;
      orderId: string;
      status: BuyerOrderStatus;
    }
  | {
      ok: false;
      code:
        | "UNAUTHENTICATED"
        | "FORBIDDEN"
        | "VALIDATION_FAILED"
        | "ORDER_NOT_FOUND"
        | "INVALID_TRANSITION"
        | "NOT_WIRED"
        | "DB_ERROR";
      message: string;
    };

// Postgres 42P01 = undefined_table -> 0005 migration not applied yet.
function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

function notWired(): AdminUpdateOrderStatusResult {
  return {
    ok: false,
    code: "NOT_WIRED",
    message:
      "Order management is not connected yet. The commerce database has not been applied, so nothing was changed.",
  };
}

function dbError(): AdminUpdateOrderStatusResult {
  return {
    ok: false,
    code: "DB_ERROR",
    message: "The order status could not be updated right now. Please try again.",
  };
}

export async function adminUpdateOrderStatus(
  input: AdminUpdateOrderStatusInput,
): Promise<AdminUpdateOrderStatusResult> {
  // ---- 1. Shape validation -------------------------------------------------
  if (!input.orderId || !isOrderIdShape(input.orderId)) {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      message: "That order could not be found.",
    };
  }
  const nextStatus = input.nextStatus as BuyerOrderStatus;
  if (!(nextStatus in ALLOWED_TRANSITIONS)) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "That is not a valid order status.",
    };
  }
  const note = input.note?.trim() || null;
  if (note && note.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: `Notes must be ${MAX_NOTE_LENGTH} characters or fewer.`,
    };
  }

  // ---- 2. Caller must be a real ADMIN (session + public.users.role) --------
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Please sign in.",
    };
  }

  const { data: roleRow, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError) {
    console.warn("[admin-orders] role lookup failed:", roleError.message);
    return dbError();
  }
  if (roleRow?.role !== "ADMIN") {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Only administrators can update order status.",
    };
  }

  // ---- 3. Current order state (session client; admin RLS select) ----------
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", input.orderId)
    .maybeSingle();

  if (orderError) {
    if (isMissingTableError(orderError)) return notWired();
    console.warn("[admin-orders] order lookup failed:", orderError.message);
    return dbError();
  }
  if (!order) {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      message: "That order could not be found.",
    };
  }

  const currentStatus = order.status as BuyerOrderStatus;
  if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: `An order cannot move from ${currentStatus} to ${nextStatus} here. PAID and REFUNDED are set only by real payment flows.`,
    };
  }

  // ---- 4. Update via service-role (no UPDATE grant for authenticated) ------
  // .eq("status", currentStatus) makes the update conditional so a
  // concurrent transition cannot be silently overwritten (0 rows = conflict).
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", order.id)
    .eq("status", currentStatus)
    .select("id, status");

  if (updateError) {
    if (isMissingTableError(updateError)) return notWired();
    console.warn("[admin-orders] status update failed:", updateError.message);
    return dbError();
  }
  if (!updated?.length) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: "The order changed while you were updating it. Reload and retry.",
    };
  }

  // ---- 5. Audit event (service-role; buyers cannot insert order_events) ----
  const { error: eventError } = await supabaseAdmin.from("order_events").insert({
    order_id: order.id,
    event_type: "STATUS_CHANGED",
    message: note
      ? `Status changed ${currentStatus} -> ${nextStatus} by admin: ${note}`
      : `Status changed ${currentStatus} -> ${nextStatus} by admin.`,
    metadata: {
      source: "admin-update-order-status",
      actor_user_id: user.id,
      from_status: currentStatus,
      to_status: nextStatus,
    },
  });

  if (eventError) {
    // Status already changed; missing audit row is logged loudly but the
    // truthful result is still "status updated".
    console.warn("[admin-orders] audit event insert failed:", eventError.message);
  }

  return { ok: true, orderId: order.id, status: nextStatus };
}
