import Link from "next/link";

import { ShopByBrandSection } from "@/components/brands/shop-by-brand-section";
import { TopBrandsToolbar } from "@/components/brands/top-brands-toolbar";
import { ShopCatalog } from "@/components/buyer/shop-catalog";
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

const shopNotes = [
  "Every product shown here is an approved SKXNZ catalogue piece.",
  "Product pages are open for browsing. Checkout and payment are not live yet.",
  "Prices and availability are refreshed as sellers update their catalogues.",
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
      : "The SKXNZ catalogue, open for browsing before live commerce begins.";
  const pageDescription = isSearchMode
    ? isBrandMode
      ? `Showing matches for "${displayQuery}" within ${activeBrandLabel}. Checkout is not live yet.`
      : `Showing matches for "${displayQuery}" across the current catalogue. Checkout is not live yet.`
    : isBrandMode
      ? `Browsing ${activeBrandLabel} pieces from the current SKXNZ catalogue. Checkout is not live yet.`
      : "Browse approved pieces from curated labels. Checkout opens at public launch.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageIntro
        eyebrow="Shop Preview"
        title={pageTitle}
        description={pageDescription}
        titleClassName="max-w-[13ch] text-[1.38rem] leading-[0.98] tracking-[0.04em] sm:max-w-none sm:text-3xl sm:tracking-[0.1em]"
        descriptionClassName="max-w-[20rem] sm:max-w-full"
        actions={
          <Link
            href="/waitlist"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Join Early Access
          </Link>
        }
        footer={
          <div className="flex flex-wrap gap-3">
            <Badge>Approved products only</Badge>
            <Badge>Checkout not live yet</Badge>
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
              Good to know
            </p>
            <div className="mt-5 space-y-4 text-sm leading-6 text-silver">
              {shopNotes.map((note) => (
                <div
                  key={note}
                  className="rounded-[22px] border border-sandstone bg-white/80 p-4"
                >
                  {note}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
