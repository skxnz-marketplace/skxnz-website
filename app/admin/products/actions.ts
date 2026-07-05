"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/roles";
import type { ProductStatus } from "@/lib/catalog/types";
import { createClient } from "@/lib/supabase/server";

const MODERATION_STATUSES = ["ACTIVE", "REJECTED", "ARCHIVED"] as const;

type ModerationStatus = (typeof MODERATION_STATUSES)[number];

function isModerationStatus(value: FormDataEntryValue | null): value is ModerationStatus {
  return (
    typeof value === "string" &&
    (MODERATION_STATUSES as readonly string[]).includes(value)
  );
}

function revalidateProductPaths(product: { id: string; slug?: string | null }) {
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/seller/products");
  revalidatePath(`/product/${product.id}`);

  if (product.slug) {
    revalidatePath(`/product/${product.slug}`);
  }
}

export async function updateProductModerationStatus(formData: FormData) {
  await requireRole(["ADMIN"], "/admin/products");

  const productId = formData.get("productId");
  const nextStatus = formData.get("status");

  if (typeof productId !== "string" || !productId) {
    throw new Error("Product id is required.");
  }

  if (!isModerationStatus(nextStatus)) {
    throw new Error("Unsupported product status.");
  }

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .update({
      status: nextStatus satisfies ProductStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select("id, slug")
    .single();

  if (error || !product) {
    throw new Error(`Product status could not be updated: ${error?.message ?? "No product row returned."}`);
  }

  revalidateProductPaths(product);
}
