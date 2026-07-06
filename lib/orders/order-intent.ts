// SKXNZ order-intent input layer (V1 backend foundation).
//
// These shapes mirror the DRAFT migration supabase/migrations/
// 0005_commerce_layer.sql (orders + order_items). Nothing here writes to the
// database, creates an order id, or claims payment — this file is pure types,
// validation, and mapping so the create-order server action can be wired once
// the migration is applied and verified.
//
// Money rule: every amount is integer paise. Cart lines already store
// `unitPriceCents` in paise.

import type { CartPreviewItem } from "@/lib/data/products";
import type { CheckoutDraft } from "@/lib/checkout/checkout-draft";
import { validateCheckoutDraft } from "@/lib/checkout/checkout-draft";

/** Matches orders.contact_snapshot jsonb. */
export type CheckoutContactSnapshot = {
  fullName: string;
  phone: string;
  email: string;
};

/** Matches orders.shipping_address_snapshot jsonb. */
export type ShippingAddressSnapshot = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

/** Matches one public.order_items row (pre-insert, no ids yet). */
export type OrderLineItemInput = {
  productId: string | null;
  productSlug: string;
  variantId: string | null;
  titleSnapshot: string;
  brandSnapshot: string | null;
  imageSnapshot: string | null;
  selectedSize: string | null;
  selectedColor: string | null;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
};

/**
 * Everything needed to insert one pre-payment order (status DRAFT or
 * PAYMENT_PENDING) plus its items. buyer_id is intentionally absent:
 * the server action derives it from the authenticated session, never
 * from client input.
 */
export type CreateOrderIntentInput = {
  contact: CheckoutContactSnapshot;
  shippingAddress: ShippingAddressSnapshot;
  deliveryNote: string;
  lineItems: OrderLineItemInput[];
  subtotalPaise: number;
};

export type CreateOrderIntentResult =
  | {
      ok: true;
      /** Real DB order id — only ever present after a real insert. */
      orderId: string;
      status: "DRAFT" | "PAYMENT_PENDING";
    }
  | {
      ok: false;
      code: "NOT_WIRED" | "VALIDATION_FAILED" | "UNAUTHENTICATED" | "DB_ERROR";
      message: string;
      fieldErrors?: Record<string, string>;
    };

function isPositiveInt(value: number) {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeInt(value: number) {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Server-side validation of an order intent before any insert.
 * Returns a map of field errors; empty object means valid.
 */
export function validateOrderIntentInput(
  input: CreateOrderIntentInput,
): Record<string, string> {
  const errors: Record<string, string> = {};

  // Contact + address reuse the checkout-draft rules (single source of truth).
  const draftErrors = validateCheckoutDraft({
    contact: input.contact,
    address: input.shippingAddress,
    deliveryNote: input.deliveryNote,
    updatedAt: "",
  });

  for (const [field, message] of Object.entries(draftErrors)) {
    if (message) {
      errors[field] = message;
    }
  }

  if (input.lineItems.length === 0) {
    errors.lineItems = "An order needs at least one item.";
  }

  let computedSubtotal = 0;

  input.lineItems.forEach((line, index) => {
    if (!line.productSlug.trim()) {
      errors[`lineItems.${index}.productSlug`] = "Product reference is missing.";
    }
    if (!line.titleSnapshot.trim()) {
      errors[`lineItems.${index}.titleSnapshot`] = "Product title is missing.";
    }
    if (!isNonNegativeInt(line.unitPricePaise)) {
      errors[`lineItems.${index}.unitPricePaise`] =
        "Unit price must be integer paise (>= 0).";
    }
    if (!isPositiveInt(line.quantity)) {
      errors[`lineItems.${index}.quantity`] =
        "Quantity must be a positive integer.";
    }
    if (
      !isNonNegativeInt(line.lineTotalPaise) ||
      line.lineTotalPaise !== line.unitPricePaise * line.quantity
    ) {
      errors[`lineItems.${index}.lineTotalPaise`] =
        "Line total must equal unit price times quantity, in integer paise.";
    }

    computedSubtotal += line.lineTotalPaise;
  });

  if (
    !isNonNegativeInt(input.subtotalPaise) ||
    input.subtotalPaise !== computedSubtotal
  ) {
    errors.subtotalPaise =
      "Subtotal must equal the sum of line totals, in integer paise.";
  }

  return errors;
}

/**
 * Map the device-local cart + checkout draft into an order intent.
 * Pure. Does not read storage, does not touch the DB.
 */
export function mapCheckoutDraftToOrderIntent(
  cartItems: CartPreviewItem[],
  draft: CheckoutDraft,
): CreateOrderIntentInput {
  const lineItems: OrderLineItemInput[] = cartItems.map((item) => {
    const unitPricePaise = Math.max(0, Math.round(item.unitPriceCents));
    const quantity = Math.max(1, Math.round(item.quantity));

    return {
      productId: item.productId || null,
      productSlug: item.product.slug,
      variantId: item.productVariantId,
      titleSnapshot: item.product.name,
      brandSnapshot: item.product.brandName || null,
      imageSnapshot: item.image || item.product.image || null,
      selectedSize: item.size || null,
      selectedColor: item.color || null,
      unitPricePaise,
      quantity,
      lineTotalPaise: unitPricePaise * quantity,
    };
  });

  return {
    contact: {
      fullName: draft.contact.fullName.trim(),
      phone: draft.contact.phone.trim(),
      email: draft.contact.email.trim(),
    },
    shippingAddress: {
      line1: draft.address.line1.trim(),
      line2: draft.address.line2.trim(),
      city: draft.address.city.trim(),
      state: draft.address.state.trim(),
      pincode: draft.address.pincode.trim(),
      country: draft.address.country.trim() || "India",
    },
    deliveryNote: draft.deliveryNote.trim(),
    lineItems,
    subtotalPaise: lineItems.reduce(
      (total, line) => total + line.lineTotalPaise,
      0,
    ),
  };
}
