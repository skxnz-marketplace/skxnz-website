import { cache } from "react";
import type { Metadata } from "next";
import { serializeJsonLd } from "@/lib/security/json-ld";
import { notFound } from "next/navigation";

import { ProductDetailShell } from "@/components/buyer/product-detail-shell";
import { isDemoCatalogueEnabled } from "@/lib/catalog/demo-fallback";
import { mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";
import {
  CatalogUnavailableError,
  findActiveProduct,
  listActiveProducts,
} from "@/lib/catalog/public-catalog";
import {
  getProductById as getSeedProductById,
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

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/** Pre-render live product slugs. On a catalogue error, pre-render nothing:
 * pages then render on demand (and surface the error) instead of failing the build. */
export async function generateStaticParams() {
  const result = await listActiveProducts();
  return result.ok ? result.data.map((product) => ({ id: product.slug })) : [];
}

// PERF (D13-A): generateMetadata and the page body both resolve the same
// product; React cache() makes that one lookup per render pass (request-scoped).
// null = no such ACTIVE product (404). A query error throws (5xx) — it is never
// replaced by a demo product unless lib/catalog/demo-fallback allows it.
const resolveProduct = cache(async (id: string): Promise<Product | null> => {
  const result = await findActiveProduct(id);

  if (result.ok) {
    if (result.data) return mapCatalogProductToBuyerProduct(result.data);
    return isDemoCatalogueEnabled() ? getSeedProductById(id) ?? null : null;
  }

  if (isDemoCatalogueEnabled()) return getSeedProductById(id) ?? null;
  throw new CatalogUnavailableError(result.error.operation);
});

/** Other live products — same category first, then the newest. A secondary
 * section: on error it renders nothing (logged in lib/catalog), never demo. */
async function resolveLiveSimilarProducts(product: Product): Promise<Product[]> {
  if (product.dataSource !== "live") {
    return [];
  }

  const result = await listActiveProducts({ limit: 24 });
  if (!result.ok) return [];

  const others = result.data.filter((candidate) => candidate.id !== product.id);
  const sameCategory = others.filter(
    (candidate) => candidate.category_id != null && candidate.category_id === product.categoryId,
  );
  const rest = others.filter((candidate) => !sameCategory.includes(candidate));

  return [...sameCategory, ...rest].slice(0, 3).map(mapCatalogProductToBuyerProduct);
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
  if (!product) notFound();
  const liveSimilarProducts = await resolveLiveSimilarProducts(product);

  return (
    <>
      <ProductJsonLd product={product} />
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
    </>
  );
}
