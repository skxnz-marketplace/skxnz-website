import { CategoryStrip } from "@/components/home/category-strip";
import { FeaturedLabels } from "@/components/home/featured-labels";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { MosaicSection } from "@/components/home/mosaic-section";
import { ProductRow } from "@/components/home/product-row";
import { ShopSplit } from "@/components/home/shop-split";
import { TrustBar } from "@/components/home/trust-bar";
import { getActiveBrands, getActiveProducts } from "@/lib/catalog/queries";
import { mapBrandToBrandLabel, mapProductToHomeProduct } from "@/lib/catalog/mappers";
import { getProductHref } from "@/lib/catalog/product-links";
import {
  isApprovedProduct,
  products as approvedCataloguePool,
  type Product as CatalogueProduct,
} from "@/lib/data/products";
import { type HomeProduct } from "@/lib/home-data";

export const revalidate = 300;

const TRENDING_COUNT = 6;
const LUXURY_COUNT = 4;

// Every homepage card must point at a real product-detail page. When the live
// catalog is unavailable we fall back to the same approved local catalogue the
// shop grid renders — never to invented products.
function mapCatalogueToHomeProduct(product: CatalogueProduct): HomeProduct {
  return {
    id: product.id,
    brand: product.brandName,
    name: product.name,
    price: (product.salePrice ?? product.price) * 100,
    oldPrice: product.salePrice != null ? product.price * 100 : undefined,
    href: getProductHref(product),
    image: product.image ?? "",
  };
}

export default async function HomePage() {
  const [liveBrands, liveProducts] = await Promise.all([
    getActiveBrands(),
    getActiveProducts(),
  ]);

  const brandNameById = new Map(liveBrands.map((brand) => [brand.id, brand.name]));
  const brandLabels = liveBrands.map(mapBrandToBrandLabel);

  // liveProducts is already ordered by created_at desc (latest first).
  const latestHomeProducts: HomeProduct[] = liveProducts.map((product) =>
    mapProductToHomeProduct(product, brandNameById),
  );

  const approvedCatalogue = approvedCataloguePool.filter(isApprovedProduct);
  const catalogueHomeProducts = approvedCatalogue.map(mapCatalogueToHomeProduct);

  const trendingSection =
    latestHomeProducts.length >= TRENDING_COUNT
      ? latestHomeProducts.slice(0, TRENDING_COUNT)
      : catalogueHomeProducts.slice(0, TRENDING_COUNT);

  const premiumHomeProducts = [...liveProducts]
    .sort((a, b) => b.price_inr - a.price_inr)
    .slice(0, LUXURY_COUNT)
    .map((product) => mapProductToHomeProduct(product, brandNameById));

  const luxurySection =
    premiumHomeProducts.length >= LUXURY_COUNT
      ? premiumHomeProducts
      : [...approvedCatalogue]
          .sort(
            (a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price),
          )
          .slice(0, LUXURY_COUNT)
          .map(mapCatalogueToHomeProduct);

  return (
    <div className="min-h-screen bg-[#F4F1EC]">
      <HeroCarousel />
      <CategoryStrip />
      <FeaturedLabels brands={brandLabels} />
      {trendingSection.length > 0 ? (
        <ProductRow
          heading="Trending Now"
          viewAllHref="/shop"
          products={trendingSection}
          staggered
        />
      ) : null}
      <MosaicSection />
      <ShopSplit />
      {luxurySection.length > 0 ? (
        <ProductRow
          heading="Luxury Finds"
          viewAllHref="/shop"
          products={luxurySection}
        />
      ) : null}
      <TrustBar />
    </div>
  );
}
