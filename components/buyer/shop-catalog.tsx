"use client";

import { ShopBrowser } from "@/components/buyer/shop-browser";
import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { demoBrands } from "@/lib/data/brands";
import { deriveProductFacets, type Product } from "@/lib/data/products";

type ShopCatalogProps = {
  initialBrandSlug?: string;
  initialQuery?: string;
  /** Decided on the server: "live" = Supabase catalogue (an empty list is a real,
   * empty catalogue); "fixture" = local fixtures, only when lib/catalog/demo-fallback
   * allows it. Never inferred from an empty live list. */
  source: "live" | "fixture";
  liveProducts?: Product[];
  liveBrands?: Array<{
    slug: string;
    name: string;
  }>;
};

export function ShopCatalog({
  initialBrandSlug,
  initialQuery,
  source,
  liveProducts = [],
  liveBrands = [],
}: ShopCatalogProps) {
  const { approvedProducts, approvedFacets } = useMarketplace();
  const isLive = source === "live";
  const products = isLive ? liveProducts : approvedProducts;
  const facets = isLive ? deriveProductFacets(liveProducts) : approvedFacets;
  const brands = isLive
    ? liveBrands
    : demoBrands.map((brand) => ({ slug: brand.slug, name: brand.name }));

  return (
    <ShopBrowser
      products={products}
      categories={facets.categories}
      brands={brands}
      initialBrandSlug={initialBrandSlug}
      initialQuery={initialQuery}
      sizes={facets.sizes}
      colors={facets.colors}
    />
  );
}
