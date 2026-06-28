import { seedOrders, type MarketplaceOrder } from "@/lib/data/orders";
import {
  products as seedProducts,
  type Product,
} from "@/lib/data/products";
import { skxnzFallbackAssets } from "@/src/lib/assets";
import {
  buildBrandOrderMetrics,
  rankTopBrands,
  selectBrandOrderDataset,
  type BrandAnalyticsDataSource,
} from "@/src/lib/brand-analytics";
import {
  demoBrands,
  getCanonicalBrandSlug,
  type DemoBrand,
} from "@/src/data/demo-brands";
import { demoBrandMetrics } from "@/src/data/demo-brand-metrics";

export type BrandPerformanceSnapshot = {
  brand: DemoBrand;
  orderCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  approvedProductCount: number;
  totalProductCount: number;
  deliveredOrderCount: number;
  returnRequestCount: number;
  rankingScore: number;
  momentumLabel: string;
  featuredImage: string;
  dataSource: BrandAnalyticsDataSource;
  isLiveData: boolean;
};

export { demoBrands, type DemoBrand } from "@/src/data/demo-brands";

export const brandDiscoveryFilters = [
  "All",
  "Top Brands",
  "New",
  "Streetwear",
  "Luxury",
  "Accessories",
  "Perfume",
  "Sneakers",
  "AI Styled",
  "Limited Edition",
] as const;

export type BrandDiscoveryFilter = (typeof brandDiscoveryFilters)[number];

export function getDemoBrandBySlug(slug: string) {
  const canonicalSlug = getCanonicalBrandSlug(slug);

  return demoBrands.find((brand) => brand.slug === canonicalSlug);
}

export function getProductsForBrand(products: Product[], brandSlug: string) {
  const canonicalSlug = getCanonicalBrandSlug(brandSlug);

  return products.filter((product) => product.brandSlug === canonicalSlug);
}

export function brandMatchesDiscoveryFilter(
  brand: DemoBrand,
  filter: BrandDiscoveryFilter,
) {
  const searchableBrandText = [
    brand.name,
    brand.category,
    brand.tagline,
    brand.shortDescription,
    ...brand.categories,
    ...brand.tags,
    ...brand.searchKeywords,
  ]
    .join(" ")
    .toLowerCase();

  if (filter === "All") return true;
  if (filter === "Top Brands") return brand.isTopBrand || Boolean(brand.featured);
  if (filter === "New") return brand.isNew;
  if (filter === "Streetwear") return brand.isStreetwear || searchableBrandText.includes("streetwear");
  if (filter === "Luxury") return brand.isLuxury || searchableBrandText.includes("luxury");

  return searchableBrandText.includes(filter.toLowerCase());
}

export function getBrandLogoImage(brandSlug: string) {
  const brand = getDemoBrandBySlug(brandSlug);

  return brand?.logo ?? skxnzFallbackAssets.brand;
}

export function getBrandHeroImage(brandSlug: string, products: Product[]) {
  const brand = getDemoBrandBySlug(brandSlug);

  if (brand?.heroImage) {
    return brand.heroImage;
  }

  return getBrandFeaturedImage(brandSlug, products);
}

export function getBrandFeaturedImage(brandSlug: string, products: Product[]) {
  const brand = getDemoBrandBySlug(brandSlug);
  const heroProduct = brand
    ? products.find((product) => product.id === brand.heroProductId)
    : undefined;

  if (heroProduct?.image) {
    return heroProduct.image;
  }

  return getProductsForBrand(products, brandSlug)[0]?.image ?? skxnzFallbackAssets.hero;
}

function createMomentumLabel(orderCount: number, totalRevenue: number, approvedCount: number) {
  if (orderCount >= 2 && totalRevenue >= 500) {
    return "High Signal";
  }

  if (orderCount >= 1 && approvedCount >= 1) {
    return "Rising";
  }

  if (approvedCount >= 1) {
    return "Curated";
  }

  return "Preview";
}

export function buildBrandPerformance(
  products: Product[],
  orders: MarketplaceOrder[],
  options?: {
    liveOrders?: MarketplaceOrder[];
    productViewsByBrand?: Record<string, number>;
  },
): BrandPerformanceSnapshot[] {
  const demoOrderSource = orders.length ? orders : seedOrders;
  const rankedMetrics = buildBrandOrderMetrics({
    brands: demoBrands.map(({ id, slug, name }) => ({
      id,
      slug,
      name,
    })),
    products: products.map(({ id, brandId, brandSlug, brandName }) => ({
      id,
      brandId,
      brandSlug,
      brandName,
    })),
    liveOrders: options?.liveOrders,
    demoOrders: demoOrderSource,
    productViewsByBrand: options?.productViewsByBrand,
  });
  const selectedOrderDataset = selectBrandOrderDataset(
    options?.liveOrders,
    demoOrderSource,
  );

  return rankedMetrics.map((metric) => {
    const brand = demoBrands.find((entry) => entry.id === metric.brandId);

    if (!brand) {
      throw new Error(`Brand not found for metric: ${metric.brandId}`);
    }

    const brandProducts = getProductsForBrand(products, brand.slug);
    const approvedProducts = brandProducts.filter(
      (product) => product.status === "Approved Preview",
    );
    const brandOrders = selectedOrderDataset.orders.filter((order) =>
      brandProducts.some((product) => product.id === order.productId),
    );
    const deliveredOrderCount = brandOrders.filter(
      (order) => order.orderStatus === "Delivered",
    ).length;
    const returnRequestCount = brandOrders.filter(
      (order) =>
        order.orderStatus === "Return Requested" || order.orderStatus === "Returned",
    ).length;

    return {
      brand,
      orderCount: metric.totalOrders,
      totalRevenue: metric.totalRevenue,
      averageOrderValue:
        metric.totalOrders > 0 ? metric.totalRevenue / metric.totalOrders : 0,
      approvedProductCount: approvedProducts.length,
      totalProductCount: brandProducts.length,
      deliveredOrderCount,
      returnRequestCount,
      rankingScore: metric.score,
      momentumLabel: createMomentumLabel(
        metric.totalOrders,
        metric.totalRevenue,
        approvedProducts.length,
      ),
      featuredImage: getBrandFeaturedImage(brand.slug, products),
      dataSource: metric.dataSource,
      isLiveData: metric.dataSource === "real",
    };
  });
}

type GetTopBrandsOptions = {
  limit?: number;
  liveOrders?: MarketplaceOrder[];
  demoOrders?: MarketplaceOrder[];
  products?: Product[];
  productViewsByBrand?: Record<string, number>;
};

export function getTopBrands({
  limit = 8,
  liveOrders,
  demoOrders,
  products = seedProducts,
  productViewsByBrand,
}: GetTopBrandsOptions = {}) {
  const rankedBrands = buildBrandPerformance(
    products,
    demoOrders ?? seedOrders,
    {
      liveOrders,
      productViewsByBrand,
    },
  );

  if (!liveOrders?.length && !demoOrders?.length) {
    const rankedMetricFallback = rankTopBrands(demoBrandMetrics, { limit });
    const rankingIndex = new Map(
      rankedMetricFallback.map((metric, index) => [metric.brandId, index]),
    );

    return [...rankedBrands]
      .sort(
        (left, right) =>
          (rankingIndex.get(left.brand.id) ?? Number.MAX_SAFE_INTEGER) -
          (rankingIndex.get(right.brand.id) ?? Number.MAX_SAFE_INTEGER),
      )
      .slice(0, limit);
  }

  return rankedBrands.slice(0, limit);
}
