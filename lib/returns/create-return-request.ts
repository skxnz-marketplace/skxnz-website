"use server";

import { createClient } from "@/lib/supabase/server";
import {
  validateReturnRequestInput,
  type CreateReturnRequestInput,
} from "@/lib/returns/return-requests";
import { isOrderIdShape } from "@/lib/orders/read-buyer-orders";
import { guardServerAction } from "@/lib/security/rate-limit/rate-limit";

const MAX_RETURN_ITEMS = 50;

export type CreateReturnRequestResult =
  | { ok: true; returnRequestId: string; status: "REQUESTED"; redirectTo: string }
  | {
      ok: false;
      code:
        | "UNAUTHENTICATED"
        | "RATE_LIMITED"
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

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

function notWired(): CreateReturnRequestResult {
  return {
    ok: false,
    code: "NOT_WIRED",
    message:
      "Returns are not connected yet. The atomic returns database migration has not been applied, so no return was created.",
  };
}

function dbError(): CreateReturnRequestResult {
  return {
    ok: false,
    code: "DB_ERROR",
    message: "We could not submit your return right now. Please try again.",
  };
}

function mapAtomicError(error: { code?: string; message?: string } | null) {
  if (isMissingTableError(error) || error?.code === "42883" || error?.code === "PGRST202") {
    return notWired();
  }
  console.warn("[returns] atomic return RPC failed:", error?.message);
  return dbError();
}

function mapAtomicCode(code: string | undefined): CreateReturnRequestResult {
  switch (code) {
    case "UNAUTHENTICATED":
      return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in to request a return." };
    case "ORDER_NOT_FOUND":
      return { ok: false, code: "ORDER_NOT_FOUND", message: "That order could not be found." };
    case "NOT_ELIGIBLE":
      return {
        ok: false,
        code: "NOT_ELIGIBLE",
        message: "Returns can only be requested for delivered orders. This order has not been delivered.",
      };
    case "ITEM_MISMATCH":
      return { ok: false, code: "ITEM_MISMATCH", message: "One of the selected items does not belong to this order." };
    case "ALREADY_REQUESTED":
      return {
        ok: false,
        code: "ALREADY_REQUESTED",
        message:
          "A return has already been requested for one of these items. You can see its status in My Returns.",
      };
    case "QUANTITY_EXCEEDED":
      return {
        ok: false,
        code: "QUANTITY_EXCEEDED",
        message:
          "A return quantity is higher than what is still available to return for this order, counting earlier return requests.",
      };
    case "VALIDATION_FAILED":
    case "IDEMPOTENCY_CONFLICT":
      return { ok: false, code: "VALIDATION_FAILED", message: "Some return details are missing or invalid." };
    default:
      return dbError();
  }
}

export async function createReturnRequest(
  input: CreateReturnRequestInput,
): Promise<CreateReturnRequestResult> {
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
    return { ok: false, code: "VALIDATION_FAILED", message: "Too many items in one return request." };
  }
  if (!isOrderIdShape(input.orderId)) {
    return { ok: false, code: "ORDER_NOT_FOUND", message: "That order could not be found." };
  }
  const itemIds = input.items.map((item) => item.orderItemId);
  if (new Set(itemIds).size !== itemIds.length) {
    return { ok: false, code: "VALIDATION_FAILED", message: "Each item can only appear once in a return request." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in to request a return." };
  }

  // Abuse control: backstops the D12-A idempotency key against retry storms.
  const limit = await guardServerAction("returns.create", { userId: user.id });
  if (!limit.ok) {
    return limit.error;
  }

  const { data, error } = await supabase.rpc("create_return_request_idempotent", {
    p_order_id: input.orderId,
    p_reason: input.reason.trim(),
    p_note: input.note?.trim() || null,
    p_items: input.items.map((item) => ({
      order_item_id: item.orderItemId,
      quantity: item.quantity,
      reason: item.reason?.trim() || null,
    })),
    p_idempotency_key: input.idempotencyKey ?? crypto.randomUUID(),
  });

  if (error) return mapAtomicError(error);
  const row = data as { ok?: boolean; code?: string; return_request_id?: string } | null;
  if (row?.ok === true && typeof row.return_request_id === "string") {
    return {
      ok: true,
      returnRequestId: row.return_request_id,
      status: "REQUESTED",
      redirectTo: `/orders/${input.orderId}`,
    };
  }
  return mapAtomicCode(row?.code);
}
