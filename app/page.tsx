import { AiSignalPanel } from "@/components/home/ai-signal-panel";
import { AuthenticityShowcase } from "@/components/home/authenticity-showcase";
import { BrandSpotlight } from "@/components/home/brand-spotlight";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { FeaturedLabels } from "@/components/home/featured-labels";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { HeroScrollVideo } from "@/components/home/hero-scroll-video";
import { LuxuryFinds } from "@/components/home/luxury-finds";
import { MosaicSection } from "@/components/home/mosaic-section";
import { ProductRow } from "@/components/home/product-row";
import { ShopSplit } from "@/components/home/shop-split";
import { SignalCta } from "@/components/home/signal-cta";
import { SignalRoomTeaser } from "@/components/home/signal-room-teaser";
import { TrustBar } from "@/components/home/trust-bar";
import { buildLiveBrandSnapshots, mapCatalogProductToBuyerProduct, mapProductToHomeProduct } from "@/lib/catalog/mappers";
import { listActiveBrands, listActiveProducts, listTrendingProducts } from "@/lib/catalog/public-catalog";
import type { HomeProduct } from "@/lib/home-data";

export const revalidate = 300;

const TRENDING_COUNT = 6;

// Every homepage product and brand comes from the live catalogue
// (lib/catalog/public-catalog). If a read fails, that section is not rendered
// (the error is logged there) — it is never refilled with demo products.
export default async function HomePage() {
  const [trending, brands, products] = await Promise.all([
    listTrendingProducts(TRENDING_COUNT),
    listActiveBrands(),
    listActiveProducts(),
  ]);

  // Admin-curated (products.trending_sort_order) first, newest fills the rest.
  const trendingSection: HomeProduct[] = trending.ok
    ? trending.data.map((product) => {
        const card = mapProductToHomeProduct(product, new Map(product.brand ? [[product.brand.id, product.brand.name]] : []));
        return { ...card, image: product.images[0]?.url ?? card.image };
      })
    : [];

  const brandSnapshots = brands.ok && products.ok ? buildLiveBrandSnapshots(brands.data, products.data) : [];

  return (
    <div className="min-h-screen bg-[#F4F1EC]">
      <HeroCarousel />
      <CategoryShowcase />
      <FeaturedLabels />
      <BrandSpotlight snapshots={brandSnapshots} />
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
      <LuxuryFinds />
      <TrustBar />
      {/* Section 1 slot — the signal film. Its long scroll room absorbs what
          were the Section 1 and Section 2 scaffolds, per the founder's layout. */}
      <HeroScrollVideo />
      <AuthenticityShowcase />
      <AiSignalPanel />
      <SignalRoomTeaser
        products={trending.ok ? trending.data.map(mapCatalogProductToBuyerProduct) : []}
      />
      <SignalCta />
    </div>
  );
}
