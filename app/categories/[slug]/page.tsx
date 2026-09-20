import { cache } from "react";
import type { Metadata } from "next";

import { CategoryPageShell } from "@/components/categories/category-page-shell";
import { structuredCategories } from "@/src/data/categories";
import { getStructuredCategoryBySlug } from "@/src/lib/catalog-content";
import { getActiveCategoryBySlug, getActiveProductsByCategoryId } from "@/lib/catalog/queries";
import { mapCatalogProductToBuyerProduct, mapCategoryToStructuredCategory } from "@/lib/catalog/mappers";
import { getSiteBaseUrl } from "@/lib/site";

export const revalidate = 300;

// PERF (D13-A): generateMetadata and the page body each looked the category up
// by slug, so every category page ran the query twice per request. React
// cache() dedupes it to one lookup per render pass. Request-scoped only — no
// cross-request staleness.
const resolveCategoryBySlug = cache((slug: string) => getActiveCategoryBySlug(slug));

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return [
    ...structuredCategories.map((category) => ({
      slug: category.slug,
    })),
    { slug: "women" },
    { slug: "ai-styled" },
    { slug: "shoes" },
  ];
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  const canonicalPath = `/categories/${slug}`;
  const liveCategory = await resolveCategoryBySlug(slug);
  if (liveCategory) {
    const title = `${liveCategory.name} — Premium Fashion`;
    const description = `Shop ${liveCategory.name} on SKXNZ — curated futurewear and premium fashion.`;
    return {
      title,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: { type: "website", title, description, url: canonicalPath },
    };
  }

  const category = getStructuredCategoryBySlug(slug);
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

  if (liveCategory) {
    const liveProducts = (await getActiveProductsByCategoryId(liveCategory.id)).map(
      mapCatalogProductToBuyerProduct,
    );

    return (
      <>
        <CategoryBreadcrumbJsonLd slug={slug} name={liveCategory.name} />
        <CategoryPageShell
          category={mapCategoryToStructuredCategory(liveCategory)}
          liveProducts={liveProducts}
        />
      </>
    );
  }

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
