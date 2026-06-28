import type { CartItem, Product, SkxnzCurrency } from "@/lib/types/skxnz-data";

export const guestCartStorageKey = "skxnz-marketplace-cart";

export type GuestCartItemDraft = {
  productId: string;
  productVariantId?: string | null;
  selectedSize?: string | null;
  selectedColor?: string | null;
  quantity: number;
  unitPrice: number;
  currency?: SkxnzCurrency;
};

export type CartTotals = {
  subtotal: number;
  shipping: number;
  total: number;
  currency: SkxnzCurrency;
  itemCount: number;
};

export function normalizeCartQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(1, Math.floor(quantity));
}

export function createGuestCartItemDraft(
  product: Product,
  input: {
    selectedSize?: string | null;
    selectedColor?: string | null;
    quantity?: number;
  },
): GuestCartItemDraft {
  return {
    productId: product.id,
    selectedSize: input.selectedSize ?? null,
    selectedColor: input.selectedColor ?? null,
    quantity: normalizeCartQuantity(input.quantity ?? 1),
    unitPrice: product.price,
    currency: product.currency,
  };
}

export function calculateCartTotals(
  items: Pick<CartItem, "quantity" | "unitPrice" | "currency">[],
  shipping = 0,
): CartTotals {
  const subtotal = items.reduce(
    (total, item) => total + item.unitPrice * normalizeCartQuantity(item.quantity),
    0,
  );

  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    currency: items[0]?.currency ?? "INR",
    itemCount: items.reduce(
      (total, item) => total + normalizeCartQuantity(item.quantity),
      0,
    ),
  };
}

export function getCartMergeKey(
  item: Pick<
    GuestCartItemDraft,
    "productId" | "productVariantId" | "selectedSize" | "selectedColor"
  >,
) {
  return [
    item.productId,
    item.productVariantId ?? "default-variant",
    item.selectedSize ?? "default-size",
    item.selectedColor ?? "default-color",
  ].join("__");
}

export function mergeGuestCartDrafts(items: GuestCartItemDraft[]) {
  const mergedItems = new Map<string, GuestCartItemDraft>();

  for (const item of items) {
    const key = getCartMergeKey(item);
    const existingItem = mergedItems.get(key);

    if (!existingItem) {
      mergedItems.set(key, {
        ...item,
        quantity: normalizeCartQuantity(item.quantity),
      });
      continue;
    }

    mergedItems.set(key, {
      ...existingItem,
      quantity:
        normalizeCartQuantity(existingItem.quantity) +
        normalizeCartQuantity(item.quantity),
    });
  }

  return Array.from(mergedItems.values());
}

export function getStoredGuestCartDrafts() {
  if (typeof window === "undefined") {
    return [] as GuestCartItemDraft[];
  }

  try {
    const storedValue = window.localStorage.getItem(guestCartStorageKey);

    if (!storedValue) {
      return [] as GuestCartItemDraft[];
    }

    return JSON.parse(storedValue) as GuestCartItemDraft[];
  } catch {
    return [] as GuestCartItemDraft[];
  }
}
