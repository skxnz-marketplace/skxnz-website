"use client";

import { ShopBrowser } from "@/components/buyer/shop-browser";
import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { demoBrands } from "@/lib/data/brands";

type ShopCatalogProps = {
  initialBrandSlug?: string;
  initialQuery?: string;
};

export function ShopCatalog({ initialBrandSlug, initialQuery }: ShopCatalogProps) {
  const { approvedProducts, approvedFacets } = useMarketplace();

  return (
    <ShopBrowser
      products={approvedProducts}
      categories={approvedFacets.categories}
      brands={demoBrands.map((brand) => ({ slug: brand.slug, name: brand.name }))}
      initialBrandSlug={initialBrandSlug}
      initialQuery={initialQuery}
      sizes={approvedFacets.sizes}
      colors={approvedFacets.colors}
    />
  );
}
