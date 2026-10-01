// SERVER ONLY — SELLER / ADMIN catalogue reads on lib/supabase/server.ts (the
// signed-in user's cookies; RLS decides what they may see). Buyer-facing
// catalogue reads do NOT live here: they use lib/catalog/public-catalog.ts.
// The *Detail helpers return CatalogListResult so callers can tell an error
// from an empty list.
import { createClient } from "@/lib/supabase/server";
import { createPublicCatalogClient } from "@/lib/supabase/public-catalog";
import type { Brand, Category, Product, ProductVariant, ProductImage, ProductWithRelations } from "./types";

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  // Postgres 42P01 = undefined_table
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

/** Result that distinguishes a failed query from a genuinely empty table. */
export type CatalogListResult<T> = {
  data: T[];
  /** Supabase error message when the query itself failed; null when it ran. */
  error: string | null;
};

// Public catalog read — cookie-free for the same caching reason as
// getActiveProducts below. RLS still applies (same anon key).
export async function getActiveBrandsDetail(): Promise<CatalogListResult<Brand>> {
  const supabase = createPublicCatalogClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getActiveBrands failed:", error.message);
    }
    return { data: [], error: error.message };
  }
  return { data: data ?? [], error: null };
}

export async function getActiveCategoriesDetail(): Promise<CatalogListResult<Category>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getActiveCategories failed:", error.message);
    }
    return { data: [], error: error.message };
  }
  return { data: data ?? [], error: null };
}

export async function getSellerProductsWithRelations(): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getSellerProductsWithRelations failed:", error.message);
    }
    return [];
  }

  if (!products?.length) {
    return [];
  }

  const productIds = products.map((product) => product.id);
  const brandIds = [...new Set(products.map((product) => product.brand_id).filter(Boolean))] as string[];
  const categoryIds = [...new Set(products.map((product) => product.category_id).filter(Boolean))] as string[];

  const [
    { data: brands, error: brandsError },
    { data: categories, error: categoriesError },
    { data: variants, error: variantsError },
    { data: images, error: imagesError },
  ] = await Promise.all([
    brandIds.length
      ? supabase.from("brands").select("*").in("id", brandIds)
      : Promise.resolve({ data: [] as Brand[], error: null }),
    categoryIds.length
      ? supabase.from("categories").select("*").in("id", categoryIds)
      : Promise.resolve({ data: [] as Category[], error: null }),
    supabase.from("product_variants").select("*").in("product_id", productIds),
    supabase.from("product_images").select("*").in("product_id", productIds).order("sort_order"),
  ]);

  const relationError = brandsError ?? categoriesError ?? variantsError ?? imagesError;
  if (relationError) {
    if (!isMissingTableError(relationError)) {
      console.warn("[catalog] seller product relations failed:", relationError.message);
    }
    return [];
  }

  const brandsById = new Map((brands ?? []).map((brand) => [brand.id, brand as Brand]));
  const categoriesById = new Map((categories ?? []).map((category) => [category.id, category as Category]));
  const variantsByProductId = groupByProductId((variants ?? []) as ProductVariant[]);
  const imagesByProductId = groupByProductId((images ?? []) as ProductImage[]);

  return products.map((product) => ({
    ...(product as Product),
    brand: product.brand_id ? brandsById.get(product.brand_id) ?? null : null,
    category: product.category_id ? categoriesById.get(product.category_id) ?? null : null,
    variants: variantsByProductId.get(product.id) ?? [],
    images: imagesByProductId.get(product.id) ?? [],
  }));
}

export async function getAdminProductsForReview(): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .in("status", ["PENDING_REVIEW", "ACTIVE", "REJECTED", "ARCHIVED"])
    .order("updated_at", { ascending: false });

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getAdminProductsForReview failed:", error.message);
    }
    return [];
  }

  if (!products?.length) {
    return [];
  }

  const productIds = products.map((product) => product.id);
  const brandIds = [...new Set(products.map((product) => product.brand_id).filter(Boolean))] as string[];
  const categoryIds = [...new Set(products.map((product) => product.category_id).filter(Boolean))] as string[];

  const [
    { data: brands, error: brandsError },
    { data: categories, error: categoriesError },
    { data: variants, error: variantsError },
    { data: images, error: imagesError },
  ] = await Promise.all([
    brandIds.length
      ? supabase.from("brands").select("*").in("id", brandIds)
      : Promise.resolve({ data: [] as Brand[], error: null }),
    categoryIds.length
      ? supabase.from("categories").select("*").in("id", categoryIds)
      : Promise.resolve({ data: [] as Category[], error: null }),
    supabase.from("product_variants").select("*").in("product_id", productIds),
    supabase.from("product_images").select("*").in("product_id", productIds).order("sort_order"),
  ]);

  const relationError = brandsError ?? categoriesError ?? variantsError ?? imagesError;
  if (relationError) {
    if (!isMissingTableError(relationError)) {
      console.warn("[catalog] admin product relations failed:", relationError.message);
    }
    return [];
  }

  const brandsById = new Map((brands ?? []).map((brand) => [brand.id, brand as Brand]));
  const categoriesById = new Map((categories ?? []).map((category) => [category.id, category as Category]));
  const variantsByProductId = groupByProductId((variants ?? []) as ProductVariant[]);
  const imagesByProductId = groupByProductId((images ?? []) as ProductImage[]);

  return products.map((product) => ({
    ...(product as Product),
    brand: product.brand_id ? brandsById.get(product.brand_id) ?? null : null,
    category: product.category_id ? categoriesById.get(product.category_id) ?? null : null,
    variants: variantsByProductId.get(product.id) ?? [],
    images: imagesByProductId.get(product.id) ?? [],
  }));
}

function groupByProductId<T extends { product_id: string }>(rows: T[]) {
  return rows.reduce((map, row) => {
    const existing = map.get(row.product_id) ?? [];
    existing.push(row);
    map.set(row.product_id, existing);
    return map;
  }, new Map<string, T[]>());
}
