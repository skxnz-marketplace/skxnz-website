import type { CartPreviewItem, Product } from "@/lib/data/products";

/** Display estimate only; the order RPC still prices from the database. */
export function selectedProductPrice(product: Product, variantId?: string | null) {
  const variant = product.variants?.find((option) => option.id === variantId);
  return variant?.priceInr ?? (product.dataSource === "live"
    ? product.price
    : product.salePrice ?? product.price);
}

export function cartUnitPrice(item: Pick<CartPreviewItem, "product" | "productVariantId">) {
  return selectedProductPrice(item.product, item.productVariantId);
}
