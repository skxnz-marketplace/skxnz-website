import { structuredProducts } from "@/src/data/products";
import {
  resolveCategoryDisplayName,
  uniqueNonEmpty,
} from "@/src/lib/catalog-content";
import { ensureProductAsset } from "@/src/lib/assets";

export type SkxnzProductStatus = "draft" | "pending" | "active" | "rejected";

export type SkxnzProduct = {
  id: string;
  sellerId: string;
  brandId: string;
  brandSlug: string;
  brandName: string;
  productName: string;
  slug: string;
  category: string;
  subcategory: string;
  gender: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  images: string[];
  sizes: string[];
  colors: string[];
  description: string;
  shortDescription: string;
  tags: string[];
  inventory: number;
  status: SkxnzProductStatus;
  isFeatured: boolean;
  isLimitedEdition: boolean;
  isAIStyled: boolean;
  isNewSeason: boolean;
  collections: string[];
  searchKeywords: string[];
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
  sourceProductId: string;
};

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function resolveStatus(status: string): SkxnzProductStatus {
  const normalizedStatus = normalizeValue(status);

  if (normalizedStatus.includes("pending")) {
    return "pending";
  }

  if (normalizedStatus.includes("reject")) {
    return "rejected";
  }

  if (normalizedStatus.includes("draft")) {
    return "draft";
  }

  return "active";
}

function hasSignal(values: string[], signal: string) {
  const normalizedSignal = normalizeValue(signal);

  return values.some((value) => normalizeValue(value).includes(normalizedSignal));
}

function buildSearchKeywords(product: (typeof structuredProducts)[number]) {
  const displayCategory = resolveCategoryDisplayName(product.category);

  return uniqueNonEmpty([
    product.name,
    product.brandName,
    product.brandSlug,
    displayCategory,
    product.category,
    product.subcategory,
    product.gender,
    product.sku,
    product.shortDescription,
    product.description,
    product.priceInr ? String(product.priceInr) : null,
    product.salePriceInr ? String(product.salePriceInr) : null,
    ...product.collections,
    ...product.tags,
    ...product.availableSizes,
    ...product.availableColors,
    ...product.searchKeywords,
  ]);
}

function buildProductImages(product: (typeof structuredProducts)[number]) {
  const primaryImage = ensureProductAsset(product.image, product.slug);

  return uniqueNonEmpty([
    primaryImage,
    ...product.gallery.map((image) => ensureProductAsset(image)),
  ]);
}

export const skxnzProducts: SkxnzProduct[] = structuredProducts.map((product) => {
  const collectionsAndTags = uniqueNonEmpty([
    ...product.collections,
    ...product.tags,
    ...product.searchKeywords,
  ]);
  const currentPrice = product.salePriceInr ?? product.priceInr;

  return {
    id: product.slug,
    sellerId: `seller_profile_${product.brandSlug.replace(/-/g, "_")}`,
    brandId: product.brandId,
    brandSlug: product.brandSlug,
    brandName: product.brandName,
    productName: product.name,
    slug: product.slug,
    category: resolveCategoryDisplayName(product.category),
    subcategory: product.subcategory,
    gender: product.gender,
    price: currentPrice,
    compareAtPrice: product.salePriceInr ? product.priceInr : null,
    currency: product.currency || "INR",
    images: buildProductImages(product),
    sizes: product.availableSizes.length > 0 ? product.availableSizes : ["One Size"],
    colors: product.availableColors.length > 0 ? product.availableColors : ["Pearl Cream"],
    description: product.description,
    shortDescription: product.shortDescription,
    tags: uniqueNonEmpty([
      ...product.tags,
      product.subcategory,
      resolveCategoryDisplayName(product.category),
      product.brandName,
      product.gender,
      product.stockStatus,
      product.collectionSlug,
    ]),
    inventory: product.stockQuantity,
    status: resolveStatus(product.status),
    isFeatured: product.homepageDisplay || product.featured,
    isLimitedEdition: hasSignal(collectionsAndTags, "limited edition"),
    isAIStyled: hasSignal(collectionsAndTags, "ai styl"),
    isNewSeason: hasSignal(collectionsAndTags, "new season"),
    collections: product.collections,
    searchKeywords: buildSearchKeywords(product),
    createdAt: product.createdDate,
    updatedAt: product.createdDate,
    isDemo: true,
    sourceProductId: product.sourceProductId,
  };
});

export const activeSkxnzProducts = skxnzProducts.filter(
  (product) => product.status === "active",
);

export const featuredSkxnzProducts = activeSkxnzProducts.filter(
  (product) => product.isFeatured,
);

export const skxnzProductCategories = Array.from(
  new Set(skxnzProducts.map((product) => product.category)),
);
