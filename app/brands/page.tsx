import { BrandsIndexShell } from "@/components/brands/brands-index-shell";
import { demoBrands, getTopBrands } from "@/lib/data/brands";

export const revalidate = 300;

export default function BrandsPage() {
  const topBrands = getTopBrands({ limit: 6 });

  return <BrandsIndexShell topBrands={topBrands} brands={demoBrands} />;
}
