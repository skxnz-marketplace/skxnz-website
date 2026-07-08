import {
  legacyProductIdAliases,
  products as seedProducts,
  type Product,
} from "@/lib/data/products";
import type { WishlistItem } from "@/lib/types/skxnz-data";

export const guestWishlistStorageKey = "skxnz-marketplace-wishlist";

export type WishlistItemDraft = Pick<
  WishlistItem,
  "productId" | "productVariantId" | "selectedSize" | "selectedColor"
>;

/**
 * Device-local wishlist entry. Carries a full product SNAPSHOT (like the cart
 * does) so LIVE Supabase catalog products — which are not part of the
 * browser-local demo catalog — still render cleanly in the wishlist even after
 * their live display data changes. Kept in localStorage under
 * `skxnz-marketplace-wishlist`.
 */
export type WishlistSnapshot = {
  productId: string;
  product: Product;
  addedAt: string;
};

export function getWishlistMergeKey(item: WishlistItemDraft) {
  return [
    item.productId,
    item.productVariantId ?? "default-variant",
    item.selectedSize ?? "default-size",
    item.selectedColor ?? "default-color",
  ].join("__");
}

export function mergeWishlistDrafts(items: WishlistItemDraft[]) {
  const uniqueItems = new Map<string, WishlistItemDraft>();

  for (const item of items) {
    uniqueItems.set(getWishlistMergeKey(item), item);
  }

  return Array.from(uniqueItems.values());
}

export function shouldPersistWishlistToDatabase(isAuthenticated: boolean) {
  return isAuthenticated;
}

/**
 * Reads whatever is in wishlist localStorage and returns clean snapshots.
 * Handles BOTH the legacy shape (an array of product-id strings) and the new
 * snapshot shape, so existing buyers keep their saved products across the
 * upgrade. Legacy ids are resolved against the demo seed catalog; ids that no
 * longer exist there (or malformed entries) are dropped safely.
 */
export function normalizeStoredWishlist(raw: unknown): WishlistSnapshot[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const seen = new Set<string>();
  const result: WishlistSnapshot[] = [];

  for (const entry of raw) {
    // Legacy: bare product-id string.
    if (typeof entry === "string") {
      const productId = legacyProductIdAliases[entry] ?? entry;
      const seedMatch = seedProducts.find((product) => product.id === productId);
      if (seedMatch && !seen.has(productId)) {
        seen.add(productId);
        result.push({
          productId,
          product: seedMatch,
          addedAt: new Date().toISOString(),
        });
      }
      continue;
    }

    // New: snapshot object.
    if (
      entry &&
      typeof entry === "object" &&
      "productId" in entry &&
      "product" in entry
    ) {
      const snapshot = entry as Partial<WishlistSnapshot>;
      const product = snapshot.product;
      const productId =
        typeof snapshot.productId === "string" ? snapshot.productId : product?.id;

      if (product && typeof productId === "string" && !seen.has(productId)) {
        seen.add(productId);
        result.push({
          productId,
          product,
          addedAt:
            typeof snapshot.addedAt === "string"
              ? snapshot.addedAt
              : new Date().toISOString(),
        });
      }
    }
  }

  return result;
}
