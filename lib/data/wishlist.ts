import type { WishlistItem } from "@/lib/types/skxnz-data";

export const guestWishlistStorageKey = "skxnz-marketplace-wishlist";

export type WishlistItemDraft = Pick<
  WishlistItem,
  "productId" | "productVariantId" | "selectedSize" | "selectedColor"
>;

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

