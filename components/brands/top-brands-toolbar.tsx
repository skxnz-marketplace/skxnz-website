"use client";

import Link from "next/link";
import { SafeImage } from "@/components/shared/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { BrandPerformanceSnapshot } from "@/lib/data/brands";
import { cn } from "@/lib/cn";
import { ensureBrandLogoAsset, skxnzFallbackAssets } from "@/src/lib/assets";

type TopBrandsToolbarProps = {
  rankedBrands: BrandPerformanceSnapshot[];
  mode?: "shop" | "brand";
  activeBrandSlug?: string;
};

export function TopBrandsToolbar({
  rankedBrands,
  mode = "shop",
  activeBrandSlug,
}: TopBrandsToolbarProps) {
  const selectedBrandSlug = activeBrandSlug ?? "all";

  return (
    <Card className="section-border rounded-[30px] p-5 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
              Top Brands
            </p>
            <p className="mt-2 max-w-[18rem] text-sm leading-6 text-silver sm:max-w-none sm:leading-7">
              Ranked from catalogue momentum and internal brand analysis. Buyer
              preview labels stay generic until live commerce data exists.
            </p>
          </div>
          <Badge>{rankedBrands.length} curated brands</Badge>
        </div>

        <div className="-mx-2 overflow-x-auto px-2 pb-1">
          <div className="flex min-w-max items-center gap-3">
            {mode === "shop" ? (
              <Link
                href="/shop"
                className={cn(
                  "rounded-full border px-4 py-3 text-sm uppercase tracking-[0.16em] transition",
                  selectedBrandSlug === "all"
                    ? "border-teal/35 bg-teal/10 text-sangria"
                    : "border-sandstone bg-white/80 text-silver hover:border-teal/35 hover:text-sangria",
                )}
              >
                All Brands
              </Link>
            ) : null}

            {rankedBrands.map((snapshot, index) => {
              const href =
                mode === "shop"
                  ? `/shop?brand=${snapshot.brand.slug}`
                  : `/brands/${snapshot.brand.slug}`;
              const isActive = selectedBrandSlug === snapshot.brand.slug;

              return (
                <Link
                  key={snapshot.brand.slug}
                  href={href}
                  className={cn(
                    "min-w-[12rem] rounded-[22px] border px-4 py-3 transition",
                    isActive
                      ? "border-teal/35 bg-teal/10 text-sangria"
                      : "border-sandstone bg-white/80 text-silver hover:border-teal/35 hover:text-sangria",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-sandstone bg-white/85">
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
                        <p className="accent-label line-clamp-1 text-sm font-semibold uppercase text-midnightbrown">
                          {snapshot.brand.name}
                        </p>
                        <p className="mt-1 line-clamp-1 text-[0.62rem] uppercase tracking-[0.2em] text-silver">
                          {snapshot.momentumLabel}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[0.62rem] uppercase tracking-[0.2em] text-teal">
                      #{index + 1}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
