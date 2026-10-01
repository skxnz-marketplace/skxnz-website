// The catalogue the buyer AI engines (assistant panel, outfit builder) work
// from: the LIVE Supabase catalogue via lib/catalog/public-catalog. Server only.
import { isDemoCatalogueEnabled } from "@/lib/catalog/demo-fallback";
import { mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";
import { CatalogUnavailableError, listActiveBrands, listActiveProducts } from "@/lib/catalog/public-catalog";
import { demoAiCatalog, toAiCatalogProduct, type AiCatalog } from "@/src/lib/ai/catalog";

/** Throws CatalogUnavailableError on a catalogue error (never falls back to the
 * generated catalogue unless lib/catalog/demo-fallback is enabled). */
export async function loadAiCatalog(): Promise<AiCatalog> {
  const [products, brands] = await Promise.all([listActiveProducts(), listActiveBrands()]);

  if (products.ok && brands.ok) {
    return {
      products: products.data.map((product) => toAiCatalogProduct(mapCatalogProductToBuyerProduct(product))),
      brands: brands.data.map((brand) => ({
        name: brand.name,
        slug: brand.slug,
        shortDescription: brand.description ?? undefined,
        searchKeywords: [brand.name, brand.slug],
        categories: [],
      })),
    };
  }

  if (isDemoCatalogueEnabled()) return demoAiCatalog;
  throw new CatalogUnavailableError(!products.ok ? products.error.operation : !brands.ok ? brands.error.operation : "ai.catalog");
}
