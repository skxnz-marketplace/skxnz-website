import type { Metadata } from "next";

import { BrandPageShell } from "@/components/brands/brand-page-shell";
import { demoBrands, getDemoBrandBySlug, getTopBrands } from "@/lib/data/brands";
import { getActiveBrandBySlug, getActiveProductsByBrandId } from "@/lib/catalog/queries";
import { mapBrandToDemoBrand, mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";
import { getSiteBaseUrl } from "@/lib/site";

export const revalidate = 300;

type BrandPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return demoBrands.map((brand) => ({
    slug: brand.slug,
  }));
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;

  const liveBrand = await getActiveBrandBySlug(slug);
  const brand = liveBrand
    ? { name: liveBrand.name, description: liveBrand.description }
    : getDemoBrandBySlug(slug);

  if (!brand) {
    return { title: "Brand Not Found", robots: { index: false, follow: true } };
  }

  const description =
    brand.description || `Shop ${brand.name} on SKXNZ — curated futurewear and premium fashion.`;
  const canonicalPath = `/brands/${slug}`;

  return {
    title: `${brand.name} at SKXNZ`,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      title: `${brand.name} at SKXNZ`,
      description,
      url: canonicalPath,
    },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const topBrands = getTopBrands({ limit: 6 });

  const liveBrand = await getActiveBrandBySlug(slug);

  const liveProducts = liveBrand
    ? (await getActiveProductsByBrandId(liveBrand.id)).map(mapCatalogProductToBuyerProduct)
    : [];

  const liveDemoBrand = liveBrand ? mapBrandToDemoBrand(liveBrand, liveProducts.length) : null;
  const brandName = liveDemoBrand?.name ?? getDemoBrandBySlug(slug)?.name;

  return (
    <>
      {brandName ? <BrandBreadcrumbJsonLd slug={slug} name={brandName} /> : null}
      <BrandPageShell
        brandSlug={slug}
        topBrands={topBrands}
        liveBrand={liveDemoBrand}
        liveProducts={liveProducts}
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
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
