import { structuredCategories, type StructuredCategory } from "@/src/data/categories";
import {
  ensureProductAsset,
  skxnzFallbackAssets,
} from "@/src/lib/assets";

export const controlledSkxnzPlaceholderImage =
  skxnzFallbackAssets.product;

export const controlledSkxnzBrandPlaceholder =
  skxnzFallbackAssets.brand;

function compactWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeCatalogValue(value: string) {
  return compactWhitespace(value).toLowerCase();
}

export function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

export function ensureCatalogImage(value?: string | null) {
  return ensureProductAsset(value);
}

export function getCategoryPageHref(slug: string) {
  if (slug === "woman") return "/categories/women";
  if (slug === "ai-stylised") return "/categories/ai-styled";
  if (slug === "footwear") return "/categories/shoes";

  return `/categories/${slug}`;
}

export function getStructuredCategoryBySlug(slug: string) {
  const normalizedSlug = normalizeCatalogValue(slug);
  const aliasMap: Record<string, string> = {
    women: "woman",
    "ai-styled": "ai-stylised",
    shoes: "footwear",
  };
  const resolvedSlug = aliasMap[normalizedSlug] ?? normalizedSlug;

  return structuredCategories.find(
    (category) => normalizeCatalogValue(category.slug) === resolvedSlug,
  );
}

export function getStructuredCategoryByValue(value: string) {
  const normalizedValue = normalizeCatalogValue(value);

  return structuredCategories.find((category) => {
    const candidates = [
      category.slug,
      category.name,
      category.displayName,
      ...category.searchKeywords,
    ];

    return candidates.some(
      (candidate) => normalizeCatalogValue(candidate) === normalizedValue,
    );
  });
}

export function resolveCategoryDisplayName(value: string) {
  return getStructuredCategoryByValue(value)?.displayName ?? compactWhitespace(value);
}

export function resolveCategorySlug(value: string) {
  return (
    getStructuredCategoryByValue(value)?.slug ??
    compactWhitespace(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

export function getFeaturedStructuredCategories() {
  return structuredCategories.filter((category) => category.featured);
}

export function getCategorySearchTerms(category: StructuredCategory) {
  return uniqueNonEmpty([
    category.name,
    category.displayName,
    category.slug,
    ...category.searchKeywords,
  ]);
}
