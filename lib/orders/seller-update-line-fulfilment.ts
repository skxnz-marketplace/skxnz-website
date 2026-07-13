"use server";

// Seller-line fulfilment application boundary. The draft 0009 RPC owns the
// authorization, row lock, transition validation, update, and audit insert
// in one database transaction. This action intentionally has no service-role
// fallback: until the RPC is applied, seller controls stay read-only.

import { createClient } from "@/lib/supabase/server";
import {
  isSellerOrderIdShape,
  type SellerLineFulfilmentStatus,
} from "@/lib/orders/read-seller-orders";

const MAX_NOTE_LENGTH = 500;

export type SellerLineActionInput = {
  orderItemId: string;
  action: "ADVANCE" | "ADD_NOTE";
  nextStatus?: SellerLineFulfilmentStatus;
  note?: string | null;
};

export type SellerLineActionResult =
  | { ok: true; orderItemId: string; orderId: string; status: SellerLineFulfilmentStatus }
  | {
      ok: false;
      code: "UNAUTHENTICATED" | "FORBIDDEN" | "VALIDATION_FAILED" | "LINE_NOT_FOUND" | "INVALID_TRANSITION" | "NOT_WIRED" | "DB_ERROR";
      message: string;
    };

function notWired(): SellerLineActionResult {
  return { ok: false, code: "NOT_WIRED", message: "Seller fulfilment is not connected yet. The atomic database migration has not been applied, so nothing was changed." };
}

function mapRpcError(error: { code?: string; message?: string } | null): SellerLineActionResult {
  const message = error?.message ?? "";
  if (error?.code === "42883" || error?.code === "PGRST202" || /function .* does not exist/i.test(message)) return notWired();
  if (/SKXNZ_UNAUTHENTICATED/.test(message)) return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in." };
  if (/SKXNZ_SELLER_REQUIRED/.test(message)) return { ok: false, code: "FORBIDDEN", message: "Only approved sellers can update fulfilment." };
  if (/SKXNZ_LINE_NOT_FOUND/.test(message)) return { ok: false, code: "LINE_NOT_FOUND", message: "That order line could not be found." };
  if (/SKXNZ_INVALID_TRANSITION/.test(message)) return { ok: false, code: "INVALID_TRANSITION", message: "That line is no longer at the expected step. Reload and try the next available action." };
  if (/SKXNZ_NOTE_TOO_LONG/.test(message)) return { ok: false, code: "VALIDATION_FAILED", message: `Notes must be ${MAX_NOTE_LENGTH} characters or fewer.` };
  if (/SKXNZ_NOTE_REQUIRED|SKXNZ_INVALID_ACTION/.test(message)) return { ok: false, code: "VALIDATION_FAILED", message: "Invalid fulfilment request." };
  console.warn("[seller-fulfilment] atomic RPC failed:", message);
  return { ok: false, code: "DB_ERROR", message: "The line could not be updated right now. Please try again." };
}

export async function updateSellerLineFulfilment(input: SellerLineActionInput): Promise<SellerLineActionResult> {
  if (!input || typeof input !== "object") return { ok: false, code: "VALIDATION_FAILED", message: "Invalid request." };
  if (!input.orderItemId || !isSellerOrderIdShape(input.orderItemId)) return { ok: false, code: "LINE_NOT_FOUND", message: "That order line could not be found." };
  if (input.action !== "ADVANCE" && input.action !== "ADD_NOTE") return { ok: false, code: "VALIDATION_FAILED", message: "Unsupported line action." };
  if (input.action === "ADVANCE" && !input.nextStatus) return { ok: false, code: "VALIDATION_FAILED", message: "That is not a valid fulfilment step." };

  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (note.length > MAX_NOTE_LENGTH) return { ok: false, code: "VALIDATION_FAILED", message: `Notes must be ${MAX_NOTE_LENGTH} characters or fewer.` };
  if (input.action === "ADD_NOTE" && !note) return { ok: false, code: "VALIDATION_FAILED", message: "A note is required." };

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, code: "UNAUTHENTICATED", message: "Please sign in." };

  // This is defense in depth and gives a stable response before the RPC. The
  // RPC repeats the gate from auth.uid(), so no client identity is trusted.
  const { data: roleRow, error: roleError } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  if (roleError) return { ok: false, code: "DB_ERROR", message: "The line could not be updated right now. Please try again." };
  if (roleRow?.role !== "SELLER") return { ok: false, code: "FORBIDDEN", message: "Only approved sellers can update fulfilment." };

  const { data, error } = await supabase.rpc("seller_update_line_fulfilment", {
    p_order_item_id: input.orderItemId,
    p_action: input.action,
    p_next_status: input.action === "ADVANCE" ? input.nextStatus : null,
    p_note: note || null,
  });
  if (error) return mapRpcError(error);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.order_item_id !== "string" || typeof row.order_id !== "string" || typeof row.seller_fulfilment_status !== "string") {
    return { ok: false, code: "DB_ERROR", message: "The line could not be updated right now. Please try again." };
  }
  return { ok: true, orderItemId: row.order_item_id, orderId: row.order_id, status: row.seller_fulfilment_status as SellerLineFulfilmentStatus };
}
