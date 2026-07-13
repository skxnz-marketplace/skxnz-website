// Shared admin order transition map (D4-A). Single source of truth for the
// adminUpdateOrderStatus server action AND the admin UI, so buttons can only
// offer transitions the action will accept.
//
// NEVER reachable from here: -> PAID (signature-verified payment webhook
// only) and -> REFUNDED (provider-confirmed refund flow only).

import type { BuyerOrderStatus } from "@/lib/orders/read-buyer-orders";

export const ADMIN_ORDER_TRANSITIONS: Record<
  BuyerOrderStatus,
  BuyerOrderStatus[]
> = {
  DRAFT: ["CANCELLED"],
  PAYMENT_PENDING: ["CANCELLED"],
  PAID: ["FULFILLING", "CANCELLED"],
  FULFILLING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

/** Human labels for admin transition buttons — no raw enum noise. */
export const ADMIN_ORDER_STATUS_LABEL: Record<BuyerOrderStatus, string> = {
  DRAFT: "Draft — not paid",
  PAYMENT_PENDING: "Payment pending",
  PAID: "Paid",
  FULFILLING: "Fulfilling",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};
