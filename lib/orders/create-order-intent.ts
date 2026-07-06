"use server";

// SKXNZ create-order server action (SKELETON — DB write intentionally not
// wired).
//
// The commerce migration (supabase/migrations/0005_commerce_layer.sql) is a
// DRAFT and has NOT been applied to the live database. Until it is applied and
// verified, this action validates input and prepares the exact insert payload,
// then returns { ok: false, code: "NOT_WIRED" }. It never invents an order id
// and never claims payment.
//
// When the migration is live, replace the NOT_WIRED block with:
//   1. createClient() from lib/supabase/server (session-scoped, RLS enforced).
//   2. supabase.auth.getUser() -> derive buyer_id server-side.
//   3. insert into orders (status 'DRAFT') + order_items in sequence,
//      keeping amounts in integer paise.
//   4. Return { ok: true, orderId, status: 'DRAFT' }.
// PAID status is NEVER set here — only by the signature-verified payment
// webhook handler (future slice).

import {
  validateOrderIntentInput,
  type CreateOrderIntentInput,
  type CreateOrderIntentResult,
} from "@/lib/orders/order-intent";

export async function createOrderIntent(
  input: CreateOrderIntentInput,
): Promise<CreateOrderIntentResult> {
  const fieldErrors = validateOrderIntentInput(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Some order details are missing or invalid.",
      fieldErrors,
    };
  }

  // Insert payload shape the future DB write will use (kept here so the
  // wiring step is mechanical, not a redesign):
  //
  // orders row:
  //   buyer_id                  <- auth user id (server-derived, never client)
  //   status                    <- 'DRAFT'
  //   currency                  <- 'INR'
  //   subtotal_amount_paise     <- input.subtotalPaise
  //   contact_snapshot          <- input.contact
  //   shipping_address_snapshot <- input.shippingAddress
  //   delivery_note             <- input.deliveryNote || null
  //   shipping/tax/total        <- null until live checkout computes them
  //
  // order_items rows: one per input.lineItems entry (paise amounts as-is).

  return {
    ok: false,
    code: "NOT_WIRED",
    message:
      "Order creation is not connected yet. The commerce database layer has not been applied, so no order was created and nothing was charged.",
  };
}
