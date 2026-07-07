// SERVER ONLY — seller order-line read layer (D4-6).
//
// Sellers see ONLY order_items whose product belongs to them, and ONLY on
// post-payment orders — both enforced by the D4-2 RLS policy
// "order_items: seller can select own product lines" (joins public.products
// on seller_id and excludes DRAFT/PAYMENT_PENDING orders). Sellers can NOT
// select from public.orders at all, so no buyer identity, address, contact,
// or order totals are readable here — line snapshots only.
//
// Defensive extra: because a seller may also be a buyer (and the buyer
// select policy would union in their own purchased lines), this helper
// first resolves the seller's product ids and filters order_items to them
// explicitly. RLS remains the real gate; the filter keeps the queue precise.
//
// Migration status: 0005 finalized, NOT applied live. 42P01 -> backendReady
// false so the page can render an honest backend-not-ready state.

import { createClient } from "@/lib/supabase/server";

export type SellerOrderLine = {
  id: string;
  /** Parent order id — used as a short reference only; the order row itself
   * is not readable by sellers (no buyer data leak). */
  orderId: string;
  productSlug: string;
  titleSnapshot: string;
  brandSnapshot: string | null;
  selectedSize: string | null;
  selectedColor: string | null;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
  createdAt: string;
};

export type SellerOrderLinesResult =
  | { backendReady: true; lines: SellerOrderLine[] }
  | { backendReady: false; lines: [] };

// Postgres 42P01 = undefined_table -> 0005 migration not applied yet.
function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

/** Order lines for the authenticated seller's own products, newest first.
 * All visible lines are post-payment by RLS — drafts and open carts never
 * appear here. */
export async function getSellerOrderLines(): Promise<SellerOrderLinesResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { backendReady: true, lines: [] };
  }

  // Resolve the seller's own product ids (products RLS: seller sees own).
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id")
    .eq("seller_id", user.id);

  if (productsError) {
    if (isMissingTableError(productsError)) {
      return { backendReady: false, lines: [] };
    }
    console.warn("[seller-orders] product lookup failed:", productsError.message);
    return { backendReady: true, lines: [] };
  }

  const productIds = (products ?? []).map((product) => product.id);
  if (productIds.length === 0) {
    return { backendReady: true, lines: [] };
  }

  const { data: lines, error: linesError } = await supabase
    .from("order_items")
    .select(
      "id, order_id, product_slug, title_snapshot, brand_snapshot, selected_size, selected_color, unit_price_paise, quantity, line_total_paise, created_at",
    )
    .in("product_id", productIds)
    .order("created_at", { ascending: false });

  if (linesError) {
    if (isMissingTableError(linesError)) {
      return { backendReady: false, lines: [] };
    }
    console.warn("[seller-orders] line query failed:", linesError.message);
    return { backendReady: true, lines: [] };
  }

  return {
    backendReady: true,
    lines: (lines ?? []).map((line) => ({
      id: line.id,
      orderId: line.order_id,
      productSlug: line.product_slug,
      titleSnapshot: line.title_snapshot,
      brandSnapshot: line.brand_snapshot,
      selectedSize: line.selected_size,
      selectedColor: line.selected_color,
      unitPricePaise: line.unit_price_paise,
      quantity: line.quantity,
      lineTotalPaise: line.line_total_paise,
      createdAt: line.created_at,
    })),
  };
}
