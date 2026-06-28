import type { CartPreviewItem } from "@/lib/data/products";
import type { CartSyncStatus } from "@/lib/types/skxnz-data";

export type CartSyncPreview = {
  mergeableItems: number;
  totalQuantity: number;
  duplicateRiskCount: number;
  localOnly: true;
  notes: string[];
};

export function createCartSyncPreview(items: CartPreviewItem[]): CartSyncPreview {
  const mergeKeys = new Set<string>();
  let duplicateRiskCount = 0;

  for (const item of items) {
    const key = [
      item.productId,
      item.productVariantId ?? "default-variant",
      item.size || "default-size",
      item.color || "default-color",
    ].join("__");

    if (mergeKeys.has(key)) {
      duplicateRiskCount += 1;
    }

    mergeKeys.add(key);
  }

  return {
    mergeableItems: mergeKeys.size,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    duplicateRiskCount,
    localOnly: true,
    notes: [
      "Guest cart stays in localStorage for MVP.",
      "Future account login should merge by product, variant, size, and color.",
      "Local cart should clear only after database sync succeeds later.",
    ],
  };
}

export function createCartSyncStatus(items: CartPreviewItem[]): CartSyncStatus {
  const preview = createCartSyncPreview(items);

  return {
    mode: "ready-for-account-sync",
    localCartItemCount: items.length,
    localCartQuantity: preview.totalQuantity,
    canSyncNow: false,
    message:
      "Cart sync is prepared for future account persistence. No cloud cart sync is live yet.",
    nextStep:
      "Connect real authentication, create database cart_items, then merge guest cart after login.",
    updatedAt: new Date().toISOString(),
  };
}
