// Live brands and categories for client navigation (discovery menu). Public
// data via lib/catalog/public-catalog (publishable key, RLS). A catalogue error
// is a 503 — the menu then shows no brand pills and routes category links to
// shop search, never demo brands.
import { NextResponse } from "next/server";

import { listActiveBrands, listActiveCategories } from "@/lib/catalog/public-catalog";

export const revalidate = 300;

export async function GET() {
  const [brands, categories] = await Promise.all([listActiveBrands(), listActiveCategories()]);
  if (!brands.ok || !categories.ok) {
    return NextResponse.json({ error: "catalog_unavailable" }, { status: 503 });
  }

  return NextResponse.json({
    brands: brands.data.map((brand) => ({ slug: brand.slug, name: brand.name })),
    categories: categories.data.map((category) => ({ slug: category.slug, name: category.name })),
  });
}
