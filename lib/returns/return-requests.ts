// SKXNZ return-request input layer (V1 backend foundation).
//
// Mirrors the DRAFT migration supabase/migrations/0005_commerce_layer.sql
// (return_requests + return_request_items). Pure types + validation only â€”
// nothing here writes to the database, approves a return, or issues a refund.
// REFUNDED is a server-only status set after a real provider-confirmed refund.

export const returnRequestStatuses = [
  "REQUESTED",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
  "PICKUP_PENDING",
  "RECEIVED",
  "REFUND_PENDING",
  "REFUNDED",
  "CLOSED",
] as const;

export type ReturnRequestStatus = (typeof returnRequestStatuses)[number];

export type ReturnRequestItemInput = {
  /** Real order_items.id from the DB â€” never invented client-side. */
  orderItemId: string;
  quantity: number;
  reason: string | null;
};

export type CreateReturnRequestInput = {
  /** Real orders.id from the DB â€” never invented client-side. */
  orderId: string;
  reason: string;
  note: string | null;
  items: ReturnRequestItemInput[];
};

const maxReasonLength = 500;
const maxNoteLength = 2000;

/** Empty result object means valid. */
export function validateReturnRequestInput(input: unknown): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== "object") return { input: "Return details are required." };
  const value = input as Partial<CreateReturnRequestInput>;
  if (typeof value.orderId !== "string" || !value.orderId.trim()) errors.orderId = "A return must reference a real order.";
  if (typeof value.reason !== "string" || !value.reason.trim()) errors.reason = "Return reason is required.";
  else if (value.reason.trim().length > maxReasonLength) errors.reason = "Reason is too long.";
  if (value.note !== null && value.note !== undefined && typeof value.note !== "string") errors.note = "Note must be text.";
  else if (typeof value.note === "string" && value.note.length > maxNoteLength) errors.note = "Note is too long.";
  if (!Array.isArray(value.items) || value.items.length === 0) { errors.items = "Select at least one item to return."; return errors; }
  value.items.forEach((item, index) => {
    if (!item || typeof item.orderItemId !== "string" || !item.orderItemId.trim()) errors[`items.\${index}.orderItemId`] = "Return item must reference a real order item.";
    if (!item || typeof item.quantity !== "number" || !Number.isInteger(item.quantity) || item.quantity <= 0) errors[`items.\${index}.quantity`] = "Return quantity must be a positive integer.";
    if (item && typeof item.reason === "string" && item.reason.length > maxReasonLength) errors[`items.\${index}.reason`] = "Item reason is too long.";
  });
  return errors;
}

