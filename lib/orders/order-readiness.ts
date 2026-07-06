// SKXNZ buyer order-readiness types (V1 foundation).
//
// IMPORTANT: Nothing in this file creates, places, or confirms an order.
// These are future-safe shapes only, describing what the buyer has prepared
// on-device so a real order backend can be wired later without a rewrite.
//
// No fake order IDs, no fake payment, no fake delivery. Any real order id,
// payment reference, or shipment must come from a server-authoritative source
// (DB + signature-verified webhook), never invented in the browser.
//
// Money rule: all amounts here are integer paise (1 rupee = 100 paise), never
// floats. Cart line prices originate from `CartPreviewItem.unitPriceCents`.

/**
 * A single line the buyer intends to order, captured from the local cart.
 * This is a snapshot for review — not an order line row.
 */
export type OrderLineItemSnapshot = {
  productId: string;
  productName: string;
  brandName: string;
  sellerName: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  /** Unit price in integer paise. */
  unitPriceCents: number;
  /** quantity * unitPriceCents, in integer paise. */
  lineTotalCents: number;
};

/**
 * Buyer contact + shipping intent, mirrored from the checkout draft.
 * Delivery, taxes, and final payable are intentionally left out because they
 * are only known once live checkout (rates + tax) is connected server-side.
 */
export type OrderIntentDraft = {
  contact: {
    fullName: string;
    phone: string;
    email: string;
  };
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  deliveryNote: string;
};

/**
 * Honest lifecycle marker for the on-device review snapshot.
 * Deliberately NOT an order status enum — there is no order yet.
 *  - "draft":  buyer is still editing details.
 *  - "review": details validated and snapshot saved for the next step.
 */
export type CheckoutReviewStage = "draft" | "review";

/**
 * A device-local review snapshot the buyer can carry to the (future) live
 * payment step. This is explicitly NOT an order and holds no order id,
 * payment id, tracking number, or delivery ETA.
 */
export type CheckoutReviewSnapshot = {
  /** Schema version so future readers can migrate old snapshots safely. */
  version: 1;
  stage: CheckoutReviewStage;
  intent: OrderIntentDraft;
  lineItems: OrderLineItemSnapshot[];
  /** Sum of line totals in integer paise. Estimate only, pre delivery + tax. */
  subtotalCents: number;
  /** ISO timestamp of when this snapshot was written on-device. */
  updatedAt: string;
};
