// SKXNZ return-request input layer (V1 backend foundation).
//
// Mirrors the DRAFT migration supabase/migrations/0005_commerce_layer.sql
// (return_requests + return_request_items). Pure types + validation only —
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
  /** Real order_items.id from the DB — never invented client-side. */
  orderItemId: string;
  quantity: number;
  reason: string | null;
};

export type CreateReturnRequestInput = {
  /** Real orders.id from the DB — never invented client-side. */
  orderId: string;
  reason: string;
  note: string | null;
  items: ReturnRequestItemInput[];
};

const maxReasonLength = 500;
const maxNoteLength = 2000;

/** Empty result object means valid. */
export function validateReturnRequestInput(
  input: CreateReturnRequestInput,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.orderId.trim()) {
    errors.orderId = "A return must reference a real order.";
  }

  if (!input.reason.trim()) {
    errors.reason = "Return reason is required.";
  } else if (input.reason.trim().length > maxReasonLength) {
    errors.reason = `Reason must be ${maxReasonLength} characters or fewer.`;
  }

  if (input.note && input.note.length > maxNoteLength) {
    errors.note = `Note must be ${maxNoteLength} characters or fewer.`;
  }

  if (input.items.length === 0) {
    errors.items = "Select at least one item to return.";
  }

  input.items.forEach((item, index) => {
    if (!item.orderItemId.trim()) {
      errors[`items.${index}.orderItemId`] =
        "Return item must reference a real order item.";
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      errors[`items.${index}.quantity`] =
        "Return quantity must be a positive integer.";
    }
  });

  return errors;
}
