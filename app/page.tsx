import { AiStylistBanner } from "@/components/home/ai-stylist-banner";
import { CategoryStrip } from "@/components/home/category-strip";
import { FeaturedLabels } from "@/components/home/featured-labels";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { MosaicSection } from "@/components/home/mosaic-section";
import { ProductRow } from "@/components/home/product-row";
import { TrustBar } from "@/components/home/trust-bar";
import { trendingProducts, newInProducts, luxuryFinds } from "@/lib/home-data";

export const revalidate = 300;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F4F1EC]">
      <HeroCarousel />
      <CategoryStrip />
      <FeaturedLabels />
      <ProductRow
        heading="Trending Now"
        viewAllHref="/shop"
        products={trendingProducts}
      />
      <MosaicSection />
      <ProductRow
        heading="New In"
        viewAllHref="/shop?new=1"
        products={newInProducts}
      />
      <AiStylistBanner />
      <ProductRow
        heading="Luxury Finds"
        viewAllHref="/shop"
        products={luxuryFinds}
      />
      <TrustBar />
    </div>
  );
}
