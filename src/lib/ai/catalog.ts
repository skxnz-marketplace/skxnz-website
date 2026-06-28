import {
  aiOutfitMetadata,
  type AiOutfitMetadata,
} from "@/src/data/aiOutfitMetadata";
import { structuredBrands } from "@/src/data/brands";
import { structuredCategories } from "@/src/data/categories";
import { structuredCollections } from "@/src/data/collections";
import { structuredProducts } from "@/src/data/products";
import {
  controlledSkxnzPlaceholderImage,
  ensureCatalogImage,
  normalizeCatalogValue,
  uniqueNonEmpty,
} from "@/src/lib/catalog-content";

export type AiCatalogProduct = {
  id: string;
  slug: string;
  name: string;
  brandId: string;
  brandSlug: string;
  brandName: string;
  category: string;
  subcategory: string;
  gender: string;
  collections: string[];
  price: number;
  salePrice: number | null;
  effectivePrice: number;
  description: string;
  shortDescription: string;
  image: string;
  gallery: string[];
  sizes: string[];
  colors: string[];
  stockQuantity: number;
  stockStatus: string;
  tags: string[];
  searchKeywords: string[];
  href: string;
  metadata: AiOutfitMetadata | null;
};

const aiMetadataById = new Map(
  aiOutfitMetadata.map((item) => [item.productId, item] as const),
);

export const aiCatalogProducts: AiCatalogProduct[] = structuredProducts.map((product) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  brandId: product.brandId,
  brandSlug: product.brandSlug,
  brandName: product.brandName,
  category: product.category,
  subcategory: product.subcategory,
  gender: product.gender,
  collections: product.collections,
  price: product.priceInr,
  salePrice: product.salePriceInr,
  effectivePrice: product.salePriceInr ?? product.priceInr,
  description: product.description,
  shortDescription: product.shortDescription,
  image: ensureCatalogImage(product.image),
  gallery: product.gallery.map((entry) => ensureCatalogImage(entry)),
  sizes: product.availableSizes,
  colors: product.availableColors,
  stockQuantity: product.stockQuantity,
  stockStatus: product.stockStatus,
  tags: product.tags,
  searchKeywords: uniqueNonEmpty([
    ...product.searchKeywords,
    ...product.tags,
    ...product.collections,
    product.brandName,
    product.category,
    product.subcategory,
    product.gender,
  ]),
  href: `/product/${product.slug}`,
  metadata: aiMetadataById.get(product.id) ?? null,
}));

export function getAiCatalogProductBySlug(slug: string) {
  const normalizedSlug = normalizeCatalogValue(slug);

  return (
    aiCatalogProducts.find((product) => normalizeCatalogValue(product.slug) === normalizedSlug) ??
    null
  );
}

export function getAiCatalogProductsByBrandSlug(brandSlug: string) {
  const normalizedBrandSlug = normalizeCatalogValue(brandSlug);

  return aiCatalogProducts.filter(
    (product) => normalizeCatalogValue(product.brandSlug) === normalizedBrandSlug,
  );
}

export function getAiCatalogProductsByCategorySlug(categorySlug: string) {
  const category = structuredCategories.find(
    (entry) => normalizeCatalogValue(entry.slug) === normalizeCatalogValue(categorySlug),
  );

  if (!category) {
    return [];
  }

  const candidates = new Set(
    [category.name, category.displayName, ...category.searchKeywords].map((entry) =>
      normalizeCatalogValue(entry),
    ),
  );

  return aiCatalogProducts.filter((product) =>
    candidates.has(normalizeCatalogValue(product.category)),
  );
}

export function getActiveAiCatalogProducts() {
  return aiCatalogProducts.filter(
    (product) =>
      product.stockQuantity > 0 &&
      !normalizeCatalogValue(product.stockStatus).includes("out of stock"),
  );
}

export function getAiBrandBySlug(slug: string) {
  return (
    structuredBrands.find((brand) => normalizeCatalogValue(brand.slug) === normalizeCatalogValue(slug)) ??
    null
  );
}

export function getAiCategoryBySlug(slug: string) {
  return (
    structuredCategories.find(
      (category) => normalizeCatalogValue(category.slug) === normalizeCatalogValue(slug),
    ) ?? null
  );
}

export function getAiCollectionBySlug(slug: string) {
  return (
    structuredCollections.find(
      (collection) => normalizeCatalogValue(collection.slug) === normalizeCatalogValue(slug),
    ) ?? null
  );
}

export function getAiProductSearchTerms(product: AiCatalogProduct) {
  return uniqueNonEmpty([
    product.name,
    product.brandName,
    product.brandSlug,
    product.category,
    product.subcategory,
    product.description,
    product.shortDescription,
    ...product.tags,
    ...product.collections,
    ...product.colors,
    ...product.searchKeywords,
    ...(product.metadata?.styleTags ?? []),
    ...(product.metadata?.occasionTags ?? []),
    ...(product.metadata?.colorFamily ?? []),
    product.metadata?.itemType,
    product.metadata?.fitType,
    product.metadata?.budgetRange,
    product.gender,
    `${product.effectivePrice}`,
    `₹${product.effectivePrice}`,
  ]);
}

export function buildAiCatalogImage(image?: string | null) {
  return ensureCatalogImage(image ?? controlledSkxnzPlaceholderImage);
}
