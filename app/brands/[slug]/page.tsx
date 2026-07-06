import { BrandPageShell } from "@/components/brands/brand-page-shell";
import { demoBrands, getTopBrands } from "@/lib/data/brands";
import { getActiveBrandBySlug, getActiveProductsByBrandId } from "@/lib/catalog/queries";
import { mapBrandToDemoBrand, mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";

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

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const topBrands = getTopBrands({ limit: 6 });

  const liveBrand = await getActiveBrandBySlug(slug);

  const liveProducts = liveBrand
    ? (await getActiveProductsByBrandId(liveBrand.id)).map(mapCatalogProductToBuyerProduct)
    : [];

  const liveDemoBrand = liveBrand ? mapBrandToDemoBrand(liveBrand, liveProducts.length) : null;

  return (
    <BrandPageShell
      brandSlug={slug}
      topBrands={topBrands}
      liveBrand={liveDemoBrand}
      liveProducts={liveProducts}
    />
  );
}
