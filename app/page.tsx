import { CategoryStrip } from "@/components/home/category-strip";
import { FeaturedLabels } from "@/components/home/featured-labels";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { MosaicSection } from "@/components/home/mosaic-section";
import { ProductRow } from "@/components/home/product-row";
import { ShopSplit } from "@/components/home/shop-split";
import { TrustBar } from "@/components/home/trust-bar";
import { getActiveBrands, getActiveProducts } from "@/lib/catalog/queries";
import { mapBrandToBrandLabel, mapProductToHomeProduct } from "@/lib/catalog/mappers";
import {
  trendingProducts as fallbackTrending,
  luxuryFinds as fallbackLuxury,
  type HomeProduct,
} from "@/lib/home-data";

export const revalidate = 300;

const TRENDING_COUNT = 6;
const LUXURY_COUNT = 4;

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

  const trendingSection =
    latestHomeProducts.length >= TRENDING_COUNT
      ? latestHomeProducts.slice(0, TRENDING_COUNT)
      : fallbackTrending;

  const premiumHomeProducts = [...liveProducts]
    .sort((a, b) => b.price_inr - a.price_inr)
    .slice(0, LUXURY_COUNT)
    .map((product) => mapProductToHomeProduct(product, brandNameById));

  const luxurySection = premiumHomeProducts.length >= LUXURY_COUNT ? premiumHomeProducts : fallbackLuxury;

  return (
    <div className="min-h-screen bg-[#F4F1EC]">
      <HeroCarousel />
      <CategoryStrip />
      <FeaturedLabels brands={brandLabels} />
      <ProductRow
        heading="Trending Now"
        viewAllHref="/shop"
        products={trendingSection}
        staggered
      />
      <MosaicSection />
      <ShopSplit />
      <ProductRow
        heading="Luxury Finds"
        viewAllHref="/shop"
        products={luxurySection}
      />
      <TrustBar />
    </div>
  );
}
