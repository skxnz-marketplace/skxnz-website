"use server";

// SKXNZ create-return-request server action (D4-5).
//
// Creates one `return_requests` row + N `return_request_items` rows for the
// authenticated buyer. Everything ownership- or state-sensitive is verified
// SERVER-SIDE against the 0005 commerce schema:
//
//   - buyer_id        <- authenticated session (NEVER client input)
//   - order ownership <- re-fetched: orders.buyer_id must equal session user
//   - eligibility     <- orders.status must be 'DELIVERED' (exact schema
//                        value). No delivered orders exist until real
//                        fulfilment happens, so this action safely rejects
//                        everything today — it never invents delivered state.
//   - item ownership  <- each order_item re-fetched and must belong to the
//                        SAME order (RLS enforces this too)
//   - quantity        <- positive int, <= purchased quantity for that line
//
// Honesty rules (hard): status starts at 'REQUESTED' only. Never APPROVED /
// PICKUP_PENDING / REFUNDED. No refund amount, no payment reference, no
// pickup or courier claims — none of that exists yet.
//
// Migration status: 0005 is finalized but NOT applied live. Missing tables
// (Postgres 42P01) surface as { ok: false, code: "NOT_WIRED" }.
//
// Atomicity limitation: supabase-js has no client-side transaction, so the
// request row inserts before its items. `authenticated` has no UPDATE/DELETE
// grant on return_requests, so a failure between the two inserts leaves an
// item-less REQUESTED return the buyer can see and admin can close — never a
// refund or approval. Single-RPC atomicity is a future hardening step.
//
// Cross-request over-return guard (launch-war D1-A hardening): before insert,
// the buyer's earlier return requests for the SAME order are re-read and every
// non-REJECTED request's item quantities are subtracted from what can still be
// claimed per line. A line whose remaining claimable quantity is zero rejects
// with ALREADY_REQUESTED; a request exceeding the remainder rejects with
// QUANTITY_EXCEEDED. REJECTED requests free their quantity; every other status
// (REQUESTED/IN_REVIEW/APPROVED/PICKUP_PENDING/RECEIVED/REFUND_PENDING/
// REFUNDED/CLOSED) keeps its claim — conservative on purpose. This is an
// app-level check (reads are the buyer's own rows via RLS); a concurrent
// double-submit race is still theoretically possible until the future
// single-RPC hardening step, and admin review remains the operational backstop.

import { createClient } from "@/lib/supabase/server";
import {
  validateReturnRequestInput,
  type CreateReturnRequestInput,
} from "@/lib/returns/return-requests";
import { isOrderIdShape } from "@/lib/orders/read-buyer-orders";

const MAX_RETURN_ITEMS = 50;

export type CreateReturnRequestResult =
  | {
      ok: true;
      returnRequestId: string;
      status: "REQUESTED";
      redirectTo: string;
    }
  | {
      ok: false;
      code:
        | "UNAUTHENTICATED"
        | "VALIDATION_FAILED"
        | "ORDER_NOT_FOUND"
        | "NOT_ELIGIBLE"
        | "ITEM_MISMATCH"
        | "QUANTITY_EXCEEDED"
        | "ALREADY_REQUESTED"
        | "NOT_WIRED"
        | "DB_ERROR";
      message: string;
      fieldErrors?: Record<string, string>;
    };

// Postgres 42P01 = undefined_table -> 0005 migration not applied yet.
function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

function notWired(): CreateReturnRequestResult {
  return {
    ok: false,
    code: "NOT_WIRED",
    message:
      "Returns are not connected yet. The commerce database has not been applied, so no return was created.",
  };
}

function dbError(): CreateReturnRequestResult {
  return {
    ok: false,
    code: "DB_ERROR",
    message: "We could not submit your return right now. Please try again.",
  };
}

