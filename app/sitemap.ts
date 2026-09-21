import type { MetadataRoute } from "next";

import { getSiteBaseUrl } from "@/lib/site";
import { createPublicCatalogClient } from "@/lib/supabase/public-catalog";
import { getActiveBrandsDetail, getActiveProducts } from "@/lib/catalog/queries";

// Static, indexable pages. Excluded on purpose:
// - Cart/checkout/account/orders/login/etc: session-specific or
//   transactional (see app/robots.ts for the matching disallow list).
// - /search: a pure redirect to /shop?q=..., never itself a content page.
// - /sell: seller recruitment is not part of the public/buyer site — the
//   route itself 404s (see app/sell/page.tsx).
// - /authenticity, /community-guidelines, /privacy, /seller-terms,
//   /shipping, /terms: draft legal/policy copy pending review, marked
//   `robots: { index: false }` on the page itself — kept out of the
//   sitemap so it matches what's actually indexable.
const staticPaths = [
  "/",
  "/about",
  "/ai",
  "/ai/stylist",
  "/brands",
  "/community",
  "/contact",
  "/cookies",
  "/faq",
  "/returns",
  "/shop",
  "/support",
  "/waitlist",
];

async function getActiveCategorySlugs(): Promise<{ slug: string; updatedAt: string | null }[]> {
  const supabase = createPublicCatalogClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug, updated_at")
    .eq("is_active", true);

  if (error) {
    // Missing table (migration not applied yet) or transient failure — the
    // sitemap still renders with the static paths, it just skips categories.
    return [];
  }
  return (data ?? []).map((row) => ({ slug: row.slug as string, updatedAt: row.updated_at ?? null }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified: now,
  }));

  const [{ data: brands }, products, categories] = await Promise.all([
    getActiveBrandsDetail(),
    getActiveProducts(),
    getActiveCategorySlugs(),
  ]);

  const brandEntries: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: new URL(`/brands/${brand.slug}`, baseUrl).toString(),
    lastModified: brand.updated_at ? new Date(brand.updated_at) : now,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: new URL(`/categories/${category.slug}`, baseUrl).toString(),
    lastModified: category.updatedAt ? new Date(category.updatedAt) : now,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: new URL(`/product/${product.slug}`, baseUrl).toString(),
    lastModified: product.updated_at ? new Date(product.updated_at) : now,
  }));

  return [...staticEntries, ...brandEntries, ...categoryEntries, ...productEntries];
}
