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
import { getActiveBrands, getTrendingProducts } from "@/lib/catalog/queries";
import { mapProductToHomeProduct } from "@/lib/catalog/mappers";
import { getProductHref } from "@/lib/catalog/product-links";
import {
  isApprovedProduct,
  products as approvedCataloguePool,
  type Product as CatalogueProduct,
} from "@/lib/data/products";
import { type HomeProduct } from "@/lib/home-data";

export const revalidate = 300;

const TRENDING_COUNT = 6;

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
  const [liveBrands, trendingProducts] = await Promise.all([
    getActiveBrands(),
    getTrendingProducts(TRENDING_COUNT),
  ]);

  const brandNameById = new Map(liveBrands.map((brand) => [brand.id, brand.name]));

  // Admin-curated (products.trending_sort_order) first, newest-first fills
  // any remaining slots — see lib/catalog/queries.ts#getTrendingProducts.
  const liveTrendingSection: HomeProduct[] = trendingProducts.map((product) =>
    mapProductToHomeProduct(product, brandNameById),
  );

  const approvedCatalogue = approvedCataloguePool.filter(isApprovedProduct);
  const catalogueHomeProducts = approvedCatalogue.map(mapCatalogueToHomeProduct);

  const trendingSection =
    liveTrendingSection.length >= TRENDING_COUNT
      ? liveTrendingSection
      : catalogueHomeProducts.slice(0, TRENDING_COUNT);

  return (
    <div className="min-h-screen bg-[#F4F1EC]">
      <HeroCarousel />
      <CategoryShowcase />
      <FeaturedLabels />
      <BrandSpotlight />
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
      <SignalRoomTeaser />
      <SignalCta />
    </div>
  );
}
