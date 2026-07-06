// Converts Supabase catalog rows into the shapes existing homepage
// components already expect (lib/home-data.ts). Keeps UI components
// unaware of where data came from.
import type { HomeProduct, BrandLabel } from "@/lib/home-data";
import { fallbackProductImage, type Product as BuyerProduct } from "@/lib/data/products";
import type { DemoBrand } from "@/lib/data/brands";
import type { StructuredCategory } from "@/src/data/categories";
import type { Brand, Category, Product, ProductWithRelations } from "./types";

export function mapProductToHomeProduct(
  product: Product,
  brandNameById: Map<string, string>,
): HomeProduct {
  const brandName = (product.brand_id && brandNameById.get(product.brand_id)) || "SKXNZ";

  return {
    id: product.id,
    brand: brandName,
    name: product.name,
    price: product.price_inr * 100, // price_inr is whole rupees; HomeProduct.price is paise
    oldPrice: product.compare_at_price_inr != null ? product.compare_at_price_inr * 100 : undefined,
    href: "/shop",
    image: product.image_url ?? "",
  };
}

export function mapBrandToBrandLabel(brand: Brand): BrandLabel {
  const monogram = brand.name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return { name: brand.name.toUpperCase(), monogram };
}

/** Maps a live Supabase brand row into the DemoBrand shape the brand pages
 * already render, so brand-page-shell / brands-index-shell need no redesign.
 * productCount must come from a real ACTIVE product query — never invented. */
export function mapBrandToDemoBrand(brand: Brand, productCount: number): DemoBrand {
  return {
    id: brand.id,
    slug: brand.slug,
    name: brand.name,
    category: "Live Catalog",
    tagline: brand.description ?? "SKXNZ live catalog brand.",
    shortDescription: brand.description ?? "Live SKXNZ catalog brand.",
    logo: brand.logo_url ?? "",
    logoType: "Live",
    heroImage: brand.hero_image_url ?? "",
    accentColor: "#2E1014",
    featured: false,
    isFeatured: false,
    isTopBrand: false,
    isLuxury: false,
    isStreetwear: false,
    isNew: false,
    isDemo: false,
    country: "",
    productCount,
    description: brand.description ?? "",
    availabilityNote: "Live SKXNZ catalog brand.",
    heroProductId: "",
    categories: [],
    searchKeywords: [brand.slug, brand.name],
    tags: [],
    createdAt: brand.created_at,
    updatedAt: brand.updated_at,
  };
}

/** Maps a live Supabase category row into the StructuredCategory shape the
 * category shell already renders, so category-page-shell needs no redesign.
 * dataSource stays "sheet" (the only literal the shared type allows) — it is
 * internal bookkeeping only and never rendered to buyers. */
export function mapCategoryToStructuredCategory(category: Category): StructuredCategory {
  return {
    id: category.id,
    sourceCategoryId: category.id,
    name: category.name,
    displayName: category.name,
    slug: category.slug,
    description: `Live SKXNZ catalog category: ${category.name}.`,
    image: "",
    href: `/categories/${category.slug}`,
    displayOrder: category.sort_order,
    featured: false,
    searchKeywords: [category.name, category.slug],
    status: category.is_active ? "Active" : "Inactive",
    dataSource: "sheet",
  };
}

export function mapCatalogProductToBuyerProduct(
  product: ProductWithRelations,
): BuyerProduct {
  const brandName = product.brand?.name ?? "SKXNZ";
  const brandSlug = product.brand?.slug ?? "skxnz";
  const categoryName = product.category?.name ?? "Product";
  const categorySlug = product.category?.slug ?? "product";
  const sortedImages = [...product.images].sort((left, right) => left.sort_order - right.sort_order);
  const gallery = sortedImages.map((image) => image.url);
  const primaryImage = gallery[0] ?? product.image_url ?? fallbackProductImage;
  const sizes = uniqueValues(product.variants.map((variant) => variant.size));
  const colors = uniqueValues(product.variants.map((variant) => variant.color));
  const stock = product.variants.reduce((total, variant) => total + variant.stock_quantity, 0);
  const description = product.description ?? product.subtitle ?? product.name;

  return {
    id: product.id,
    slug: product.slug,
    sellerProfileId: product.seller_id ?? "live-catalog",
    categoryId: product.category_id ?? categorySlug,
    brandId: product.brand_id ?? brandSlug,
    brandSlug,
    brandName,
    name: product.name,
    shortDescription: product.subtitle ?? description,
    price: product.price_inr,
    priceCents: product.price_inr * 100,
    salePrice: null,
    category: categoryName,
    subcategory: categoryName,
    subtitle: product.subtitle ?? categoryName,
    description,
    gradient: "from-warmivory via-transparent to-sandstone/35",
    accent: colors[0] ?? "SKXNZ",
    seller: brandName,
    deliveryWindow: "Delivery preview pending checkout and operations launch.",
    features: [
      product.is_featured ? "Featured SKXNZ catalog product." : "",
      product.is_limited ? "Limited SKXNZ catalog product." : "",
      "Live Supabase catalog record.",
    ].filter(Boolean),
    materials: [],
    sizes: sizes.length ? sizes : ["One Size"],
    colors: colors.length ? colors : ["Default"],
    stock,
    inventoryCount: stock,
    status: "Approved Preview",
    launchNote: "Live Supabase catalog product.",
    fabric: "Catalog item",
    fit: "Standard",
    tags: product.tags,
    collections: [
      product.is_featured ? "Featured" : "",
      product.is_limited ? "Limited Edition" : "",
    ].filter(Boolean),
    searchAliases: [product.slug, brandName, categoryName, ...product.tags],
    image: primaryImage,
    gallery: gallery.length ? gallery : [primaryImage],
    imageUrl: primaryImage,
    submittedAt: product.created_at,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

function uniqueValues(values: Array<string | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
