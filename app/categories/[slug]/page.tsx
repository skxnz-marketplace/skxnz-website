import { cache } from "react";
import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { CategoryPageShell } from "@/components/categories/category-page-shell";
import { getStructuredCategoryBySlug } from "@/src/lib/catalog-content";
import { isDemoCatalogueEnabled } from "@/lib/catalog/demo-fallback";
import { mapCatalogProductToBuyerProduct, mapCategoryToStructuredCategory } from "@/lib/catalog/mappers";
import {
  CatalogUnavailableError,
  findActiveCategoryBySlug,
  listActiveCategories,
  listActiveProducts,
  unwrapCatalog,
} from "@/lib/catalog/public-catalog";
import type { Category } from "@/lib/catalog/types";
import { getSiteBaseUrl } from "@/lib/site";

export const revalidate = 300;

// PERF (D13-A): generateMetadata and the page body each looked the category up
// by slug, so every category page ran the query twice per request. React
// cache() dedupes it to one lookup per render pass. Request-scoped only — no
// cross-request staleness.
// null = no such active category (404). A query error throws (5xx) unless the
// lib/catalog/demo-fallback switch is on, in which case "demo" is returned.
const resolveCategoryBySlug = cache(async (slug: string): Promise<Category | null | "demo"> => {
  const result = await findActiveCategoryBySlug(slug);
  if (result.ok) return result.data ?? (isDemoCatalogueEnabled() && getStructuredCategoryBySlug(slug) ? "demo" : null);
  if (isDemoCatalogueEnabled()) return getStructuredCategoryBySlug(slug) ? "demo" : null;
  throw new CatalogUnavailableError(result.error.operation);
});

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/** Pre-render live category slugs; on a catalogue error pre-render nothing (render on demand). */
export async function generateStaticParams() {
  const result = await listActiveCategories();
  return result.ok ? result.data.map((category) => ({ slug: category.slug })) : [];
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  const canonicalPath = `/categories/${slug}`;
  const liveCategory = await resolveCategoryBySlug(slug);
  if (liveCategory && liveCategory !== "demo") {
    const title = `${liveCategory.name} — Premium Fashion`;
    const description = `Shop ${liveCategory.name} on SKXNZ — curated futurewear and premium fashion.`;
    return {
      title,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: { type: "website", title, description, url: canonicalPath },
    };
  }

  const category = liveCategory === "demo" ? getStructuredCategoryBySlug(slug) : null;
  if (!category) {
    return {
      title: "Category Not Found",
      robots: { index: false, follow: true },
    };
  }

  const title = `${category.displayName} — Premium Fashion`;
  return {
    title,
    description: category.description,
    alternates: { canonical: canonicalPath },
    openGraph: { type: "website", title, description: category.description, url: canonicalPath },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const liveCategory = await resolveCategoryBySlug(slug);
  if (!liveCategory) notFound();

  if (liveCategory !== "demo") {
    const products = unwrapCatalog(await listActiveProducts({ categoryId: liveCategory.id }));

    return (
      <>
        <CategoryBreadcrumbJsonLd slug={slug} name={liveCategory.name} />
        <CategoryPageShell
          category={mapCategoryToStructuredCategory(liveCategory)}
          liveProducts={products.map(mapCatalogProductToBuyerProduct)}
        />
      </>
    );
  }

  // Only reachable with the lib/catalog/demo-fallback switch on.
  const category = getStructuredCategoryBySlug(slug) ?? null;

  return (
    <>
      {category ? <CategoryBreadcrumbJsonLd slug={slug} name={category.displayName} /> : null}
      <CategoryPageShell category={category} />
    </>
  );
}

function CategoryBreadcrumbJsonLd({ slug, name }: { slug: string; name: string }) {
  const baseUrl = getSiteBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: new URL("/shop", baseUrl).toString() },
      { "@type": "ListItem", position: 2, name, item: new URL(`/categories/${slug}`, baseUrl).toString() },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
