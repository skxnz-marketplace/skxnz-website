import { cache } from "react";
import type { Metadata } from "next";

import { ProductDetailShell } from "@/components/buyer/product-detail-shell";
import { mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";
import {
  getActiveProductBySlug,
  getActiveProductsWithRelations,
  getProductById,
} from "@/lib/catalog/queries";
import {
  getProductById as getSeedProductById,
  products,
  type Product,
} from "@/lib/data/products";

export const revalidate = 300;
const LIVE_PRODUCT_LOOKUP_TIMEOUT_MS = 2500;

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateStaticParams() {
  return products.map((product) => ({
    id: product.id,
  }));
}

async function resolveLiveProduct(id: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();

  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn("[product] live product lookup timed out; falling back to local product data.");
      controller.abort();
      resolve(null);
    }, LIVE_PRODUCT_LOOKUP_TIMEOUT_MS);
  });

  const lookup = async () =>
    (await getActiveProductBySlug(id, controller.signal)) ??
    (await getProductById(id, controller.signal));

  try {
    return await Promise.race([lookup(), timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

// PERF (D13-A): generateMetadata AND the page body both resolve the same
// product for one request. Each call was up to two sequential Supabase lookups
// (slug then id) plus their relation fetches and a 2.5s timeout race, so the
// page paid that cost twice. React cache() memoizes per render pass, keyed by
// id, so the second caller reuses the first's promise. This is request-scoped
// only — it never persists across requests, so it cannot serve stale product
// data. Behaviour is identical; the work happens once.
const resolveProduct = cache(async (id: string): Promise<Product | null> => {
  try {
    const liveProduct = await resolveLiveProduct(id);

    if (liveProduct) {
      return mapCatalogProductToBuyerProduct(liveProduct);
    }
  } catch (err) {
    console.warn("[product] falling back to local product data:", err);
  }

  return getSeedProductById(id) ?? null;
});

/** Live catalog products related to a live product — same category first, then
 * the latest actives. Never demo products, so a live PDP stays consistent. */
async function resolveLiveSimilarProducts(product: Product): Promise<Product[]> {
  if (product.dataSource !== "live") {
    return [];
  }

  try {
    const timeout = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), LIVE_PRODUCT_LOOKUP_TIMEOUT_MS);
    });
    const candidates = await Promise.race([getActiveProductsWithRelations(), timeout]);

    if (!candidates) {
      return [];
    }

    const others = candidates.filter((candidate) => candidate.id !== product.id);
    const sameCategory = others.filter(
      (candidate) => candidate.category_id != null && candidate.category_id === product.categoryId,
    );
    const rest = others.filter((candidate) => !sameCategory.includes(candidate));

    return [...sameCategory, ...rest].slice(0, 3).map(mapCatalogProductToBuyerProduct);
  } catch (err) {
    console.warn("[product] live similar products unavailable:", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await resolveProduct(id);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await resolveProduct(id);
  const liveSimilarProducts = product ? await resolveLiveSimilarProducts(product) : [];

  return (
    <ProductDetailShell
      productId={id}
      seedProduct={product}
      liveSimilarProducts={liveSimilarProducts}
    />
  );
}
