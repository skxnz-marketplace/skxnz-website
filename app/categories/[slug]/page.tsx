import type { Metadata } from "next";

import { CategoryPageShell } from "@/components/categories/category-page-shell";
import { structuredCategories } from "@/src/data/categories";
import { getStructuredCategoryBySlug } from "@/src/lib/catalog-content";
import { getActiveCategoryBySlug, getActiveProductsByCategoryId } from "@/lib/catalog/queries";
import { mapCatalogProductToBuyerProduct, mapCategoryToStructuredCategory } from "@/lib/catalog/mappers";

export const revalidate = 300;

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

  const liveCategory = await getActiveCategoryBySlug(slug);
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

  const liveCategory = await getActiveCategoryBySlug(slug);

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
