"use client";

import { ShopBrowser } from "@/components/buyer/shop-browser";
import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { demoBrands } from "@/lib/data/brands";
import { deriveProductFacets, type Product } from "@/lib/data/products";

type ShopCatalogProps = {
  initialBrandSlug?: string;
  initialQuery?: string;
  liveProducts?: Product[];
  liveBrands?: Array<{
    slug: string;
    name: string;
  }>;
};

export function ShopCatalog({
  initialBrandSlug,
  initialQuery,
  liveProducts = [],
  liveBrands = [],
}: ShopCatalogProps) {
  const { approvedProducts, approvedFacets } = useMarketplace();
  const hasLiveProducts = liveProducts.length > 0;
  const products = hasLiveProducts ? liveProducts : approvedProducts;
  const facets = hasLiveProducts ? deriveProductFacets(liveProducts) : approvedFacets;
  const brands = hasLiveProducts
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