export async function createReturnRequest(
  input: CreateReturnRequestInput,
): Promise<CreateReturnRequestResult> {
  // ---- 1. Shape validation (shared D4-1 validator + hard limits) ----------
  const fieldErrors = validateReturnRequestInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Some return details are missing or invalid.",
      fieldErrors,
    };
  }
  if (input.items.length > MAX_RETURN_ITEMS) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Too many items in one return request.",
    };
  }
  if (!isOrderIdShape(input.orderId)) {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      message: "That order could not be found.",
    };
  }
  // Reject duplicate order_item ids (two lines claiming the same item).
  const itemIds = input.items.map((item) => item.orderItemId);
  if (new Set(itemIds).size !== itemIds.length) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Each item can only appear once in a return request.",
    };
  }

  const supabase = await createClient();

  // ---- 2. Authenticated buyer (session-derived, never client input) -------
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Please sign in to request a return.",
    };
  }

  // ---- 3. Order must be the buyer's own AND DELIVERED ---------------------
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, buyer_id, status")
    .eq("id", input.orderId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (orderError) {
    if (isMissingTableError(orderError)) return notWired();
    console.warn("[returns] order lookup failed:", orderError.message);
    return dbError();
  }
  if (!order) {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      message: "That order could not be found.",
    };
  }
  if (order.status !== "DELIVERED") {
    return {
      ok: false,
      code: "NOT_ELIGIBLE",
      message:
        "Returns can only be requested for delivered orders. This order has not been delivered.",
    };
  }

  // ---- 4. Every order_item must belong to THIS order; qty <= purchased ----
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("id, order_id, quantity")
    .eq("order_id", order.id)
    .in("id", itemIds);

  if (itemsError) {
    if (isMissingTableError(itemsError)) return notWired();
    console.warn("[returns] order items lookup failed:", itemsError.message);
    return dbError();
  }

  const purchasedById = new Map(
    (orderItems ?? []).map((item) => [item.id, item.quantity as number]),
  );

  for (const item of input.items) {
    const purchasedQuantity = purchasedById.get(item.orderItemId);
    if (purchasedQuantity === undefined) {
      return {
        ok: false,
        code: "ITEM_MISMATCH",
        message: "One of the selected items does not belong to this order.",
      };
    }
    if (item.quantity > purchasedQuantity) {
      return {
        ok: false,
        code: "QUANTITY_EXCEEDED",
        message:
          "A return quantity is higher than the quantity that was ordered.",
      };
    }
  }

  // ---- 4b. Net out quantities already claimed by earlier return requests ----
  // Every non-REJECTED request keeps its claim (see header note). Reads are
  // the buyer's own rows via RLS; buyer_id filter is defensive.
  const { data: priorRequests, error: priorError } = await supabase
    .from("return_requests")
    .select("id, status")
    .eq("order_id", order.id)
    .eq("buyer_id", user.id)
    .neq("status", "REJECTED");

  if (priorError) {
    if (isMissingTableError(priorError)) return notWired();
    console.warn("[returns] prior request lookup failed:", priorError.message);
    return dbError();
  }

  const claimedByItemId = new Map<string, number>();
  if (priorRequests && priorRequests.length > 0) {
    const { data: priorItems, error: priorItemsError } = await supabase
      .from("return_request_items")
      .select("order_item_id, quantity")
      .in(
        "return_request_id",
        priorRequests.map((request) => request.id),
      );

    if (priorItemsError) {
      if (isMissingTableError(priorItemsError)) return notWired();
      console.warn(
        "[returns] prior request items lookup failed:",
        priorItemsError.message,
      );
      return dbError();
    }

    for (const priorItem of priorItems ?? []) {
      const key = priorItem.order_item_id as string;
      claimedByItemId.set(
        key,
        (claimedByItemId.get(key) ?? 0) + ((priorItem.quantity as number) ?? 0),
      );
    }
  }

  for (const item of input.items) {
    const purchasedQuantity = purchasedById.get(item.orderItemId) ?? 0;
    const alreadyClaimed = claimedByItemId.get(item.orderItemId) ?? 0;
    const remaining = Math.max(0, purchasedQuantity - alreadyClaimed);

    if (remaining === 0 && alreadyClaimed > 0) {
      return {
        ok: false,
        code: "ALREADY_REQUESTED",
        message:
          "A return has already been requested for one of these items. You can see its status in My Returns.",
      };
    }
    if (item.quantity > remaining) {
      return {
        ok: false,
        code: "QUANTITY_EXCEEDED",
        message:
          "A return quantity is higher than what is still available to return for this order, counting earlier return requests.",
      };
    }
  }

  // ---- 5. Insert return_requests (status REQUESTED — the only honest one) -
  const { data: requestRow, error: requestInsertError } = await supabase
    .from("return_requests")
    .insert({
      order_id: order.id,
      buyer_id: user.id,
      status: "REQUESTED",
      reason: input.reason.trim(),
      note: input.note?.trim() || null,
    })
    .select("id")
    .single();

  if (requestInsertError || !requestRow) {
    if (isMissingTableError(requestInsertError)) return notWired();
    console.warn(
      "[returns] return_requests insert failed:",
      requestInsertError?.message,
    );
    return dbError();
  }
  const returnRequestId = requestRow.id as string;

  // ---- 6. Insert return_request_items -------------------------------------
  const { error: itemInsertError } = await supabase
    .from("return_request_items")
    .insert(
      input.items.map((item) => ({
        return_request_id: returnRequestId,
        order_item_id: item.orderItemId,
        quantity: item.quantity,
        reason: item.reason?.trim() || null,
      })),
    );

  if (itemInsertError) {
    // Cannot roll back the request row (no DELETE grant for authenticated).
    // Leftover is an item-less REQUESTED return — no refund, no approval.
    // See the atomicity note at the top of this file.
    console.warn(
      "[returns] return_request_items insert failed:",
      itemInsertError.message,
    );
    return dbError();
  }

  return {
    ok: true,
    returnRequestId,
    status: "REQUESTED",
    redirectTo: `/orders/${order.id}`,
  };
}
