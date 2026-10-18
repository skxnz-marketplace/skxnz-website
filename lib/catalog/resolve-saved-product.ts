"use server";

import { findActiveProduct } from "@/lib/catalog/public-catalog";
import { mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";

/** Recheck public eligibility when restoring a device-local saved selection. */
export async function resolveSavedProduct(productId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return { ok: true as const, product: null };
  const result = await findActiveProduct(productId);
  if (!result.ok) return { ok: false as const, product: null };
  return {
    ok: true as const,
    product: result.data ? mapCatalogProductToBuyerProduct(result.data) : null,
  };
}
