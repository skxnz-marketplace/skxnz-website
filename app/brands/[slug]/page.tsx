import { cache } from "react";
import type { Metadata } from "next";
import { serializeJsonLd } from "@/lib/security/json-ld";
import { notFound } from "next/navigation";

import { BrandPageShell } from "@/components/brands/brand-page-shell";
import { getDemoBrandBySlug, getTopBrands } from "@/lib/data/brands";
import { isDemoCatalogueEnabled } from "@/lib/catalog/demo-fallback";
import { buildLiveBrandSnapshots, mapBrandToDemoBrand, mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";
import {
  CatalogUnavailableError,
  findActiveBrandBySlug,
  listActiveBrands,
  listActiveProducts,
} from "@/lib/catalog/public-catalog";
import type { Brand } from "@/lib/catalog/types";
import { getSiteBaseUrl } from "@/lib/site";

export const revalidate = 300;

type BrandPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/** Pre-render live brand slugs; on a catalogue error pre-render nothing (render on demand). */
export async function generateStaticParams() {
  const result = await listActiveBrands();
  return result.ok ? result.data.map((brand) => ({ slug: brand.slug })) : [];
}

/** Live brand (null = no such active brand). Errors throw unless the demo switch is on. */
const resolveBrand = cache(async (slug: string): Promise<Brand | null | "demo"> => {
  const result = await findActiveBrandBySlug(slug);
  if (result.ok) return result.data ?? (isDemoCatalogueEnabled() && getDemoBrandBySlug(slug) ? "demo" : null);
  if (isDemoCatalogueEnabled()) return getDemoBrandBySlug(slug) ? "demo" : null;
  throw new CatalogUnavailableError(result.error.operation);
});

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveBrand(slug);
  const brand = resolved === "demo" ? getDemoBrandBySlug(slug) : resolved;

  if (!brand) {
    return { title: "Brand Not Found", robots: { index: false, follow: true } };
  }

  const description =
    brand.description || `Shop ${brand.name} on SKXNZ — curated futurewear and premium fashion.`;
  const canonicalPath = `/brands/${slug}`;
  // `title.absolute` bypasses the root layout's "%s | SKXNZ" template —
  // "{Brand} at SKXNZ" already names the site, so applying the template on
  // top would render "{Brand} at SKXNZ | SKXNZ".
  const title = `${brand.name} at SKXNZ`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: canonicalPath },
    openGraph: { type: "website", title, description, url: canonicalPath },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const resolved = await resolveBrand(slug);
  if (!resolved) notFound();

  if (resolved === "demo") {
    const demoBrand = getDemoBrandBySlug(slug);
    return (
      <>
        {demoBrand ? <BrandBreadcrumbJsonLd slug={slug} name={demoBrand.name} /> : null}
        <BrandPageShell brandSlug={slug} topBrands={getTopBrands({ limit: 6 })} />
      </>
    );
  }

  const [brands, products] = await Promise.all([listActiveBrands(), listActiveProducts()]);
  if (!brands.ok) throw new CatalogUnavailableError(brands.error.operation);
  if (!products.ok) throw new CatalogUnavailableError(products.error.operation);

  const brandProducts = products.data.filter((product) => product.brand_id === resolved.id);
  const liveBrand = mapBrandToDemoBrand(resolved, brandProducts.length);

  return (
    <>
      <BrandBreadcrumbJsonLd slug={slug} name={liveBrand.name} />
      <BrandPageShell
        brandSlug={slug}
        topBrands={buildLiveBrandSnapshots(brands.data, products.data).slice(0, 6)}
        liveBrand={liveBrand}
        liveProducts={brandProducts.map(mapCatalogProductToBuyerProduct)}
      />
    </>
  );
}

function BrandBreadcrumbJsonLd({ slug, name }: { slug: string; name: string }) {
  const baseUrl = getSiteBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Brands", item: new URL("/brands", baseUrl).toString() },
      { "@type": "ListItem", position: 2, name, item: new URL(`/brands/${slug}`, baseUrl).toString() },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
  );
}
