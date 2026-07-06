import { BrandsIndexShell } from "@/components/brands/brands-index-shell";
import { demoBrands, getTopBrands } from "@/lib/data/brands";
import { getActiveBrands, getActiveProducts } from "@/lib/catalog/queries";
import { mapBrandToDemoBrand } from "@/lib/catalog/mappers";

export const revalidate = 300;

export default async function BrandsPage() {
  const topBrands = getTopBrands({ limit: 6 });

  const [liveBrands, liveProducts] = await Promise.all([
    getActiveBrands(),
    getActiveProducts(),
  ]);

  const productCountByBrandId = new Map<string, number>();
  for (const product of liveProducts) {
    if (!product.brand_id) continue;
    productCountByBrandId.set(product.brand_id, (productCountByBrandId.get(product.brand_id) ?? 0) + 1);
  }

  const liveDemoBrands = liveBrands.map((brand) =>
    mapBrandToDemoBrand(brand, productCountByBrandId.get(brand.id) ?? 0),
  );

  const brands = liveDemoBrands.length > 0 ? liveDemoBrands : demoBrands;

  return <BrandsIndexShell topBrands={topBrands} brands={brands} />;
}
