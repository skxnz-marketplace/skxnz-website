import { BrandsIndexShell } from "@/components/brands/brands-index-shell";
import { demoBrands, getTopBrands } from "@/lib/data/brands";
import { isDemoCatalogueEnabled } from "@/lib/catalog/demo-fallback";
import { buildLiveBrandSnapshots } from "@/lib/catalog/mappers";
import { CatalogUnavailableError, listActiveBrands, listActiveProducts } from "@/lib/catalog/public-catalog";

export const metadata = {
  title: "Brands",
};

export const revalidate = 300;

export default async function BrandsPage() {
  const [brands, products] = await Promise.all([listActiveBrands(), listActiveProducts()]);

  if (brands.ok && products.ok) {
    const ranked = buildLiveBrandSnapshots(brands.data, products.data);
    // Alphabetical directory, with the live product counts the ranking computed.
    const directory = ranked.map((snapshot) => snapshot.brand).sort((a, b) => a.name.localeCompare(b.name));
    return <BrandsIndexShell topBrands={ranked.slice(0, 6)} brands={directory} />;
  }

  if (isDemoCatalogueEnabled()) {
    return <BrandsIndexShell topBrands={getTopBrands({ limit: 6 })} brands={demoBrands} />;
  }

  throw new CatalogUnavailableError(!brands.ok ? brands.error.operation : !products.ok ? products.error.operation : "brands");
}
