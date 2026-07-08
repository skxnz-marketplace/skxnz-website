"use server";

// Server-authoritative buyer saved-item actions (D5-1).
//
// - user_id is ALWAYS derived from supabase.auth.getUser() — never accepted
//   from the client. A buyer can only ever write their own rows (RLS + this).
// - Snapshot fields are validated/sanitised server-side.
// - Until 0007_buyer_saved_items.sql is applied, inserts/deletes hit a missing
//   table (42P01) and return { ok:false, code:'NOT_WIRED' } with honest copy —
//   never a fake success.
// - No service_role. RLS ("saved_items: owner ...") is the enforced boundary.

import { createClient } from "@/lib/supabase/server";
import {
  validateSaveProductInput,
  type RemoveSavedProductResult,
  type SaveProductInput,
  type SaveProductResult,
} from "./saved-items";

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

export async function saveProduct(
  input: SaveProductInput,
): Promise<SaveProductResult> {
  const validation = validateSaveProductInput(input);
  if (!validation.ok) {
    return { ok: false, code: "VALIDATION_FAILED", message: validation.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Please sign in to save products to your SKXNZ account.",
    };
  }

  const v = validation.value;

  const { data, error } = await supabase
    .from("saved_items")
    .insert({
      user_id: user.id,
      product_id: v.productId ?? null,
      product_slug: v.productSlug,
      product_title: v.productTitle,
      brand_name: v.brandName ?? null,
      price_inr: v.priceInr ?? null,
      image_url: v.imageUrl ?? null,
      selected_size: v.selectedSize ?? null,
      selected_variant_id: v.selectedVariantId ?? null,
      source: v.source,
    })
    .select("id")
    .single();

  if (!error) {
    return { ok: true, savedItemId: data.id };
  }

  if (isMissingTableError(error)) {
    return {
      ok: false,
      code: "NOT_WIRED",
      message:
        "Saved items are not connected yet. Your device-local wishlist still works.",
    };
  }

  // Already saved (unique dedupe index) — idempotent success. Re-read the id.
  if (error.code === "23505") {
    const { data: existing } = await supabase
      .from("saved_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_slug", v.productSlug)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return { ok: true, savedItemId: existing.id };
    }
    return { ok: true, savedItemId: "" };
  }

  console.warn("[saved-items] save failed:", error.message);
  return {
    ok: false,
    code: "DB_ERROR",
    message: "Could not save this product right now. Please try again.",
  };
}

/** Remove one saved item owned by the current buyer (by saved_items.id). */
export async function removeSavedProduct(
  savedItemId: string,
): Promise<RemoveSavedProductResult> {
  const id = (savedItemId ?? "").trim();
  if (!id) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "A saved item id is required.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Please sign in to manage your saved products.",
    };
  }

  const { error } = await supabase
    .from("saved_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // defensive; RLS already restricts to owner

  if (error) {
    if (isMissingTableError(error)) {
      return {
        ok: false,
        code: "NOT_WIRED",
        message: "Saved items are not connected yet.",
      };
    }
    console.warn("[saved-items] remove failed:", error.message);
    return {
      ok: false,
      code: "DB_ERROR",
      message: "Could not remove this saved product right now.",
    };
  }

  return { ok: true };
}
