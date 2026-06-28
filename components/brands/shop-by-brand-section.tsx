"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { SafeImage } from "@/components/shared/safe-image";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildBrandPerformance } from "@/lib/data/brands";
import {
  ensureBrandLogoAsset,
  ensureHeroAsset,
  skxnzFallbackAssets,
} from "@/src/lib/assets";

export function ShopByBrandSection() {
  const { catalog, orders } = useMarketplace();
  const rankedBrands = useMemo(
    () => buildBrandPerformance(catalog, orders),
    [catalog, orders],
  );

  return (
    <Card className="section-border rounded-[32px] p-5 sm:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
              Shop By Brand
            </p>
            <h2 className="mt-3 max-w-[12ch] text-wrap-safe break-words font-display text-[1.28rem] uppercase leading-[1] tracking-[0.05em] text-midnightbrown sm:max-w-none sm:text-2xl sm:tracking-[0.12em]">
              Explore the curated demo brand stack.
            </h2>
            <p className="mt-3 max-w-[19rem] text-sm leading-6 text-silver sm:max-w-none sm:leading-7">
              Top-brand placement is driven by internal ranking signals, while the
              public buyer view stays focused on curated discovery instead of demo
              order counts.
            </p>
          </div>
          <Badge>{rankedBrands.length} curated brands</Badge>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rankedBrands.map((snapshot, index) => (
            <Card
              key={snapshot.brand.slug}
              className="section-border flex h-full min-w-0 flex-col overflow-hidden rounded-[26px] p-0"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-pearlcream">
                <SafeImage
                  src={ensureHeroAsset(snapshot.featuredImage)}
                  fallbackSrc={skxnzFallbackAssets.hero}
                  alt={snapshot.brand.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover object-center"
                />
                <div className="absolute left-4 top-4">
                  <span className="inline-flex rounded-full border border-sandstone/60 bg-midnightbrown/78 px-3 py-1 text-[0.62rem] uppercase tracking-[0.2em] text-pearlcream backdrop-blur">
                    Rank #{index + 1}
                  </span>
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-3">
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
                      <p className="line-clamp-1 font-display text-lg uppercase tracking-[0.14em] text-midnightbrown">
                        {snapshot.brand.name}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-silver">
                        {snapshot.brand.shortDescription}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge>{snapshot.momentumLabel}</Badge>
                  <Badge>{snapshot.approvedProductCount} approved</Badge>
                  {snapshot.brand.featured ? <Badge>Featured</Badge> : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-sandstone bg-white/80 p-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.2em] text-silver">
                      Featured Categories
                    </p>
                    <p className="mt-2 line-clamp-2 break-words font-display text-lg uppercase tracking-[0.12em] text-midnightbrown">
                      {snapshot.brand.categories.slice(0, 2).join(" / ")}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-sandstone bg-white/80 p-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.2em] text-silver">
                      Brand Status
                    </p>
                    <p className="mt-2 line-clamp-2 break-words font-display text-lg uppercase tracking-[0.12em] text-midnightbrown">
                      {snapshot.isLiveData ? "Live Signal" : "Curated Preview"}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/brands/${snapshot.brand.slug}`}
                    className={`${buttonVariants({ variant: "primary", size: "md" })} w-full sm:w-auto`}
                  >
                    View Brand
                  </Link>
                  <Link
                    href={`/shop?brand=${snapshot.brand.slug}`}
                    className={`${buttonVariants({ variant: "secondary", size: "md" })} w-full sm:w-auto`}
                  >
                    Shop Brand
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
}
