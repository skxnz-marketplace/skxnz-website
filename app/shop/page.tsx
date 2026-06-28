import Link from "next/link";

import { ShopByBrandSection } from "@/components/brands/shop-by-brand-section";
import { TopBrandsToolbar } from "@/components/brands/top-brands-toolbar";
import { ShopCatalog } from "@/components/buyer/shop-catalog";
import { MetricCard } from "@/components/sections/metric-card";
import { PageIntro } from "@/components/sections/page-intro";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTopBrands } from "@/lib/data/brands";
import { normalizeSearchQuery } from "@/src/lib/site-search";

export const revalidate = 300;

const previewMetrics = [
  {
    name: "Catalogue Mode",
    value: "Preview",
    trend: "Public",
    description: "Approved mock products only. Checkout is not live yet.",
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

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { brand, q } = await searchParams;
  const displayQuery = q?.trim().replace(/\s+/g, " ") ?? "";
  const normalizedQuery = normalizeSearchQuery(displayQuery);
  const isSearchMode = normalizedQuery.length > 0;
  const topBrands = getTopBrands({ limit: 6 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageIntro
        eyebrow="Shop Preview"
        title={
          isSearchMode
            ? `Search results for “${displayQuery}”.`
            : "Preview the SKXNZ catalogue before live commerce begins."
        }
        description={
          isSearchMode
            ? "Search runs on local buyer preview data across products, brands, categories, tags, and collections. Checkout and fulfillment systems remain offline."
            : "Approved mock products are visible here as a public preview of the marketplace direction. This catalogue is for discovery only while checkout and fulfillment systems remain offline."
        }
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
            <Badge>Preview catalogue — checkout is not live yet.</Badge>
            {isSearchMode ? <Badge>Query: {normalizedQuery}</Badge> : null}
          </div>
        }
      />

      <div className="mt-6">
        <TopBrandsToolbar
          rankedBrands={topBrands}
          mode="shop"
          activeBrandSlug={brand ?? "all"}
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.38fr]">
        <div className="grid gap-6">
          <ShopByBrandSection />
          <ShopCatalog initialBrandSlug={brand} initialQuery={normalizedQuery} />
        </div>

        <div className="grid gap-6">
          <Card className="section-border rounded-[32px] bg-white/88 p-6">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
              Preview Notes
            </p>
            <div className="mt-5 space-y-4 text-sm leading-6 text-silver">
              <div className="rounded-[22px] border border-sandstone bg-white/80 p-4">
                Product imagery, pricing, and inventory are presented as curated
                preview data for launch mode.
              </div>
              <div className="rounded-[22px] border border-sandstone bg-white/80 p-4">
                Product buttons open preview pages only. Payment and checkout are not
                active.
              </div>
              <div className="rounded-[22px] border border-sandstone bg-white/80 p-4">
                Catalogue filters are local MVP controls until real database-backed
                catalogue logic is connected.
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
