// Buyer search suggestions from the live catalog. Anon server client only
// (RLS enforced) — never expose service-role keys here.
import { NextResponse } from "next/server";

import { mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";
import { searchActiveProducts } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

const SUGGESTION_LIMIT = 8;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json({ live: true, suggestions: [] });
  }

  try {
    const { products, live } = await searchActiveProducts(query, SUGGESTION_LIMIT);
    const suggestions = products.map((product, index) => {
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

    return NextResponse.json({ live, suggestions });
  } catch (err) {
    console.warn("[search] live suggestions failed:", err);
    return NextResponse.json({ live: false, suggestions: [] });
  }
}
