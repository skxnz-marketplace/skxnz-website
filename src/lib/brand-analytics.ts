export type BrandAnalyticsDataSource = "real" | "demo";

export type BrandAnalyticsBrand = {
  id: string;
  slug: string;
  name: string;
};

export type BrandAnalyticsProduct = {
  id: string;
  brandId: string;
  brandSlug: string;
  brandName: string;
};

export type BrandAnalyticsOrder = {
  productId: string;
  amount: number;
  placedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type BrandOrderMetric = {
  brandId: string;
  brandSlug: string;
  brandName: string;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: number;
  productViews?: number;
};

export type RankedBrandOrderMetric = BrandOrderMetric & {
  score: number;
  dataSource: BrandAnalyticsDataSource;
};

type BrandRankingScoreOptions = {
  orderWeight?: number;
  revenueDivisor?: number;
  recentOrderWeight?: number;
  productViewsWeight?: number;
};

type RankTopBrandsOptions = BrandRankingScoreOptions & {
  limit?: number;
};

type BuildBrandOrderMetricsInput = {
  brands: BrandAnalyticsBrand[];
  products: BrandAnalyticsProduct[];
  liveOrders?: BrandAnalyticsOrder[];
  demoOrders?: BrandAnalyticsOrder[];
  productViewsByBrand?: Record<string, number>;
  recentWindowDays?: number;
  limit?: number;
  now?: Date;
  scoreOptions?: BrandRankingScoreOptions;
};

const weekdayMap: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function parseRelativeTimestamp(value: string | undefined, now: Date) {
  if (!value) {
    return null;
  }

  const directDate = new Date(value);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.startsWith("today")) {
    return now;
  }

  if (normalized.startsWith("yesterday")) {
    const yesterday = new Date(now);

    yesterday.setDate(now.getDate() - 1);
    return yesterday;
  }

  const weekday = Object.keys(weekdayMap).find((entry) =>
    normalized.startsWith(entry),
  );

  if (!weekday) {
    return null;
  }

  const targetWeekday = weekdayMap[weekday];
  const reference = new Date(now);
  const dayOffset = (reference.getDay() - targetWeekday + 7) % 7;

  reference.setDate(reference.getDate() - dayOffset);
  return reference;
}

function isRecentOrder(
  order: BrandAnalyticsOrder,
  recentWindowDays: number,
  now: Date,
) {
  const parsedDates = [order.updatedAt, order.createdAt, order.placedAt]
    .map((value) => parseRelativeTimestamp(value, now))
    .filter((value): value is Date => value instanceof Date);

  if (!parsedDates.length) {
    return false;
  }

  const mostRecentTimestamp = Math.max(
    ...parsedDates.map((value) => value.getTime()),
  );
  const recentWindowMs = recentWindowDays * 24 * 60 * 60 * 1000;

  return now.getTime() - mostRecentTimestamp <= recentWindowMs;
}

export function calculateBrandScore(
  metric: BrandOrderMetric,
  options: BrandRankingScoreOptions = {},
) {
  const {
    orderWeight = 5,
    revenueDivisor = 1000,
    recentOrderWeight = 10,
    productViewsWeight = 0,
  } = options;

  return (
    metric.totalOrders * orderWeight +
    metric.totalRevenue / revenueDivisor +
    metric.recentOrders * recentOrderWeight +
    (metric.productViews ?? 0) * productViewsWeight
  );
}

export function rankTopBrands(
  metrics: BrandOrderMetric[],
  options: RankTopBrandsOptions = {},
) {
  const { limit = 8, ...scoreOptions } = options;

  return [...metrics]
    .map((metric) => ({
      ...metric,
      score: calculateBrandScore(metric, scoreOptions),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function selectBrandOrderDataset<T>(
  liveOrders: T[] | undefined,
  demoOrders: T[] | undefined,
) {
  if (liveOrders?.length) {
    return {
      dataSource: "real" as const,
      orders: liveOrders,
    };
  }

  return {
    dataSource: "demo" as const,
    orders: demoOrders ?? [],
  };
}

export function buildBrandOrderMetrics({
  brands,
  products,
  liveOrders,
  demoOrders,
  productViewsByBrand,
  recentWindowDays = 7,
  limit = 8,
  now = new Date(),
  scoreOptions,
}: BuildBrandOrderMetricsInput): RankedBrandOrderMetric[] {
  const { dataSource, orders } = selectBrandOrderDataset(liveOrders, demoOrders);

  const metrics = brands.map((brand) => {
    const brandProductIds = new Set(
      products
        .filter(
          (product) =>
            product.brandId === brand.id ||
            product.brandSlug === brand.slug ||
            product.brandName === brand.name,
        )
        .map((product) => product.id),
    );

    const brandOrders = orders.filter((order) => brandProductIds.has(order.productId));

    return {
      brandId: brand.id,
      brandSlug: brand.slug,
      brandName: brand.name,
      totalOrders: brandOrders.length,
      totalRevenue: brandOrders.reduce((sum, order) => sum + order.amount, 0),
      recentOrders: brandOrders.filter((order) =>
        isRecentOrder(order, recentWindowDays, now),
      ).length,
      productViews:
        productViewsByBrand?.[brand.id] ??
        productViewsByBrand?.[brand.slug] ??
        productViewsByBrand?.[brand.name] ??
        0,
    };
  });

  return rankTopBrands(metrics, {
    limit,
    ...scoreOptions,
  }).map((metric) => ({
    ...metric,
    dataSource,
  }));
}
