// Single source of truth for buyer product-detail URLs. The /product/[id]
// route resolves live products by slug first, then by id, so the slug is the
// canonical key when present and the id is a safe fallback.
export function getProductHref(product: { slug?: string | null; id: string }): string {
  const key = product.slug?.trim() || product.id;
  return `/product/${encodeURIComponent(key)}`;
}
