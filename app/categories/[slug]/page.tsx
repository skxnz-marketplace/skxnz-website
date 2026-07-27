import { cache } from "react";
import type { Metadata } from "next";

import { CategoryPageShell } from "@/components/categories/category-page-shell";
import { structuredCategories } from "@/src/data/categories";
import { getStructuredCategoryBySlug } from "@/src/lib/catalog-content";
import { getActiveCategoryBySlug, getActiveProductsByCategoryId } from "@/lib/catalog/queries";
import { mapCatalogProductToBuyerProduct, mapCategoryToStructuredCategory } from "@/lib/catalog/mappers";

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

  const liveCategory = await resolveCategoryBySlug(slug);
  if (liveCategory) {
    return {
      title: liveCategory.name,
      description: `Live SKXNZ catalog category: ${liveCategory.name}.`,
    };
  }

  const category = getStructuredCategoryBySlug(slug);
  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: category.displayName,
    description: category.description,
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
      <CategoryPageShell
        category={mapCategoryToStructuredCategory(liveCategory)}
        liveProducts={liveProducts}
      />
    );
  }

  const category = getStructuredCategoryBySlug(slug) ?? null;

  return <CategoryPageShell category={category} />;
}
