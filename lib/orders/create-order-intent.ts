"use server";

// SKXNZ internal create-order server action (D4-3).
//
// Turns a buyer's selected cart items into ONE internal `orders` row +
// N `order_items` rows + one `order_events` audit row. Everything that
// touches money, product identity, or ownership is derived SERVER-SIDE:
//
//   - buyer_id       <- authenticated Supabase session (NEVER client input)
//   - unit price     <- re-fetched from public.products / product_variants
//   - title/image/   <- re-fetched product snapshot (client cannot spoof)
//     brand/seller
//   - contact +      <- re-fetched from the buyer's own public.addresses row
//     address           (RLS guarantees ownership) + session email
//
// The client only supplies WHICH product + variant + quantity it wants and
// which saved address to ship to. Prices, names, totals, and status are all
// authoritative from the database.
//
// Honesty rules (hard):
//   - status is 'DRAFT' only. Never PAID / CONFIRMED / DELIVERED.
//   - payment_provider / payment_reference stay NULL. No provider is wired.
//   - shipping_amount_paise / tax_amount_paise / total_amount_paise stay NULL
//     (the app has no shipping/tax engine yet — leaving them NULL is honest;
//     the DB `orders_total_consistent` check only fires when total is set).
//
// Migration status: supabase/migrations/0005_commerce_layer.sql is finalized
// but NOT applied to the live DB yet. Until it is, the insert queries hit
// missing tables and this action returns { ok: false, code: "NOT_WIRED" }
// with a truthful message — it never invents an order id and never claims
// payment. Once the migration is applied + verified, the SAME code path
// performs the real inserts with no changes needed here.
//
// Atomicity limitation: supabase-js has no client-side multi-statement
// transaction. Inserts run in sequence (order -> items -> event). The
// `authenticated` role has no UPDATE/DELETE grant on orders, so a failure
// after the order row is inserted cannot be cleaned up from this session;
// the result is a harmless empty DRAFT order (unpaid, buyer-owned, invisible
// externally). Moving the whole create into a single Postgres RPC / function
// for true atomicity is a documented future hardening step (D4.x).

import { createClient } from "@/lib/supabase/server";

const MAX_LINE_ITEMS = 50;
const MAX_QUANTITY_PER_LINE = 10;

/** One requested cart line. Only identity + quantity is trusted from client. */
export type CreateOrderItemInput = {
  productId?: string | null;
  productSlug?: string | null;
  variantId?: string | null;
  quantity: number;
};

export type CreateOrderIntentInput = {
  items: CreateOrderItemInput[];
  /** id of a row in public.addresses owned by the buyer. */
  shippingAddressId?: string | null;
  notes?: string | null;
};

export type CreateOrderIntentResult =
  | {
      ok: true;
      orderId: string;
      status: "DRAFT";
      redirectTo: string;
    }
  | {
      ok: false;
      code:
        | "UNAUTHENTICATED"
        | "VALIDATION_FAILED"
        | "ADDRESS_REQUIRED"
        | "PRODUCT_UNAVAILABLE"
        | "OUT_OF_STOCK"
        | "NOT_WIRED"
        | "DB_ERROR";
      message: string;
    };

// Postgres 42P01 = undefined_table -> migration not applied yet.
function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  price_inr: number | null;
  image_url: string | null;
  seller_id: string | null;
  brand_id: string | null;
};

type VariantRow = {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  price_inr: number | null;
  stock_quantity: number;
  is_active: boolean;
};

/**
 * Internal create-order action.
 *
 * Security: buyer identity is session-derived; price/product/address are all
 * re-fetched server-side; no client total is trusted; no payment state is set.
 */
