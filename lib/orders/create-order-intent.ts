"use server";

// D5-A: the draft order, its lines, and its audit event are created only by
// the draft 0011 RPC. There is deliberately no client-side multi-write or
// service-role fallback.
import { createClient } from "@/lib/supabase/server";

const MAX_LINE_ITEMS = 50;
const MAX_QUANTITY_PER_LINE = 10;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CreateOrderItemInput = { productId?: string | null; productSlug?: string | null; variantId?: string | null; quantity: number; clientUnitPricePaise?: number };
export type CreateOrderIntentInput = { items: CreateOrderItemInput[]; shippingAddressId?: string | null; notes?: string | null; idempotencyKey?: string | null };
export type CreateOrderIntentResult =
  | { ok: true; orderId: string; status: "DRAFT"; redirectTo: string; notices?: string[] }
  | { ok: false; code: "UNAUTHENTICATED"|"FORBIDDEN"|"VALIDATION_FAILED"|"ADDRESS_REQUIRED"|"PRODUCT_UNAVAILABLE"|"OUT_OF_STOCK"|"IDEMPOTENCY_CONFLICT"|"NOT_WIRED"|"DB_ERROR"; message: string };

const notWired = (): CreateOrderIntentResult => ({ ok:false, code:"NOT_WIRED", message:"Order creation is not connected yet. The atomic order database migration has not been applied, so no order was created and nothing was charged." });
const dbError = (): CreateOrderIntentResult => ({ ok:false, code:"DB_ERROR", message:"We could not create your draft order right now. Please try again." });

function mapRpcError(error: { code?: string; message?: string } | null): CreateOrderIntentResult {
  const message = error?.message ?? "";
  if (error?.code === "PGRST202" || error?.code === "42883" || /function .* does not exist/i.test(message)) return notWired();
  if (/SKXNZ_UNAUTHENTICATED/.test(message)) return { ok:false, code:"UNAUTHENTICATED", message:"Please sign in to create a draft order." };
  if (/SKXNZ_BUYER_REQUIRED/.test(message)) return { ok:false, code:"FORBIDDEN", message:"Only buyer accounts can create draft orders." };
  if (/SKXNZ_ADDRESS/.test(message)) return { ok:false, code:"ADDRESS_REQUIRED", message:"That shipping address could not be found." };
  if (/SKXNZ_OUT_OF_STOCK/.test(message)) return { ok:false, code:"OUT_OF_STOCK", message:"One of your items does not have enough stock." };
  if (/SKXNZ_PRODUCT/.test(message) || /SKXNZ_VARIANT/.test(message)) return { ok:false, code:"PRODUCT_UNAVAILABLE", message:"One of your selected items is no longer available." };
  if (/SKXNZ_IDEMPOTENCY_CONFLICT/.test(message)) return { ok:false, code:"IDEMPOTENCY_CONFLICT", message:"This checkout request was already used for different items. Refresh checkout and try again." };
  if (/SKXNZ_VALIDATION|SKXNZ_NOTE_TOO_LONG/.test(message)) return { ok:false, code:"VALIDATION_FAILED", message:"Check your order details and try again." };
  console.warn("[orders] atomic draft RPC failed", error?.code); return dbError();
}

export async function createOrderIntent(input: CreateOrderIntentInput): Promise<CreateOrderIntentResult> {
  if (!input || !Array.isArray(input.items) || input.items.length === 0 || input.items.length > MAX_LINE_ITEMS) return { ok:false, code:"VALIDATION_FAILED", message:"Your cart must contain between 1 and 50 items." };
  if (!input.shippingAddressId || !UUID.test(input.shippingAddressId)) return { ok:false, code:"ADDRESS_REQUIRED", message:"Select a shipping address before creating an order." };
  if (typeof input.notes === "string" && input.notes.trim().length > 500) return { ok:false, code:"VALIDATION_FAILED", message:"Delivery notes must be 500 characters or fewer." };
  for (const item of input.items) {
    if ((!item.productId && !item.productSlug) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY_PER_LINE) return { ok:false, code:"VALIDATION_FAILED", message:"Each item must have a product reference and quantity from 1 to 10." };
    if (item.productId && !UUID.test(item.productId)) return { ok:false, code:"VALIDATION_FAILED", message:"One selected product is invalid." };
    if (item.variantId && !UUID.test(item.variantId)) return { ok:false, code:"VALIDATION_FAILED", message:"One selected option is invalid." };
  }
  if (input.idempotencyKey && !UUID.test(input.idempotencyKey)) return { ok:false, code:"VALIDATION_FAILED", message:"The checkout request is invalid. Refresh checkout and try again." };

  const db = await createClient();
  const { data:{ user }, error:userError } = await db.auth.getUser();
  if (userError || !user) return { ok:false, code:"UNAUTHENTICATED", message:"Please sign in to create a draft order." };
  const key = input.idempotencyKey ?? crypto.randomUUID();
  const rpcItems = input.items.map(({ productId, productSlug, variantId, quantity }) => ({ product_id: productId ?? null, product_slug: productSlug ?? null, variant_id: variantId ?? null, quantity }));
  const { data, error } = await db.rpc("create_order_intent_atomic", { p_items: rpcItems, p_shipping_address_id: input.shippingAddressId, p_note: input.notes?.trim() || null, p_idempotency_key: key });
  if (error) return mapRpcError(error);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.order_id !== "string" || row.status !== "DRAFT") return dbError();
  return { ok:true, orderId:row.order_id, status:"DRAFT", redirectTo:`/orders/${row.order_id}` };
}
