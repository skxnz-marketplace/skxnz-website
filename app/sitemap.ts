import type { MetadataRoute } from "next";

import { getSiteBaseUrl } from "@/lib/site";
import { listActiveBrands, listActiveCategories, listActiveProducts, unwrapCatalog } from "@/lib/catalog/public-catalog";

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

/** Sitemap of live entities only (lib/catalog/public-catalog). Rendered per
 * request: a catalogue error must surface as a 5xx, never as a sitemap with
 * brands/categories/products silently missing, and never be cached that way. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified: now,
  }));

  const [brandsResult, productsResult, categoriesResult] = await Promise.all([
    listActiveBrands(),
    listActiveProducts(),
    listActiveCategories(),
  ]);
  const brands = unwrapCatalog(brandsResult);
  const products = unwrapCatalog(productsResult);
  const categories = unwrapCatalog(categoriesResult);

  const brandEntries: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: new URL(`/brands/${brand.slug}`, baseUrl).toString(),
    lastModified: brand.updated_at ? new Date(brand.updated_at) : now,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: new URL(`/categories/${category.slug}`, baseUrl).toString(),
    lastModified: category.updated_at ? new Date(category.updated_at) : now,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: new URL(`/product/${product.slug}`, baseUrl).toString(),
    lastModified: product.updated_at ? new Date(product.updated_at) : now,
  }));

  return [...staticEntries, ...brandEntries, ...categoryEntries, ...productEntries];
}