export async function createOrderIntent(
  input: CreateOrderIntentInput,
): Promise<CreateOrderIntentResult> {
  // ---- 1. Basic shape validation (cheap, before any DB work) -------------
  if (!input || !Array.isArray(input.items) || input.items.length === 0) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Your cart is empty.",
    };
  }
  if (input.items.length > MAX_LINE_ITEMS) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Too many items in one order.",
    };
  }
  for (const item of input.items) {
    if (!isPositiveInt(item.quantity) || item.quantity > MAX_QUANTITY_PER_LINE) {
      return {
        ok: false,
        code: "VALIDATION_FAILED",
        message: "Each item quantity must be between 1 and 10.",
      };
    }
    if (!item.productId && !item.productSlug) {
      return {
        ok: false,
        code: "VALIDATION_FAILED",
        message: "A selected item is missing its product reference.",
      };
    }
  }
  if (!input.shippingAddressId) {
    return {
      ok: false,
      code: "ADDRESS_REQUIRED",
      message: "Select a shipping address before placing your order.",
    };
  }

  const supabase = await createClient();

  // ---- 2. Authenticated buyer (server-derived, never trusted from client) -
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Please sign in to place an order.",
    };
  }
  const buyerId = user.id;

  // ---- 3. Shipping address + contact snapshot (buyer's OWN row via RLS) ---
  const { data: address, error: addressError } = await supabase
    .from("addresses")
    .select(
      "id, user_id, full_name, phone_number, line1, line2, city, state, postal_code, country",
    )
    .eq("id", input.shippingAddressId)
    .maybeSingle();

  if (addressError) {
    if (isMissingTableError(addressError)) {
      return notWired();
    }
    console.warn("[orders] address lookup failed:", addressError.message);
    return dbError();
  }
  // RLS already restricts to the caller's rows; the user_id guard is defensive.
  if (!address || address.user_id !== buyerId) {
    return {
      ok: false,
      code: "ADDRESS_REQUIRED",
      message: "That shipping address could not be found.",
    };
  }

  const shippingAddressSnapshot = {
    line1: address.line1 ?? "",
    line2: address.line2 ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    pincode: address.postal_code ?? "",
    country: address.country ?? "India",
  };
  const contactSnapshot = {
    fullName: address.full_name ?? "",
    phone: address.phone_number ?? "",
    email: user.email ?? "",
  };

  // ---- 4. Re-fetch products SERVER-SIDE (ignore any client price/title) ---
  const productIds = input.items
    .map((item) => item.productId)
    .filter((value): value is string => Boolean(value));
  const productSlugs = input.items
    .map((item) => (item.productId ? null : item.productSlug))
    .filter((value): value is string => Boolean(value));

  const productSelect = "id, slug, name, status, price_inr, image_url, seller_id, brand_id";
  const [byId, bySlug] = await Promise.all([
    productIds.length
      ? supabase.from("products").select(productSelect).in("id", productIds)
      : Promise.resolve({ data: [] as ProductRow[], error: null }),
    productSlugs.length
      ? supabase.from("products").select(productSelect).in("slug", productSlugs)
      : Promise.resolve({ data: [] as ProductRow[], error: null }),
  ]);

  const productError = byId.error ?? bySlug.error;
  if (productError) {
    if (isMissingTableError(productError)) {
      return notWired();
    }
    console.warn("[orders] product re-fetch failed:", productError.message);
    return dbError();
  }

  const products = [...(byId.data ?? []), ...(bySlug.data ?? [])] as ProductRow[];
  const productById = new Map(products.map((product) => [product.id, product]));
  const productBySlug = new Map(products.map((product) => [product.slug, product]));

  // ---- 5. Re-fetch requested variants (price override + stock + active) ---
  const variantIds = input.items
    .map((item) => item.variantId)
    .filter((value): value is string => Boolean(value));

  let variantById = new Map<string, VariantRow>();
  if (variantIds.length) {
    const { data: variants, error: variantError } = await supabase
      .from("product_variants")
      .select("id, product_id, size, color, price_inr, stock_quantity, is_active")
      .in("id", variantIds);

    if (variantError) {
      if (isMissingTableError(variantError)) {
        return notWired();
      }
      console.warn("[orders] variant re-fetch failed:", variantError.message);
      return dbError();
    }
    variantById = new Map((variants ?? []).map((variant) => [variant.id, variant as VariantRow]));
  }

  // Brand names (one lookup for all products) for the item snapshot.
  const brandIds = [...new Set(products.map((product) => product.brand_id).filter(Boolean))] as string[];
  const brandNameById = new Map<string, string>();
  if (brandIds.length) {
    const { data: brands, error: brandError } = await supabase
      .from("brands")
      .select("id, name")
      .in("id", brandIds);
    if (brandError && isMissingTableError(brandError)) {
      return notWired();
    }
    for (const brand of brands ?? []) {
      brandNameById.set(brand.id, brand.name);
    }
  }

  // ---- 6. Build order_items from AUTHORITATIVE data + validate each line --
  type ResolvedLine = {
    productId: string;
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

  const resolvedLines: ResolvedLine[] = [];

  for (const item of input.items) {
    const product = item.productId
      ? productById.get(item.productId)
      : item.productSlug
        ? productBySlug.get(item.productSlug)
        : undefined;

    // Product must exist AND be sellable. Client-supplied active/status is ignored.
    if (!product || product.status !== "ACTIVE") {
      return {
        ok: false,
        code: "PRODUCT_UNAVAILABLE",
        message: "One of your items is no longer available.",
      };
    }

    let variant: VariantRow | undefined;
    if (item.variantId) {
      variant = variantById.get(item.variantId);
      // Variant must exist, belong to this product, and be active.
      if (!variant || variant.product_id !== product.id || !variant.is_active) {
        return {
          ok: false,
          code: "PRODUCT_UNAVAILABLE",
          message: "A selected size/colour is no longer available.",
        };
      }
      // Stock check only when a variant (the stock-bearing row) is selected.
      if (variant.stock_quantity < item.quantity) {
        return {
          ok: false,
          code: "OUT_OF_STOCK",
          message: "One of your items does not have enough stock.",
        };
      }
    }

    // price_inr is whole rupees in the catalog; store integer paise (× 100).
    // Variant price overrides product price when present.
    const priceRupees = variant?.price_inr ?? product.price_inr ?? 0;
    const unitPricePaise = Math.max(0, Math.round(priceRupees * 100));
    const lineTotalPaise = unitPricePaise * item.quantity;

    resolvedLines.push({
      productId: product.id,
      productSlug: product.slug,
      variantId: variant?.id ?? null,
      titleSnapshot: product.name,
      brandSnapshot: product.brand_id ? brandNameById.get(product.brand_id) ?? null : null,
      imageSnapshot: product.image_url,
      selectedSize: variant?.size ?? null,
      selectedColor: variant?.color ?? null,
      unitPricePaise,
      quantity: item.quantity,
      lineTotalPaise,
    });
  }

  const subtotalPaise = resolvedLines.reduce((total, line) => total + line.lineTotalPaise, 0);

  // ---- 7. Insert order (DRAFT) ------------------------------------------
  // shipping/tax/total left NULL (no engine yet). payment fields NULL.
  const { data: orderRow, error: orderInsertError } = await supabase
    .from("orders")
    .insert({
      buyer_id: buyerId,
      status: "DRAFT",
      currency: "INR",
      subtotal_amount_paise: subtotalPaise,
      contact_snapshot: contactSnapshot,
      shipping_address_snapshot: shippingAddressSnapshot,
      delivery_note: input.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (orderInsertError || !orderRow) {
    if (isMissingTableError(orderInsertError)) {
      return notWired();
    }
    console.warn("[orders] order insert failed:", orderInsertError?.message);
    return dbError();
  }
  const orderId = orderRow.id as string;

  // ---- 8. Insert order_items --------------------------------------------
  const { error: itemsInsertError } = await supabase.from("order_items").insert(
    resolvedLines.map((line) => ({
      order_id: orderId,
      product_id: line.productId,
      product_slug: line.productSlug,
      variant_id: line.variantId,
      title_snapshot: line.titleSnapshot,
      brand_snapshot: line.brandSnapshot,
      image_snapshot: line.imageSnapshot,
      selected_size: line.selectedSize,
      selected_color: line.selectedColor,
      unit_price_paise: line.unitPricePaise,
      quantity: line.quantity,
      line_total_paise: line.lineTotalPaise,
    })),
  );

  if (itemsInsertError) {
    // Cannot roll the order row back from this session (no DELETE grant for
    // authenticated). The leftover row is an empty unpaid DRAFT — harmless.
    // See the atomicity note at the top of this file.
    console.warn("[orders] order_items insert failed:", itemsInsertError.message);
    return dbError();
  }

  // ---- 9. Internal audit event (best-effort; never blocks the order) -----
  // Buyers have no insert grant on order_events, so this insert is expected
  // to no-op under RLS for a buyer session; it is written by service-role /
  // server logic in later slices. Failure here does not fail the order.
  await supabase.from("order_events").insert({
    order_id: orderId,
    event_type: "ORDER_CREATED",
    message: "Buyer created a draft order.",
    metadata: { source: "create-order-intent", line_count: resolvedLines.length },
  });

  return {
    ok: true,
    orderId,
    status: "DRAFT",
    redirectTo: `/orders/${orderId}`,
  };
}

function notWired(): CreateOrderIntentResult {
  return {
    ok: false,
    code: "NOT_WIRED",
    message:
      "Order creation is not connected yet. The commerce database has not been applied, so no order was created and nothing was charged.",
  };
}

function dbError(): CreateOrderIntentResult {
  return {
    ok: false,
    code: "DB_ERROR",
    message: "We could not place your order right now. Please try again.",
  };
}
