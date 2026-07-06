// SERVER ONLY — uses lib/supabase/server.ts (anon key + cookies, RLS enforced).
// Every function here is defensive: if the catalog tables don't exist yet
// (migration not applied), we log a warning and return an empty/null result
// instead of throwing, so pages relying on lib/home-data.ts keep rendering.
import { createClient } from "@/lib/supabase/server";
import type { Brand, Category, Product, ProductVariant, ProductImage, ProductWithRelations } from "./types";

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  // Postgres 42P01 = undefined_table
  return error.code === "42P01" || Boolean(error.message?.includes("does not exist"));
}

function withAbortSignal<T>(
  query: T,
  signal?: AbortSignal,
) {
  if (!signal || typeof (query as { abortSignal?: unknown }).abortSignal !== "function") {
    return query;
  }

  return (query as { abortSignal: (signal: AbortSignal) => T }).abortSignal(signal);
}

/** Result that distinguishes a failed query from a genuinely empty table. */
export type CatalogListResult<T> = {
  data: T[];
  /** Supabase error message when the query itself failed; null when it ran. */
  error: string | null;
};

export async function getActiveBrandsDetail(): Promise<CatalogListResult<Brand>> {
  const supabase = await createClient();
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

export async function getActiveBrands(): Promise<Brand[]> {
  return (await getActiveBrandsDetail()).data;
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

export async function getActiveCategories(): Promise<Category[]> {
  return (await getActiveCategoriesDetail()).data;
}

export async function getActiveCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getActiveCategoryBySlug failed:", error.message);
    }
    return null;
  }
  return (data as Category | null) ?? null;
}

/** ACTIVE products for one category id, with brand/variant/image relations. */
export async function getActiveProductsByCategoryId(categoryId: string): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getActiveProductsByCategoryId failed:", error.message);
    }
    return [];
  }

  if (!products?.length) {
    return [];
  }

  const productIds = products.map((product) => product.id);
  const brandIds = [...new Set(products.map((product) => product.brand_id).filter(Boolean))] as string[];

  const [
    { data: category },
    { data: brands, error: brandsError },
    { data: variants, error: variantsError },
    { data: images, error: imagesError },
  ] = await Promise.all([
    supabase.from("categories").select("*").eq("id", categoryId).maybeSingle(),
    brandIds.length
      ? supabase.from("brands").select("*").in("id", brandIds).eq("is_active", true)
      : Promise.resolve({ data: [] as Brand[], error: null }),
    supabase.from("product_variants").select("*").in("product_id", productIds).eq("is_active", true),
    supabase.from("product_images").select("*").in("product_id", productIds).order("sort_order"),
  ]);

  const relationError = brandsError ?? variantsError ?? imagesError;
  if (relationError) {
    if (!isMissingTableError(relationError)) {
      console.warn("[catalog] category product relations failed:", relationError.message);
    }
    return [];
  }

  const brandsById = new Map((brands ?? []).map((brand) => [brand.id, brand as Brand]));
  const variantsByProductId = groupByProductId((variants ?? []) as ProductVariant[]);
  const imagesByProductId = groupByProductId((images ?? []) as ProductImage[]);
  const categoryRelation = (category as Category | null) ?? null;

  return products.map((product) => ({
    ...(product as Product),
    brand: product.brand_id ? brandsById.get(product.brand_id) ?? null : null,
    category: categoryRelation,
    variants: variantsByProductId.get(product.id) ?? [],
    images: imagesByProductId.get(product.id) ?? [],
  }));
}

export async function getActiveBrandBySlug(slug: string): Promise<Brand | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getActiveBrandBySlug failed:", error.message);
    }
    return null;
  }
  return (data as Brand | null) ?? null;
}

