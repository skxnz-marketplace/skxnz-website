import type { Metadata } from "next";

import { CategoryPageShell } from "@/components/categories/category-page-shell";
import { structuredCategories } from "@/src/data/categories";
import { getStructuredCategoryBySlug } from "@/src/lib/catalog-content";

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
  const category = getStructuredCategoryBySlug(slug) ?? null;

  return <CategoryPageShell category={category} />;
}
