// Buyer search suggestions from the canonical live catalogue (products, brands,
// categories) via lib/catalog/public-catalog. Publishable key only (RLS
// enforced) — never service role. A catalogue error is reported as
// live:false with HTTP 503; the client then shows no catalogue suggestions
// rather than substituting demo items.
import { NextResponse } from "next/server";

import { mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";
import { searchCatalog } from "@/lib/catalog/public-catalog";
import { guardRouteHandler } from "@/lib/security/rate-limit/rate-limit";

export const dynamic = "force-dynamic";

const SUGGESTION_LIMIT = 8;

export async function GET(request: Request) {
  // Abuse control: policy 'search.suggest'. Returns a truthful 429 with Retry-After.
  const rateLimit = await guardRouteHandler("search.suggest", request);
  if (!rateLimit.ok) return rateLimit.response;

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json({ live: true, suggestions: [] });
  }

  const result = await searchCatalog(query, SUGGESTION_LIMIT);
  if (!result.ok) {
    return NextResponse.json({ live: false, suggestions: [] }, { status: 503 });
  }

  const products = result.data.products.map((product, index) => {
    const buyerProduct = mapCatalogProductToBuyerProduct(product);
    return {
      type: "product" as const,
      label: buyerProduct.name,
      href: `/product/${buyerProduct.slug}`,
      description: `${buyerProduct.brandName} • Product`,
      image: buyerProduct.image,
      score: 120 - index,
    };
  });
  const brands = result.data.brands.map((brand, index) => ({
    type: "brand" as const,
    label: brand.name,
    href: `/brands/${brand.slug}`,
    description: "Brand",
    image: brand.logo_url ?? undefined,
    score: 110 - index,
  }));
  const categories = result.data.categories.map((category, index) => ({
    type: "category" as const,
    label: category.name,
    href: `/categories/${category.slug}`,
    description: "Category",
    score: 100 - index,
  }));

  return NextResponse.json({ live: true, suggestions: [...products, ...brands, ...categories] });
}
