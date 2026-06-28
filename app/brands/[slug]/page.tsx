import { BrandPageShell } from "@/components/brands/brand-page-shell";
import { demoBrands, getTopBrands } from "@/lib/data/brands";

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

  return <BrandPageShell brandSlug={slug} topBrands={topBrands} />;
}
