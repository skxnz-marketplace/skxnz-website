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
import { getSiteBaseUrl } from "@/lib/site";

/** Meta descriptions read best under ~155 chars — trims on a word boundary
 * rather than mid-word. */
function truncateDescription(text: string, maxLength = 155): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`;
}

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
      // A missing/renamed product id is thin, non-canonical content —
      // never worth indexing under whatever URL a visitor happened to try.
      robots: { index: false, follow: true },
    };
  }

  // The PDP resolves by slug OR id (see resolveLiveProduct above), so the
  // same product is reachable at two URLs. Canonical always points at the
  // slug form to avoid duplicate-content signals.
  const canonicalPath = `/product/${product.slug}`;
  const description = truncateDescription(
    product.description || product.shortDescription || product.name,
  );
  const image = product.image || product.imageUrl;

  return {
    title: product.name,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: canonicalPath,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await resolveProduct(id);
  const liveSimilarProducts = product ? await resolveLiveSimilarProducts(product) : [];

  return (
    <>
      {product ? <ProductJsonLd product={product} /> : null}
      <ProductDetailShell
        productId={id}
        seedProduct={product}
        liveSimilarProducts={liveSimilarProducts}
      />
    </>
  );
}

/** Product + BreadcrumbList JSON-LD. Deliberately omits `offers` — checkout,
 * payments, and delivery are not live yet (see PROGRESS.md), so publishing a
 * price/availability offer would claim a purchase flow that doesn't exist. */
function ProductJsonLd({ product }: { product: Product }) {
  const baseUrl = getSiteBaseUrl();
  const productUrl = new URL(`/product/${product.slug}`, baseUrl).toString();
  const image = product.image || product.imageUrl;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.shortDescription || product.name,
    sku: product.id,
    ...(image ? { image: [new URL(image, baseUrl).toString()] } : {}),
    ...(product.brandName ? { brand: { "@type": "Brand", name: product.brandName } } : {}),
    url: productUrl,
  };

  // Only Shop -> Product: the Product type doesn't carry a real category
  // slug (categoryId is a raw UUID for live products), so a middle
  // "category" crumb can't be given a real, working link.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: new URL("/shop", baseUrl).toString() },
      { "@type": "ListItem", position: 2, name: product.name, item: productUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