/** ACTIVE products for one brand id, with category/variant/image relations. */
export async function getActiveProductsByBrandId(brandId: string): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getActiveProductsByBrandId failed:", error.message);
    }
    return [];
  }

  if (!products?.length) {
    return [];
  }

  const productIds = products.map((product) => product.id);
  const categoryIds = [...new Set(products.map((product) => product.category_id).filter(Boolean))] as string[];

  const [
    { data: brand },
    { data: categories, error: categoriesError },
    { data: variants, error: variantsError },
    { data: images, error: imagesError },
  ] = await Promise.all([
    supabase.from("brands").select("*").eq("id", brandId).maybeSingle(),
    categoryIds.length
      ? supabase.from("categories").select("*").in("id", categoryIds).eq("is_active", true)
      : Promise.resolve({ data: [] as Category[], error: null }),
    supabase.from("product_variants").select("*").in("product_id", productIds).eq("is_active", true),
    supabase.from("product_images").select("*").in("product_id", productIds).order("sort_order"),
  ]);

  const relationError = categoriesError ?? variantsError ?? imagesError;
  if (relationError) {
    if (!isMissingTableError(relationError)) {
      console.warn("[catalog] brand product relations failed:", relationError.message);
    }
    return [];
  }

  const categoriesById = new Map((categories ?? []).map((category) => [category.id, category as Category]));
  const variantsByProductId = groupByProductId((variants ?? []) as ProductVariant[]);
  const imagesByProductId = groupByProductId((images ?? []) as ProductImage[]);
  const brandRelation = (brand as Brand | null) ?? null;

  return products.map((product) => ({
    ...(product as Product),
    brand: brandRelation,
    category: product.category_id ? categoriesById.get(product.category_id) ?? null : null,
    variants: variantsByProductId.get(product.id) ?? [],
    images: imagesByProductId.get(product.id) ?? [],
  }));
}

export async function getActiveProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false });

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getActiveProducts failed:", error.message);
    }
    return [];
  }
  return data ?? [];
}

export async function getActiveProductsWithRelations(): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false });

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getActiveProductsWithRelations failed:", error.message);
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
      ? supabase.from("brands").select("*").in("id", brandIds).eq("is_active", true)
      : Promise.resolve({ data: [] as Brand[], error: null }),
    categoryIds.length
      ? supabase.from("categories").select("*").in("id", categoryIds).eq("is_active", true)
      : Promise.resolve({ data: [] as Category[], error: null }),
    supabase.from("product_variants").select("*").in("product_id", productIds).eq("is_active", true),
    supabase.from("product_images").select("*").in("product_id", productIds).order("sort_order"),
  ]);

  const relationError = brandsError ?? categoriesError ?? variantsError ?? imagesError;
  if (relationError) {
    if (!isMissingTableError(relationError)) {
      console.warn("[catalog] active product relations failed:", relationError.message);
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

export async function getProductBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const { data: product, error } = await withAbortSignal(
    supabase.from("products").select("*").eq("slug", slug).eq("status", "ACTIVE").maybeSingle(),
    signal,
  );

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getProductBySlug failed:", error.message);
    }
    return null;
  }
  if (!product) return null;

  const [{ data: brand }, { data: category }, { data: variants }, { data: images }] =
    await Promise.all([
      product.brand_id
        ? withAbortSignal(
            supabase.from("brands").select("*").eq("id", product.brand_id).maybeSingle(),
            signal,
          )
        : Promise.resolve({ data: null }),
      product.category_id
        ? withAbortSignal(
            supabase.from("categories").select("*").eq("id", product.category_id).maybeSingle(),
            signal,
          )
        : Promise.resolve({ data: null }),
      withAbortSignal(
        supabase.from("product_variants").select("*").eq("product_id", product.id).eq("is_active", true),
        signal,
      ),
      withAbortSignal(
        supabase.from("product_images").select("*").eq("product_id", product.id).order("sort_order"),
        signal,
      ),
    ]);

  return {
    ...product,
    brand: (brand as Brand | null) ?? null,
    category: (category as Category | null) ?? null,
    variants: (variants as ProductVariant[] | null) ?? [],
    images: (images as ProductImage[] | null) ?? [],
  };
}

export async function getActiveProductBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<ProductWithRelations | null> {
  return getProductBySlug(slug, signal);
}

