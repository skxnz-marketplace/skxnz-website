"use server";

// SKXNZ seller line-fulfilment action (D3-A).
//
// Moves ONE order_item that belongs to the authenticated seller through the
// per-line fulfilment ladder. Nothing here can touch:
//   * public.orders (whole-order status / payment fields)
//   * other sellers' lines
//   * buyer identity, address, or totals
//   * inventory / stock rows
//
// Why the service-role client is used for the WRITE:
//   0005 grants `authenticated` NO UPDATE on order_items — the seller RLS
//   policy from 0006 is READ-only by design. So this action:
//     1. Verifies caller is an APPROVED/eligible SELLER (session + role)
//     2. Refetches the line via the seller-scoped RLS SELECT (own product + post-payment)
//     3. Validates the requested transition against a forward-only ladder
//     4. Performs the conditional UPDATE + audit INSERT via the service-role
//        client (server-only file, secret never reaches the browser)
//
// Migration status:
//   0005 applied live. 0006 applied live.
//   0009 (adds order_items.seller_fulfilment_* columns + order_item_events)
//   is DRAFT. Missing table (42P01) OR missing column (42703) -> NOT_WIRED
//   and the action returns without touching anything.

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  NEXT_SELLER_FULFILMENT,
  isSellerOrderIdShape,
  type SellerLineFulfilmentStatus,
} from "@/lib/orders/read-seller-orders";

const MAX_NOTE_LENGTH = 500;

const ALLOWED_FORWARD: Record<
  SellerLineFulfilmentStatus,
  SellerLineFulfilmentStatus[]
> = {
  PENDING: ["ACCEPTED"],
  ACCEPTED: ["PACKED"],
  PACKED: ["HANDED_TO_DELIVERY"],
  HANDED_TO_DELIVERY: [],
};

export type SellerLineActionInput = {
  orderItemId: string;
  action: "ADVANCE" | "ADD_NOTE";
  /** Required for ADVANCE. Must be the next step per NEXT_SELLER_FULFILMENT. */
  nextStatus?: SellerLineFulfilmentStatus;
  note?: string | null;
};

export type SellerLineActionResult =
  | {
      ok: true;
      orderItemId: string;
      orderId: string;
      status: SellerLineFulfilmentStatus;
    }
  | {
      ok: false;
      code:
        | "UNAUTHENTICATED"
        | "FORBIDDEN"
        | "VALIDATION_FAILED"
        | "LINE_NOT_FOUND"
        | "INVALID_TRANSITION"
        | "NOT_WIRED"
        | "DB_ERROR";
      message: string;
    };

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    Boolean(error.message?.match(/column .* does not exist/i))
  );
}

function notWired(): SellerLineActionResult {
  return {
    ok: false,
    code: "NOT_WIRED",
    message:
      "Seller fulfilment is not connected yet. The line-fulfilment database columns have not been applied, so nothing was changed.",
  };
}

function dbError(): SellerLineActionResult {
  return {
    ok: false,
    code: "DB_ERROR",
    message: "The line could not be updated right now. Please try again.",
  };
}

