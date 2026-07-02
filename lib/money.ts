/**
 * SKXNZ canonical money helpers.
 *
 * Money rule (do not break):
 * - Backend / order / payment amounts are ALWAYS integer paise.
 *   1 rupee = 100 paise. Never store or pass money as a float.
 * - The catalog DB column `products.price_inr` currently holds WHOLE RUPEES
 *   (see supabase/migrations/0002_catalog_layer.sql). It must be converted to
 *   paise with `rupeesToPaise()` before it is used as any order/payment amount.
 *   `lib/catalog/mappers.ts` already does this (`price_inr * 100`).
 * - UI / catalog labels display rupees, formatted with `₹` via the format
 *   helpers below.
 * - NEVER pass a rupee value directly into a payment/order amount field.
 *   Razorpay and order rows expect paise.
 *
 * This module is pure (no external packages, no I/O). It does not wire any
 * payment or order logic and does not change any schema.
 */

/** Convert rupees to integer paise. Rounds to the nearest paisa. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert integer paise to a rupees number (may be fractional). */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Format an integer-paise amount as an INR string, e.g. 349900 -> "₹3,499". */
export function formatInrFromPaise(
  paise: number,
  opts: { withDecimals?: boolean } = {}
): string {
  const rupees = paiseToRupees(paise);
  return formatInrFromRupees(rupees, opts);
}

/** Format a rupees amount as an INR string, e.g. 3499 -> "₹3,499". */
export function formatInrFromRupees(
  rupees: number,
  opts: { withDecimals?: boolean } = {}
): string {
  const fractionDigits = opts.withDecimals ? 2 : 0;
  const formatted = rupees.toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `₹${formatted}`;
}
