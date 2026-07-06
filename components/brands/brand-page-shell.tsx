"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SaveBrandButton } from "@/components/brands/save-brand-button";
import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductGrid } from "@/components/shared/product-grid";
import { SafeImage } from "@/components/shared/safe-image";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import {
  type BrandPerformanceSnapshot,
  type DemoBrand,
  getBrandHeroImage,
  getDemoBrandBySlug,
  getProductsForBrand,
} from "@/lib/data/brands";
import { formatProductPrice, type Product } from "@/lib/data/products";
import {
  ensureBrandHeroAsset,
  ensureBrandLogoAsset,
  skxnzFallbackAssets,
} from "@/src/lib/assets";
import { brandPageHeroes } from "@/src/data/brandPageHeroes";

type BrandPageShellProps = {
  brandSlug: string;
  topBrands: BrandPerformanceSnapshot[];
  /** Live Supabase brand for this slug; null when no active brand matches. */
  liveBrand?: DemoBrand | null;
  /** Live ACTIVE products for liveBrand; only meaningful when liveBrand is set. */
  liveProducts?: Product[];
};

type BrandProductSort = "Featured" | "Newest" | "Price Low" | "Price High";

const sortOptions: BrandProductSort[] = [
  "Featured",
  "Newest",
  "Price Low",
  "Price High",
];

