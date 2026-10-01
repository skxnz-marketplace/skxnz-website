// Canonical PUBLIC catalogue reads (server only). Every buyer-facing surface
// reads catalogue data through this module.
//
// - Client: lib/supabase/public-catalog.ts (publishable key, no cookies), so
//   results never depend on who is signed in and RLS decides what is public.
//   Seller/admin reads stay in lib/catalog/queries.ts on the cookie client.
// - Results distinguish three states (docs/engineering/DATA_ARCHITECTURE.md):
//     { ok: true, data }  with data          → SUCCESS_WITH_DATA
//     { ok: true, data }  empty / null       → SUCCESS_EMPTY (a real answer)
//     { ok: false, error }                   → QUERY_ERROR (never "empty")
//   The full database error is logged here; callers only see the operation name.
// - Nothing here falls back to demo data. See lib/catalog/demo-fallback.ts.
import { createPublicCatalogClient } from "@/lib/supabase/public-catalog";
import type { Brand, Category, Product, ProductImage, ProductVariant, ProductWithRelations } from "./types";

export type CatalogError = {
  /** Which read failed, e.g. "brands.list". Safe to show in logs, not to users. */
  operation: string;
};

export type CatalogResult<T> = { ok: true; data: T } | { ok: false; error: CatalogError };

/** Thrown by unwrapCatalog(). Carries no database detail, only the operation. */
export class CatalogUnavailableError extends Error {
  readonly operation: string;
  constructor(operation: string) {
    super(`SKXNZ catalogue is temporarily unavailable (${operation}).`);
    this.name = "CatalogUnavailableError";
    this.operation = operation;
  }
}

/** For pages where the catalogue IS the content: an error becomes a 5xx via the
 * route's error boundary instead of a page that silently shows nothing/demo. */
export function unwrapCatalog<T>(result: CatalogResult<T>): T {
  if (result.ok) return result.data;
  throw new CatalogUnavailableError(result.error.operation);
}

const READ_TIMEOUT_MS = 8000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DbError = { code?: string; message?: string } | null;

function ok<T>(data: T): CatalogResult<T> {
  return { ok: true, data };
}

function fail<T>(operation: string, error: DbError | unknown): CatalogResult<T> {
  const detail = error && typeof error === "object" ? (error as { code?: string; message?: string }) : {};
  // Server log keeps the real cause (e.g. 42501 permission denied); the result does not.
  console.error(`[catalog] ${operation} failed`, detail.code ?? "", detail.message ?? String(error));
  return { ok: false, error: { operation } };
}

function db() {
  return createPublicCatalogClient();
}

function timeout() {
  return AbortSignal.timeout(READ_TIMEOUT_MS);
}

function groupByProductId<T extends { product_id: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.product_id);
    if (list) list.push(row);
    else map.set(row.product_id, [row]);
  }
  return map;
}

/** Brand, category, active variants and images for each product. Any relation
 * error fails the whole read: a product without its brand is not "live data". */
async function withRelations(operation: string, products: Product[]): Promise<CatalogResult<ProductWithRelations[]>> {
  if (products.length === 0) return ok([]);

  const supabase = db();
  const productIds = products.map((p) => p.id);
  const brandIds = [...new Set(products.map((p) => p.brand_id).filter((id): id is string => Boolean(id)))];
  const categoryIds = [...new Set(products.map((p) => p.category_id).filter((id): id is string => Boolean(id)))];
  const signal = timeout();

  try {
    const [brands, categories, variants, images] = await Promise.all([
      brandIds.length
        ? supabase.from("brands").select("*").in("id", brandIds).abortSignal(signal)
        : Promise.resolve({ data: [] as Brand[], error: null }),
      categoryIds.length
        ? supabase.from("categories").select("*").in("id", categoryIds).abortSignal(signal)
        : Promise.resolve({ data: [] as Category[], error: null }),
      supabase.from("product_variants").select("*").in("product_id", productIds).eq("is_active", true).abortSignal(signal),
      supabase.from("product_images").select("*").in("product_id", productIds).order("sort_order").abortSignal(signal),
    ]);

    const relationError = brands.error ?? categories.error ?? variants.error ?? images.error;
    if (relationError) return fail(`${operation}.relations`, relationError);

    const brandsById = new Map(((brands.data ?? []) as Brand[]).map((b) => [b.id, b]));
    const categoriesById = new Map(((categories.data ?? []) as Category[]).map((c) => [c.id, c]));
    const variantsByProduct = groupByProductId((variants.data ?? []) as ProductVariant[]);
    const imagesByProduct = groupByProductId((images.data ?? []) as ProductImage[]);

    return ok(
      products.map((product) => ({
        ...product,
        brand: product.brand_id ? brandsById.get(product.brand_id) ?? null : null,
        category: product.category_id ? categoriesById.get(product.category_id) ?? null : null,
        variants: variantsByProduct.get(product.id) ?? [],
        images: imagesByProduct.get(product.id) ?? [],
      })),
    );
  } catch (error) {
    return fail(`${operation}.relations`, error);
  }
}

// ── Brands ──────────────────────────────────────────────────────────────────

export async function listActiveBrands(): Promise<CatalogResult<Brand[]>> {
  try {
    const { data, error } = await db().from("brands").select("*").eq("is_active", true).order("name").abortSignal(timeout());
    return error ? fail("brands.list", error) : ok((data ?? []) as Brand[]);
  } catch (error) {
    return fail("brands.list", error);
  }
}

