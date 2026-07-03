import Link from "next/link";

import { ShopByBrandSection } from "@/components/brands/shop-by-brand-section";
import { TopBrandsToolbar } from "@/components/brands/top-brands-toolbar";
import { ShopCatalog } from "@/components/buyer/shop-catalog";
import { MetricCard } from "@/components/sections/metric-card";
import { PageIntro } from "@/components/sections/page-intro";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mapCatalogProductToBuyerProduct } from "@/lib/catalog/mappers";
import { getActiveBrands, getActiveProductsWithRelations } from "@/lib/catalog/queries";
import { getTopBrands } from "@/lib/data/brands";
import type { Product } from "@/lib/data/products";
import { normalizeSearchQuery } from "@/src/lib/site-search";

export const revalidate = 300;

const previewMetrics = [
  {
    name: "Catalogue Mode",
    value: "Live",
    trend: "Public",
    description: "Live approved products when available. Checkout is not live yet.",
  },
  {
    name: "Seller Intake",
    value: "Open",
    trend: "Apply",
    description: "Public seller application remains available during private MVP testing.",
  },
];

type ShopPageProps = {
  searchParams: Promise<{
    brand?: string;
    q?: string;
  }>;
};

async function getLiveShopCatalog(): Promise<{
  products: Product[];
  brands: Array<{ slug: string; name: string }>;
}> {
  try {
    const [products, brands] = await Promise.all([
      getActiveProductsWithRelations(),
      getActiveBrands(),
    ]);

    if (products.length === 0) {
      return { products: [], brands: [] };
    }

    return {
      products: products.map(mapCatalogProductToBuyerProduct),
      brands: brands.map((brand) => ({ slug: brand.slug, name: brand.name })),
    };
  } catch (err) {
    console.warn("[shop] falling back to local marketplace products:", err);
    return { products: [], brands: [] };
  }
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { brand, q } = await searchParams;
  const displayQuery = q?.trim().replace(/\s+/g, " ") ?? "";
  const normalizedQuery = normalizeSearchQuery(displayQuery);
  const isSearchMode = normalizedQuery.length > 0;
  const topBrands = getTopBrands({ limit: 6 });
  const liveCatalog = await getLiveShopCatalog();
  const hasLiveCatalog = liveCatalog.products.length > 0;
  const activeBrandSlug = normalizeSearchQuery(brand ?? "");
  const isBrandMode = activeBrandSlug.length > 0;
  const activeBrand = isBrandMode
    ? liveCatalog.brands.find(
        (entry) => normalizeSearchQuery(entry.slug) === activeBrandSlug,
      )
    : undefined;
  const activeBrandLabel = activeBrand?.name ?? activeBrandSlug.toUpperCase();
  const pageTitle = isSearchMode
    ? isBrandMode
      ? `Search results for "${displayQuery}" in ${activeBrandLabel}.`
      : `Search results for "${displayQuery}".`
    : isBrandMode
      ? `${activeBrandLabel} products.`
      : "Preview the SKXNZ catalogue before live commerce begins.";
  const pageDescription = isSearchMode
    ? isBrandMode
      ? `Search is scoped to the ${activeBrandLabel} brand filter when matching products are available. Checkout and fulfillment systems remain offline.`
      : "Search runs across current public catalogue data when available, with local preview fallback. Checkout and fulfillment systems remain offline."
    : isBrandMode
      ? `Showing the ${activeBrandLabel} brand filter from current public catalogue data when available, with local preview fallback if needed.`
      : "Approved public catalogue products are visible here for discovery while checkout and fulfillment systems remain offline.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageIntro
        eyebrow="Shop Preview"
        title={pageTitle}
        description={pageDescription}
        titleClassName="max-w-[13ch] text-[1.38rem] leading-[0.98] tracking-[0.04em] sm:max-w-none sm:text-3xl sm:tracking-[0.1em]"
        descriptionClassName="max-w-[20rem] sm:max-w-full"
        actions={
          <>
            <Link
              href="/waitlist"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Join Early Access
            </Link>
            <Link
              href="/sell"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Sell on SKXNZ
            </Link>
          </>
        }
        footer={
          <div className="flex flex-wrap gap-3">
            <Badge>Approved products only</Badge>
            <Badge>{hasLiveCatalog ? "Live catalogue" : "Preview fallback"}</Badge>
            <Badge>Preview catalogue — checkout is not live yet.</Badge>
            {isSearchMode ? <Badge>Query: {normalizedQuery}</Badge> : null}
            {isBrandMode ? <Badge>Brand: {activeBrandLabel}</Badge> : null}
          </div>
        }
      />

      <div className="mt-6">
        <TopBrandsToolbar
          rankedBrands={topBrands}
          mode="shop"
          activeBrandSlug={activeBrandSlug || "all"}
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.38fr]">
        <div className="grid gap-6">
          <ShopByBrandSection />
          <ShopCatalog
            initialBrandSlug={activeBrandSlug || undefined}
            initialQuery={normalizedQuery}
            liveProducts={liveCatalog.products}
            liveBrands={liveCatalog.brands}
          />
        </div>

        <div className="grid gap-6">
          <Card className="section-border rounded-[32px] bg-white/88 p-6">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
              Preview Notes
            </p>
            <div className="mt-5 space-y-4 text-sm leading-6 text-silver">
              <div className="rounded-[22px] border border-sandstone bg-white/80 p-4">
                Product imagery, pricing, and inventory are presented as curated
                catalogue data for launch mode.
              </div>
              <div className="rounded-[22px] border border-sandstone bg-white/80 p-4">
                Product buttons open preview pages only. Payment and checkout are not
                active.
              </div>
              <div className="rounded-[22px] border border-sandstone bg-white/80 p-4">
                Catalogue filters use live products when available and fall back to
                local MVP preview data if the database query returns empty.
              </div>
            </div>
          </Card>

          {previewMetrics.map((metric) => (
            <MetricCard key={metric.name} {...metric} />
          ))}
        </div>
      </div>
    </div>
  );
}
