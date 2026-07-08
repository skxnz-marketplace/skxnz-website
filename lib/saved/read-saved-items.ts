// SERVER ONLY — buyer saved-items read (D5-1).
//
// Lists the authenticated buyer's OWN saved items from public.saved_items.
// RLS ("saved_items: owner can select") is the real gate; the user_id filter
// is defensive. backendReady is false until 0007_buyer_saved_items.sql is
// applied in Supabase (42P01) — the UI shows an honest "not connected yet"
// state instead of pretending the account has no saved items.

import { createClient } from "@/lib/supabase/server";
import type { SavedItemRecord, SavedItemSource } from "./saved-items";

export type SavedItemsResult =
  | { backendReady: true; authenticated: boolean; items: SavedItemRecord[] }
  | { backendReady: false; authenticated: boolean; items: [] };

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

export async function getSavedItems(): Promise<SavedItemsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { backendReady: true, authenticated: false, items: [] };
  }

  const { data, error } = await supabase
    .from("saved_items")
    .select(
      "id, product_id, product_slug, product_title, brand_name, price_inr, image_url, selected_size, selected_variant_id, source, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return { backendReady: false, authenticated: true, items: [] };
    }
    console.warn("[saved-items] read failed:", error.message);
    return { backendReady: true, authenticated: true, items: [] };
  }

  return {
    backendReady: true,
    authenticated: true,
    items: (data ?? []).map((row) => ({
      id: row.id,
      productId: row.product_id,
      productSlug: row.product_slug,
      productTitle: row.product_title,
      brandName: row.brand_name,
      priceInr: row.price_inr,
      imageUrl: row.image_url,
      selectedSize: row.selected_size,
      selectedVariantId: row.selected_variant_id,
      source: (row.source as SavedItemSource) ?? "live",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}
