"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SaveBrandButton } from "@/components/brands/save-brand-button";
import { TopBrandsToolbar } from "@/components/brands/top-brands-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { SafeImage } from "@/components/shared/safe-image";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { BrandPerformanceSnapshot, DemoBrand } from "@/lib/data/brands";
import {
  brandDiscoveryFilters,
  brandMatchesDiscoveryFilter,
  type BrandDiscoveryFilter,
} from "@/lib/data/brands";
import {
  ensureBrandHeroAsset,
  ensureBrandLogoAsset,
  skxnzFallbackAssets,
} from "@/src/lib/assets";

type BrandsIndexShellProps = {
  topBrands: BrandPerformanceSnapshot[];
  brands: DemoBrand[];
};

const searchFieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[18px] px-4 py-3 text-sm";

function matchesBrandSearch(brand: DemoBrand, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    brand.name,
    brand.category,
    brand.tagline,
    brand.shortDescription,
    brand.description,
    brand.country,
    brand.logoType,
    ...brand.categories,
    ...brand.tags,
    ...brand.searchKeywords,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

function BrandCard({
  brand,
  priorityLabel,
}: {
  brand: DemoBrand;
  priorityLabel?: string;
}) {
  return (
    <Card className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-card)] p-0 shadow-[0_12px_32px_rgba(58,8,24,0.06)]">
      <Link href={`/brands/${brand.slug}`} className="block min-w-0">
        <div className="relative min-h-[13rem] overflow-hidden bg-[var(--skxnz-bg-soft)]">
          <SafeImage
            src={ensureBrandHeroAsset(brand.heroImage, brand.slug)}
            fallbackSrc={skxnzFallbackAssets.hero}
            alt={brand.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,0,6,0.06)_0%,rgba(16,0,6,0.28)_40%,rgba(16,0,6,0.88)_100%)]" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {priorityLabel ? (
              <span className="rounded-full border border-white/20 bg-white/[0.12] px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] text-[var(--skxnz-text-light)] backdrop-blur">
                {priorityLabel}
              </span>
            ) : null}
            {brand.isDemo ? (
              <span className="rounded-full border border-white/20 bg-white/[0.12] px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] text-[var(--skxnz-text-light)] backdrop-blur">
                Demo profile
              </span>
            ) : null}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 flex min-w-0 flex-col gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/25 bg-white/90">
                <SafeImage
                  src={ensureBrandLogoAsset(brand.logo, brand.slug)}
                  fallbackSrc={skxnzFallbackAssets.brand}
                  alt={brand.name}
                  fill
                  sizes="48px"
                  className="object-contain object-center p-1"
                />
              </div>
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-bold uppercase tracking-[0.08em] text-[var(--skxnz-text-light)]">
                  {brand.name}
                </p>
                <p className="mt-1 line-clamp-1 break-words text-xs leading-5 text-white/76">
                  {brand.tagline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <p className="line-clamp-2 text-sm leading-6 text-stone">
          {brand.shortDescription}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge>{brand.category}</Badge>
          <Badge>{brand.productCount} products</Badge>
          {brand.isTopBrand ? <Badge>Top Brand</Badge> : null}
        </div>
        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/brands/${brand.slug}`}
            className={`${buttonVariants({ variant: "primary", size: "md" })} w-full sm:w-auto`}
          >
            Shop Brand
          </Link>
          <SaveBrandButton brandSlug={brand.slug} compact />
        </div>
      </div>
    </Card>
  );
}

function BrandSection({
  title,
  description,
  brands,
}: {
  title: string;
  description: string;
  brands: DemoBrand[];
}) {
  if (brands.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-teal">
            {title}
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-stone">
            {description}
          </p>
        </div>
        <Badge>{brands.length} brands</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {brands.map((brand) => (
          <BrandCard key={brand.slug} brand={brand} />
        ))}
      </div>
    </section>
  );
}

export function BrandsIndexShell({
  topBrands,
  brands,
}: BrandsIndexShellProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BrandDiscoveryFilter>("All");

  const rankedOrder = useMemo(
    () => new Map(topBrands.map((entry, index) => [entry.brand.slug, index])),
    [topBrands],
  );

  const topBrandEntries = useMemo(
    () => topBrands.map((entry) => entry.brand),
    [topBrands],
  );

  const filteredBrands = useMemo(
    () =>
      [...brands]
        .filter((brand) => brandMatchesDiscoveryFilter(brand, filter))
        .filter((brand) => matchesBrandSearch(brand, query))
        .sort((left, right) => {
          const leftRank = rankedOrder.get(left.slug) ?? Number.MAX_SAFE_INTEGER;
          const rightRank = rankedOrder.get(right.slug) ?? Number.MAX_SAFE_INTEGER;

          if (leftRank !== rightRank) {
            return leftRank - rightRank;
          }

          return left.name.localeCompare(right.name);
        }),
    [brands, filter, query, rankedOrder],
  );

  const newBrands = brands.filter((brand) => brand.isNew).slice(0, 6);
  const streetwearBrands = brands
    .filter((brand) => brand.isStreetwear || brand.categories.includes("Streetwear"))
    .slice(0, 6);
  const luxuryDemoBrands = brands
    .filter((brand) => brand.isLuxury || brand.category.toLowerCase().includes("luxury"))
    .slice(0, 6);

  return (
    <div className="bg-[var(--skxnz-bg)] pb-14">
      <section className="relative overflow-hidden border-b border-[rgba(58,8,24,0.12)] bg-[linear-gradient(135deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep),var(--skxnz-maroon))] text-[var(--skxnz-text-light)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_18%_80%,rgba(217,70,239,0.12),transparent_32%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
          <div className="min-w-0 self-end">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.3em] text-[var(--skxnz-glint)]">
              Shop by Brand
            </p>
            <h1 className="mt-5 max-w-[12ch] break-words font-display text-[2.6rem] uppercase leading-[0.9] tracking-[0.04em] sm:text-6xl">
              Brand discovery.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/76 sm:text-base">
              Explore SKXNZ-safe demo brand profiles, curated product edits, and
              brand-led shopping paths. No official partnership or authorization
              claim is made for demo brands.
            </p>
          </div>

          <Card className="min-w-0 rounded-[34px] border-white/12 bg-white/[0.08] p-5 text-[var(--skxnz-text-light)] backdrop-blur-xl">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.22em] text-white/62">
              Featured brands strip
            </p>
            <div className="mt-5 grid gap-3">
              {topBrandEntries.slice(0, 4).map((brand, index) => (
                <Link
                  key={brand.slug}
                  href={`/brands/${brand.slug}`}
                  className="flex min-w-0 items-center gap-3 rounded-[24px] border border-white/12 bg-white/[0.07] p-3 transition hover:border-[rgba(34,211,238,0.34)] hover:bg-white/[0.11]"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/90">
                    <SafeImage
                      src={ensureBrandLogoAsset(brand.logo, brand.slug)}
                      fallbackSrc={skxnzFallbackAssets.brand}
                      alt={brand.name}
                      fill
                      sizes="48px"
                      className="object-contain object-center p-1"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-black uppercase tracking-[0.16em]">
                      {brand.name}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-white/58">
                      #{index + 1} in brand discovery
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <TopBrandsToolbar rankedBrands={topBrands} mode="brand" />

        <Card className="rounded-[24px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-4 shadow-[0_12px_32px_rgba(58,8,24,0.06)] sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="min-w-0 space-y-2">
              <span className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-stone">
                Search brands
              </span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by brand, category, style, or tag"
                className={searchFieldClassName}
              />
            </label>

            <div className="flex max-w-4xl flex-wrap gap-2">
              {brandDiscoveryFilters.map((entry) => {
                const isActive = entry === filter;

                return (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setFilter(entry)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.1em] transition",
                      isActive
                        ? "border-[rgba(34,211,238,0.38)] bg-[rgba(34,211,238,0.08)] text-sangria"
                        : "border-[rgba(58,8,24,0.12)] bg-white text-stone hover:border-[rgba(34,211,238,0.32)] hover:text-sangria",
                    )}
                  >
                    {entry}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{filteredBrands.length} visible</Badge>
            <Badge>{filter}</Badge>
            <Badge>Saved locally for now</Badge>
          </div>
        </Card>

        {filteredBrands.length === 0 ? (
          <EmptyState
            title="No brand signal found."
            description="Try another brand, category, or style filter."
            actionHref="/brands"
            actionLabel="Reset Brand Discovery"
          />
        ) : (
          <section className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {filteredBrands.map((brand) => (
                <BrandCard
                  key={brand.slug}
                  brand={brand}
                  priorityLabel={
                    rankedOrder.has(brand.slug)
                      ? `Rank #${(rankedOrder.get(brand.slug) ?? 0) + 1}`
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        )}

        <BrandSection
          title="Top brands"
          description="Ranked from demo catalogue signals."
          brands={topBrandEntries}
        />
        <BrandSection
          title="New brands"
          description="Newly staged demo profiles."
          brands={newBrands}
        />
        <BrandSection
          title="Streetwear brands"
          description="Streetwear-coded demo routes."
          brands={streetwearBrands}
        />
        <BrandSection
          title="Premium demo brands"
          description="Demo profiles only. No partnership claim."
          brands={luxuryDemoBrands}
        />
      </div>
    </div>
  );
}
