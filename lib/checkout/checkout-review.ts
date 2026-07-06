// Browser-local checkout REVIEW snapshot for the SKXNZ V1 order-readiness
// foundation.
//
// This is NOT an order. It records what the buyer prepared on this device
// (cart lines + contact/shipping intent) so the future live payment step has a
// clean handoff. No order is placed, no payment is taken, no order id / payment
// id / tracking number / delivery ETA is created here.
//
// Money rule: line + subtotal amounts are integer paise, sourced from
// `CartPreviewItem.unitPriceCents`.

import type { CartPreviewItem } from "@/lib/data/products";
import type { CheckoutDraft } from "@/lib/checkout/checkout-draft";
import type {
  CheckoutReviewSnapshot,
  CheckoutReviewStage,
  OrderIntentDraft,
  OrderLineItemSnapshot,
} from "@/lib/orders/order-readiness";

export const checkoutReviewStorageKey = "skxnz-checkout-review";

function toIntentDraft(draft: CheckoutDraft): OrderIntentDraft {
  return {
    contact: {
      fullName: draft.contact.fullName.trim(),
      phone: draft.contact.phone.trim(),
      email: draft.contact.email.trim(),
    },
    address: {
      line1: draft.address.line1.trim(),
      line2: draft.address.line2.trim(),
      city: draft.address.city.trim(),
      state: draft.address.state.trim(),
      pincode: draft.address.pincode.trim(),
      country: draft.address.country.trim() || "India",
    },
    deliveryNote: draft.deliveryNote.trim(),
  };
}

function toLineItems(cartItems: CartPreviewItem[]): OrderLineItemSnapshot[] {
  return cartItems.map((item) => {
    const unitPriceCents = Math.max(0, Math.round(item.unitPriceCents));
    const quantity = Math.max(1, Math.round(item.quantity));

    return {
      productId: item.product.id,
      productName: item.product.name,
      brandName: item.product.brandName,
      sellerName: item.product.seller,
      image: item.image || item.product.image,
      size: item.size,
      color: item.color,
      quantity,
      unitPriceCents,
      lineTotalCents: unitPriceCents * quantity,
    };
  });
}

/**
 * Build a review snapshot from the current cart + checkout draft.
 * Pure — does not touch storage. `stage` defaults to "review".
 */
export function buildCheckoutReviewSnapshot(
  cartItems: CartPreviewItem[],
  draft: CheckoutDraft,
  stage: CheckoutReviewStage = "review",
): CheckoutReviewSnapshot {
  const lineItems = toLineItems(cartItems);
  const subtotalCents = lineItems.reduce(
    (total, line) => total + line.lineTotalCents,
    0,
  );

  return {
    version: 1,
    stage,
    intent: toIntentDraft(draft),
    lineItems,
    subtotalCents,
    updatedAt: new Date().toISOString(),
  };
}

export function readCheckoutReview(): CheckoutReviewSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(checkoutReviewStorageKey);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<CheckoutReviewSnapshot>;

    if (parsed?.version !== 1 || !Array.isArray(parsed.lineItems)) {
      return null;
    }

    return parsed as CheckoutReviewSnapshot;
  } catch {
    return null;
  }
}

export function writeCheckoutReview(snapshot: CheckoutReviewSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      checkoutReviewStorageKey,
      JSON.stringify(snapshot),
    );
  } catch {
    // Device-local persistence is best-effort in this V1 foundation.
  }
}

export function clearCheckoutReview() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(checkoutReviewStorageKey);
  } catch {
    // Ignore storage failures.
  }
}