export function BrandPageShell({
  brandSlug,
  topBrands,
  liveBrand = null,
  liveProducts = [],
}: BrandPageShellProps) {
  const { catalog } = useMarketplace();
  const isLiveBrand = Boolean(liveBrand);
  const brand = liveBrand ?? getDemoBrandBySlug(brandSlug);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sort, setSort] = useState<BrandProductSort>("Featured");

  const allBrandProducts = useMemo(() => {
    if (isLiveBrand) {
      return liveProducts;
    }
    return getProductsForBrand(catalog, brandSlug).filter(
      (product) => product.status === "Approved Preview",
    );
  }, [brandSlug, catalog, isLiveBrand, liveProducts]);
  const brandCategories = useMemo(
    () => ["All", ...Array.from(new Set(allBrandProducts.map((product) => product.category)))],
    [allBrandProducts],
  );
  const brandProducts = useMemo(() => {
    const filteredProducts = allBrandProducts.filter(
      (product) => categoryFilter === "All" || product.category === categoryFilter,
    );

    return [...filteredProducts].sort((left, right) => {
      if (sort === "Price Low") return left.price - right.price;
      if (sort === "Price High") return right.price - left.price;
      if (sort === "Newest") return right.updatedAt.localeCompare(left.updatedAt);

      const leftFeaturedScore = left.tags.includes("featured") ? 1 : 0;
      const rightFeaturedScore = right.tags.includes("featured") ? 1 : 0;

      return rightFeaturedScore - leftFeaturedScore;
    });
  }, [allBrandProducts, categoryFilter, sort]);
  const brandHeroImage = useMemo(() => {
    if (isLiveBrand) {
      return brand?.heroImage || allBrandProducts[0]?.image || "";
    }
    return getBrandHeroImage(brandSlug, catalog);
  }, [allBrandProducts, brand, brandSlug, catalog, isLiveBrand]);
  const brandPageHero = useMemo(
    () => brandPageHeroes.find((entry) => entry.brandSlug === brandSlug) ?? null,
    [brandSlug],
  );
  const relatedBrands = useMemo(
    () => topBrands.filter((entry) => entry.brand.slug !== brand?.slug).slice(0, 3),
    [brand?.slug, topBrands],
  );

  if (!brand) {
    return (
      <div className="bg-[var(--skxnz-bg)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-5xl">
          <EmptyState
            title="Brand not found."
            description="This brand is not part of the current SKXNZ buyer preview."
            actionHref="/brands"
            actionLabel="Back To Brands"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--skxnz-bg)] pb-14">
      <section className="relative w-full overflow-hidden border-b border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-obsidian)] text-[var(--skxnz-text-light)]">
        <div className="relative min-h-[380px] overflow-hidden lg:min-h-[460px]">
          <SafeImage
            src={ensureBrandHeroAsset(
              brandPageHero?.image ?? brandHeroImage,
              brand.slug,
            )}
            fallbackSrc={skxnzFallbackAssets.hero}
            alt={brand.name}
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,0,6,0.92)_0%,rgba(26,3,11,0.78)_36%,rgba(16,0,6,0.32)_72%,rgba(16,0,6,0.14)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(34,211,238,0.12),transparent_25%),radial-gradient(circle_at_16%_82%,rgba(217,70,239,0.10),transparent_28%)]" />

          <div className="relative z-10 mx-auto flex min-h-[380px] max-w-7xl flex-col justify-end px-4 py-10 sm:px-6 lg:min-h-[460px] lg:px-8 lg:py-14">
            <div className="max-w-3xl">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white/90 sm:h-20 sm:w-20">
                  <SafeImage
                    src={ensureBrandLogoAsset(brand.logo, brand.slug)}
                    fallbackSrc={skxnzFallbackAssets.brand}
                    alt={brand.name}
                    fill
                    sizes="80px"
                    className="object-contain object-center p-2"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.26em] text-[var(--skxnz-glint)]">
                    {isLiveBrand ? "Live brand profile" : "Demo brand profile"}
                  </p>
                  <h1 className="mt-2 line-clamp-2 break-words font-display text-[2.4rem] uppercase leading-[0.9] tracking-[0.08em] sm:text-6xl">
                    {brandPageHero?.title ?? brand.name}
                  </h1>
                </div>
              </div>

              <p className="mt-5 line-clamp-2 text-sm font-black uppercase tracking-[0.18em] text-white/74 sm:text-base">
                {brand.tagline}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                {brandPageHero?.subtitle ?? brand.shortDescription}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="#brand-products"
                  className={buttonVariants({ variant: "primary", size: "lg" })}
                >
                  {brandPageHero?.ctaText ?? "Shop Products"}
                </Link>
                <SaveBrandButton brandSlug={brand.slug} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Card className="rounded-[32px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5 shadow-[0_18px_55px_rgba(58,8,24,0.07)] sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-teal">
                Brand page
              </p>
              <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.1em] text-midnightbrown sm:text-3xl">
                {brand.name}
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone">{brand.description}</p>
              <p className="mt-4 rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4 text-sm leading-6 text-stone">
                {isLiveBrand
                  ? "Live SKXNZ catalog brand. Saved brands are stored locally for now."
                  : "Saved brands are stored locally for now. Brand partnerships, authorization, cloud sync, and seller verification are not claimed by this demo profile."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                ["Products", String(allBrandProducts.length)],
                ["Country", brand.country],
                ["Logo type", brand.logoType],
                ["Status", brand.isDemo ? "Demo/internal" : "SKXNZ"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-card)] p-4"
                >
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-stone">
                    {label}
                  </p>
                  <p className="mt-2 line-clamp-2 font-black text-sangria">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {brand.categories.map((category) => (
              <Badge key={category}>{category}</Badge>
            ))}
            {brand.tags.slice(0, 5).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </Card>

        <section id="brand-products" className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-teal">
                Brand Products
              </p>
              <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.12em] text-midnightbrown sm:text-3xl">
                {brand.name} Preview
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="field-shell min-w-[11rem] rounded-full px-4 py-3 text-sm"
                aria-label="Filter brand products by category"
              >
                {brandCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as BrandProductSort)}
                className="field-shell min-w-[11rem] rounded-full px-4 py-3 text-sm"
                aria-label="Sort brand products"
              >
                {sortOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge>{brandProducts.length} products</Badge>
            <Badge>{categoryFilter === "All" ? "All categories" : categoryFilter}</Badge>
            <Badge>{sort}</Badge>
            {brandProducts[0] ? (
              <Badge>From {formatProductPrice(Math.min(...brandProducts.map((product) => product.price)))}</Badge>
            ) : null}
          </div>

          <ProductGrid
            products={brandProducts}
            emptyTitle={`No approved ${brand.name} products yet.`}
            emptyDescription="This brand is visible in the buyer preview, but its public product set is still being curated."
            showWishlistAction
          />
        </section>

        <section className="space-y-5">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-teal">
              Similar brands
            </p>
            <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.12em] text-midnightbrown sm:text-3xl">
              Continue exploring
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relatedBrands.map((snapshot) => (
              <Card
                key={snapshot.brand.slug}
                className="group overflow-hidden rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-card)] p-0 shadow-[0_18px_55px_rgba(58,8,24,0.07)]"
              >
                <div className="relative min-h-[15rem]">
                  <SafeImage
                    src={ensureBrandHeroAsset(
                      snapshot.brand.heroImage,
                      snapshot.brand.slug,
                    )}
                    fallbackSrc={skxnzFallbackAssets.hero}
                    alt={snapshot.brand.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,0,6,0.08)_0%,rgba(16,0,6,0.24)_38%,rgba(16,0,6,0.9)_100%)]" />

                  <div className="absolute inset-x-0 bottom-0 z-10 flex min-w-0 flex-col gap-4 p-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white/90">
                        <SafeImage
                          src={ensureBrandLogoAsset(
                            snapshot.brand.logo,
                            snapshot.brand.slug,
                          )}
                          fallbackSrc={skxnzFallbackAssets.brand}
                          alt={snapshot.brand.name}
                          fill
                          sizes="40px"
                          className="object-contain object-center p-1"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-display text-lg uppercase tracking-[0.12em] text-[var(--skxnz-text-light)]">
                          {snapshot.brand.name}
                        </p>
                        <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-white/72">
                          {snapshot.brand.tagline}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/brands/${snapshot.brand.slug}`}
                      className={cn(
                        buttonVariants({
                          variant: "secondary",
                          size: "md",
                        }),
                        "w-full border-white/20 bg-white/90 text-sangria hover:bg-white",
                      )}
                    >
                      View Brand
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
