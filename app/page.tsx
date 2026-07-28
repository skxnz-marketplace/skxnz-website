import { CategoryStrip } from "@/components/home/category-strip";
import { FeaturedLabels } from "@/components/home/featured-labels";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { HeroScrollVideo } from "@/components/home/hero-scroll-video";
import { HomepageSection10 } from "@/components/home/homepage-section-10";
import { HomepageSection3 } from "@/components/home/homepage-section-3";
import { HomepageSection4 } from "@/components/home/homepage-section-4";
import { HomepageSection5 } from "@/components/home/homepage-section-5";
import { HomepageSection6 } from "@/components/home/homepage-section-6";
import { HomepageSection7 } from "@/components/home/homepage-section-7";
import { HomepageSection8 } from "@/components/home/homepage-section-8";
import { HomepageSection9 } from "@/components/home/homepage-section-9";
import { LuxuryFinds } from "@/components/home/luxury-finds";
import { MosaicSection } from "@/components/home/mosaic-section";
import { ProductRow } from "@/components/home/product-row";
import { ShopSplit } from "@/components/home/shop-split";
import { TrustBar } from "@/components/home/trust-bar";
import { getActiveBrands, getActiveProducts } from "@/lib/catalog/queries";
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
  const [liveBrands, liveProducts] = await Promise.all([
    getActiveBrands(),
    getActiveProducts(),
  ]);

  const brandNameById = new Map(liveBrands.map((brand) => [brand.id, brand.name]));

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

  return (
    <div className="min-h-screen bg-[#F4F1EC]">
      <HeroCarousel />
      <CategoryStrip />
      <FeaturedLabels />
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
      {/* Section 1 slot — the signal film. Given 320vh of scroll room so the
          full clip plays out uncropped; that room absorbs section 2's space. */}
      <HeroScrollVideo />
      <HomepageSection3 />
      <HomepageSection4 />
      <HomepageSection5 />
      <HomepageSection6 />
      <HomepageSection7 />
      <HomepageSection8 />
      <HomepageSection9 />
      <HomepageSection10 />
    </div>
  );
}