export async function getProductById(
  id: string,
  signal?: AbortSignal,
): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const { data: product, error } = await withAbortSignal(
    supabase.from("products").select("*").eq("id", id).eq("status", "ACTIVE").maybeSingle(),
    signal,
  );

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getProductById failed:", error.message);
    }
    return null;
  }
  if (!product) return null;

  const [{ data: brand }, { data: category }, { data: variants }, { data: images }] =
    await Promise.all([
      product.brand_id
        ? withAbortSignal(
            supabase.from("brands").select("*").eq("id", product.brand_id).maybeSingle(),
            signal,
          )
        : Promise.resolve({ data: null }),
      product.category_id
        ? withAbortSignal(
            supabase.from("categories").select("*").eq("id", product.category_id).maybeSingle(),
            signal,
          )
        : Promise.resolve({ data: null }),
      withAbortSignal(
        supabase.from("product_variants").select("*").eq("product_id", product.id).eq("is_active", true),
        signal,
      ),
      withAbortSignal(
        supabase.from("product_images").select("*").eq("product_id", product.id).order("sort_order"),
        signal,
      ),
    ]);

  return {
    ...product,
    brand: (brand as Brand | null) ?? null,
    category: (category as Category | null) ?? null,
    variants: (variants as ProductVariant[] | null) ?? [],
    images: (images as ProductImage[] | null) ?? [],
  };
}

/** Search result that distinguishes a failed live query from zero matches. */
export type CatalogSearchResult = {
  products: ProductWithRelations[];
  /** true when the live query executed successfully (even with 0 rows). */
  live: boolean;
};

/** ACTIVE products matching a buyer search term (name/slug/subtitle/description
 * substring match). Sanitizes the term for PostgREST `or=` syntax. */
export async function searchActiveProducts(term: string, limit = 8): Promise<CatalogSearchResult> {
  const cleaned = term.replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, " ");
  if (cleaned.length < 2) {
    return { products: [], live: true };
  }

  const supabase = await createClient();
  const pattern = `%${cleaned}%`;
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .or(
      `name.ilike.${pattern},slug.ilike.${pattern},subtitle.ilike.${pattern},description.ilike.${pattern}`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] searchActiveProducts failed:", error.message);
    }
    return { products: [], live: false };
  }

  if (!products?.length) {
    return { products: [], live: true };
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
      ? supabase.from("brands").select("*").in("id", brandIds).eq("is_active", true)
      : Promise.resolve({ data: [] as Brand[], error: null }),
    categoryIds.length
      ? supabase.from("categories").select("*").in("id", categoryIds).eq("is_active", true)
      : Promise.resolve({ data: [] as Category[], error: null }),
    supabase.from("product_variants").select("*").in("product_id", productIds).eq("is_active", true),
    supabase.from("product_images").select("*").in("product_id", productIds).order("sort_order"),
  ]);

  const relationError = brandsError ?? categoriesError ?? variantsError ?? imagesError;
  if (relationError) {
    if (!isMissingTableError(relationError)) {
      console.warn("[catalog] search product relations failed:", relationError.message);
    }
    return { products: [], live: false };
  }

  const brandsById = new Map((brands ?? []).map((brand) => [brand.id, brand as Brand]));
  const categoriesById = new Map((categories ?? []).map((category) => [category.id, category as Category]));
  const variantsByProductId = groupByProductId((variants ?? []) as ProductVariant[]);
  const imagesByProductId = groupByProductId((images ?? []) as ProductImage[]);

  return {
    live: true,
    products: products.map((product) => ({
      ...(product as Product),
      brand: product.brand_id ? brandsById.get(product.brand_id) ?? null : null,
      category: product.category_id ? categoriesById.get(product.category_id) ?? null : null,
      variants: variantsByProductId.get(product.id) ?? [],
      images: imagesByProductId.get(product.id) ?? [],
    })),
  };
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .eq("is_featured", true)
    .order("created_at", { ascending: false });

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getFeaturedProducts failed:", error.message);
    }
    return [];
  }
  return data ?? [];
}

export async function getLimitedProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .eq("is_limited", true)
    .order("created_at", { ascending: false });

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[catalog] getLimitedProducts failed:", error.message);
    }
    return [];
  }
  return data ?? [];
}

function groupByProductId<T extends { product_id: string }>(rows: T[]) {
  return rows.reduce((map, row) => {
    const existing = map.get(row.product_id) ?? [];
    existing.push(row);
    map.set(row.product_id, existing);
    return map;
  }, new Map<string, T[]>());
}