export async function findActiveBrandBySlug(slug: string): Promise<CatalogResult<Brand | null>> {
  try {
    const { data, error } = await db().from("brands").select("*").eq("slug", slug).eq("is_active", true).abortSignal(timeout()).maybeSingle();
    return error ? fail("brands.bySlug", error) : ok((data as Brand | null) ?? null);
  } catch (error) {
    return fail("brands.bySlug", error);
  }
}

// ── Categories ──────────────────────────────────────────────────────────────

export async function listActiveCategories(): Promise<CatalogResult<Category[]>> {
  try {
    const { data, error } = await db().from("categories").select("*").eq("is_active", true).order("sort_order").abortSignal(timeout());
    return error ? fail("categories.list", error) : ok((data ?? []) as Category[]);
  } catch (error) {
    return fail("categories.list", error);
  }
}

export async function findActiveCategoryBySlug(slug: string): Promise<CatalogResult<Category | null>> {
  try {
    const { data, error } = await db().from("categories").select("*").eq("slug", slug).eq("is_active", true).abortSignal(timeout()).maybeSingle();
    return error ? fail("categories.bySlug", error) : ok((data as Category | null) ?? null);
  } catch (error) {
    return fail("categories.bySlug", error);
  }
}

// ── Products ────────────────────────────────────────────────────────────────

type ProductFilter = { brandId?: string; categoryId?: string; limit?: number };

/** ACTIVE products, newest first, with relations. */
export async function listActiveProducts(filter: ProductFilter = {}): Promise<CatalogResult<ProductWithRelations[]>> {
  const operation = filter.brandId ? "products.byBrand" : filter.categoryId ? "products.byCategory" : "products.list";
  try {
    let query = db().from("products").select("*").eq("status", "ACTIVE").order("created_at", { ascending: false });
    if (filter.brandId) query = query.eq("brand_id", filter.brandId);
    if (filter.categoryId) query = query.eq("category_id", filter.categoryId);
    if (filter.limit) query = query.limit(filter.limit);
    const { data, error } = await query.abortSignal(timeout());
    if (error) return fail(operation, error);
    return withRelations(operation, (data ?? []) as Product[]);
  } catch (error) {
    return fail(operation, error);
  }
}

/** One ACTIVE product by slug, or by id when the key is a UUID. null = no such product. */
export async function findActiveProduct(slugOrId: string): Promise<CatalogResult<ProductWithRelations | null>> {
  const column = UUID.test(slugOrId) ? "id" : "slug";
  try {
    const { data, error } = await db().from("products").select("*").eq(column, slugOrId).eq("status", "ACTIVE").abortSignal(timeout()).maybeSingle();
    if (error) return fail("products.find", error);
    if (!data) return ok(null);
    const related = await withRelations("products.find", [data as Product]);
    return related.ok ? ok(related.data[0] ?? null) : related;
  } catch (error) {
    return fail("products.find", error);
  }
}

/** Homepage "Trending Now": admin-curated products (trending_sort_order, 0018)
 * first, then newest ACTIVE products fill the remaining slots. */
export async function listTrendingProducts(limit: number): Promise<CatalogResult<ProductWithRelations[]>> {
  try {
    const supabase = db();
    const curated = await supabase.from("products").select("*").eq("status", "ACTIVE")
      .not("trending_sort_order", "is", null).order("trending_sort_order", { ascending: true }).limit(limit).abortSignal(timeout());
    if (curated.error) return fail("products.trending", curated.error);

    const picked = (curated.data ?? []) as Product[];
    if (picked.length < limit) {
      let fill = supabase.from("products").select("*").eq("status", "ACTIVE").order("created_at", { ascending: false }).limit(limit);
      if (picked.length) fill = fill.not("id", "in", `(${picked.map((p) => p.id).join(",")})`);
      const filled = await fill.abortSignal(timeout());
      if (filled.error) return fail("products.trending", filled.error);
      picked.push(...((filled.data ?? []) as Product[]));
    }
    return withRelations("products.trending", picked.slice(0, limit));
  } catch (error) {
    return fail("products.trending", error);
  }
}

export type CatalogSearch = { products: ProductWithRelations[]; brands: Brand[]; categories: Category[] };

/** Buyer search over ACTIVE products (name/slug/subtitle/description) plus
 * active brands and categories by name/slug. Terms shorter than 2 chars → empty. */
export async function searchCatalog(term: string, limit = 8): Promise<CatalogResult<CatalogSearch>> {
  const cleaned = term.replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, " ");
  if (cleaned.length < 2) return ok({ products: [], brands: [], categories: [] });
  const pattern = `%${cleaned}%`;

  try {
    const supabase = db();
    const signal = timeout();
    const [products, brands, categories] = await Promise.all([
      supabase.from("products").select("*").eq("status", "ACTIVE")
        .or(`name.ilike.${pattern},slug.ilike.${pattern},subtitle.ilike.${pattern},description.ilike.${pattern}`)
        .order("created_at", { ascending: false }).limit(limit).abortSignal(signal),
      supabase.from("brands").select("*").eq("is_active", true).or(`name.ilike.${pattern},slug.ilike.${pattern}`).order("name").limit(limit).abortSignal(signal),
      supabase.from("categories").select("*").eq("is_active", true).or(`name.ilike.${pattern},slug.ilike.${pattern}`).order("sort_order").limit(limit).abortSignal(signal),
    ]);
    const error = products.error ?? brands.error ?? categories.error;
    if (error) return fail("search", error);

    const related = await withRelations("search", (products.data ?? []) as Product[]);
    if (!related.ok) return related;
    return ok({ products: related.data, brands: (brands.data ?? []) as Brand[], categories: (categories.data ?? []) as Category[] });
  } catch (error) {
    return fail("search", error);
  }
}