export async function updateSellerLineFulfilment(
  input: SellerLineActionInput,
): Promise<SellerLineActionResult> {
  // ---- 1. Shape validation --------------------------------------------------
  if (!input || typeof input !== "object") {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Invalid request.",
    };
  }
  if (!input.orderItemId || !isSellerOrderIdShape(input.orderItemId)) {
    return {
      ok: false,
      code: "LINE_NOT_FOUND",
      message: "That order line could not be found.",
    };
  }
  if (input.action !== "ADVANCE" && input.action !== "ADD_NOTE") {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Unsupported line action.",
    };
  }

  const trimmedNote = typeof input.note === "string" ? input.note.trim() : "";
  const note = trimmedNote.length > 0 ? trimmedNote : null;
  if (note && note.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: `Notes must be ${MAX_NOTE_LENGTH} characters or fewer.`,
    };
  }
  if (input.action === "ADD_NOTE" && !note) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "A note is required.",
    };
  }

  // ---- 2. Caller must be a real SELLER (session + public.users.role) -------
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
    console.warn("[seller-fulfilment] role lookup failed:", roleError.message);
    return dbError();
  }
  const role = roleRow?.role;
  if (role !== "SELLER" && role !== "ADMIN") {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Only approved sellers can update fulfilment.",
    };
  }

  // ---- 3. Refetch the line via seller-scoped RLS ---------------------------
  // The line SELECT goes through the seller RLS policy from 0006 (own product,
  // post-payment orders only). A cross-seller or draft line returns null.
  const lineSelect =
    "id, order_id, product_id, seller_fulfilment_status, seller_fulfilment_note";
  const legacyLineSelect = "id, order_id, product_id";

  let line: {
    id: string;
    order_id: string;
    product_id: string | null;
    seller_fulfilment_status?: unknown;
    seller_fulfilment_note?: unknown;
  } | null = null;
  let currentStatus: SellerLineFulfilmentStatus = "PENDING";
  let fulfilmentColumnsPresent = true;

  const first = await supabase
    .from("order_items")
    .select(lineSelect)
    .eq("id", input.orderItemId)
    .maybeSingle();

  if (first.error) {
    if (isMissingTableError(first.error)) return notWired();
    if (isMissingColumnError(first.error)) {
      // 0009 not applied — nothing to update. Read the line legacy-shape only
      // so we can still return LINE_NOT_FOUND for cross-seller lines instead
      // of leaking "column missing" back to the client.
      fulfilmentColumnsPresent = false;
      const legacy = await supabase
        .from("order_items")
        .select(legacyLineSelect)
        .eq("id", input.orderItemId)
        .maybeSingle();
      if (legacy.error) {
        if (isMissingTableError(legacy.error)) return notWired();
        console.warn("[seller-fulfilment] legacy line lookup failed:", legacy.error.message);
        return dbError();
      }
      line = legacy.data ?? null;
    } else {
      console.warn("[seller-fulfilment] line lookup failed:", first.error.message);
      return dbError();
    }
  } else {
    line = first.data ?? null;
    if (line && typeof line.seller_fulfilment_status === "string") {
      const raw = line.seller_fulfilment_status;
      if (raw in NEXT_SELLER_FULFILMENT) {
        currentStatus = raw as SellerLineFulfilmentStatus;
      }
    }
  }

  if (!line) {
    // RLS-invisible OR non-existent OR draft. Never reveal which.
    return {
      ok: false,
      code: "LINE_NOT_FOUND",
      message: "That order line could not be found.",
    };
  }

  // Defensive re-ownership check via products.seller_id (admins skip this).
  if (role !== "ADMIN") {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, seller_id")
      .eq("id", line.product_id)
      .maybeSingle();
    if (productError) {
      console.warn("[seller-fulfilment] product lookup failed:", productError.message);
      return dbError();
    }
    if (!product || product.seller_id !== user.id) {
      return {
        ok: false,
        code: "LINE_NOT_FOUND",
        message: "That order line could not be found.",
      };
    }
  }

  // ---- 4. Compute the target state -----------------------------------------
  if (!fulfilmentColumnsPresent) {
    return notWired();
  }

  let nextStatus: SellerLineFulfilmentStatus = currentStatus;
  let eventType: "STATUS_CHANGED" | "NOTE_ADDED" = "NOTE_ADDED";

  if (input.action === "ADVANCE") {
    if (!input.nextStatus || !(input.nextStatus in NEXT_SELLER_FULFILMENT)) {
      return {
        ok: false,
        code: "VALIDATION_FAILED",
        message: "That is not a valid fulfilment step.",
      };
    }
    const allowed = ALLOWED_FORWARD[currentStatus] ?? [];
    if (!allowed.includes(input.nextStatus)) {
      return {
        ok: false,
        code: "INVALID_TRANSITION",
        message: `A line cannot move from ${currentStatus} to ${input.nextStatus}. Only the next step in the ladder is allowed.`,
      };
    }
    nextStatus = input.nextStatus;
    eventType = "STATUS_CHANGED";
  }

  // ---- 5. Conditional UPDATE via service-role ------------------------------
  const nowIso = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    seller_fulfilment_updated_at: nowIso,
  };
  if (input.action === "ADVANCE") {
    updatePayload.seller_fulfilment_status = nextStatus;
  }
  if (note !== null) {
    updatePayload.seller_fulfilment_note = note;
  }

  const updateQuery = supabaseAdmin
    .from("order_items")
    .update(updatePayload)
    .eq("id", line.id)
    .eq("seller_fulfilment_status", currentStatus);

  const { data: updated, error: updateError } = await updateQuery.select(
    "id, seller_fulfilment_status",
  );

  if (updateError) {
    if (isMissingTableError(updateError)) return notWired();
    if (isMissingColumnError(updateError)) return notWired();
    console.warn("[seller-fulfilment] line update failed:", updateError.message);
    return dbError();
  }
  if (!updated?.length) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: "The line changed while you were updating it. Reload and retry.",
    };
  }

  // ---- 6. Audit event (best-effort; missing table -> log and continue) -----
  const eventMessage =
    input.action === "ADVANCE"
      ? note
        ? `Seller advanced line ${currentStatus} -> ${nextStatus}: ${note}`
        : `Seller advanced line ${currentStatus} -> ${nextStatus}.`
      : `Seller added note: ${note ?? ""}`;

  const { error: eventError } = await supabaseAdmin
    .from("order_item_events")
    .insert({
      order_item_id: line.id,
      event_type: eventType,
      from_status: input.action === "ADVANCE" ? currentStatus : null,
      to_status: input.action === "ADVANCE" ? nextStatus : null,
      actor_user_id: user.id,
      message: eventMessage,
      metadata: {
        source: "seller-update-line-fulfilment",
        action: input.action,
      },
    });

  if (eventError && !isMissingTableError(eventError)) {
    console.warn(
      "[seller-fulfilment] audit event insert failed:",
      eventError.message,
    );
  }

  return {
    ok: true,
    orderItemId: line.id,
    orderId: line.order_id,
    status: nextStatus,
  };
}
