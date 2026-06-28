import Link from "next/link";

import { SafeImage } from "@/components/shared/safe-image";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BrandPerformanceSnapshot } from "@/lib/data/brands";
import {
  ensureBrandHeroAsset,
  ensureBrandLogoAsset,
  skxnzFallbackAssets,
} from "@/src/lib/assets";

type HomeShopByBrandSectionProps = {
  rankedBrands: BrandPerformanceSnapshot[];
};

export function HomeShopByBrandSection({
  rankedBrands,
}: HomeShopByBrandSectionProps) {
  return (
    <section id="shop-by-brand" className="space-y-4 sm:space-y-5">
      <div className="min-w-0">
        <h2 className="font-display text-xl uppercase tracking-[0.14em] text-midnightbrown sm:text-2xl">
          Shop by Brand
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-3">
        {rankedBrands.map((snapshot) => (
          <Card
            key={snapshot.brand.slug}
            className="section-border group relative min-w-0 overflow-hidden rounded-[22px] p-0"
          >
            <div className="relative aspect-[0.9/1] min-h-[15rem] bg-[#0E1420] sm:aspect-[1/1] lg:aspect-[1.08/1]">
              <SafeImage
                src={ensureBrandHeroAsset(
                  snapshot.brand.heroImage,
                  snapshot.brand.slug,
                )}
                fallbackSrc={skxnzFallbackAssets.hero}
                alt={snapshot.brand.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 33vw"
                className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(35,31,27,0.1)_0%,rgba(35,31,27,0.22)_28%,rgba(35,31,27,0.9)_100%)]" />

              <div className="absolute inset-x-0 bottom-0 z-10 flex min-w-0 flex-col gap-3 p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-sandstone/70 bg-white/85 sm:h-10 sm:w-10">
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
                    <p className="line-clamp-1 min-w-0 break-words font-display text-[0.86rem] uppercase leading-tight tracking-[0.12em] text-pearlcream sm:text-[0.94rem]">
                      {snapshot.brand.name}
                    </p>
                    <p className="mt-1 line-clamp-2 min-w-0 break-words text-[0.72rem] leading-5 text-pearlcream/82 sm:text-[0.78rem]">
                      {snapshot.brand.tagline}
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <Link
                    href={`/brands/${snapshot.brand.slug}`}
                    className={buttonVariants({
                      variant: "secondary",
                      size: "md",
                      className:
                        "w-full border-sandstone/55 bg-pearlcream/92 text-sangria backdrop-blur hover:border-teal/40 hover:bg-white",
                    })}
                  >
                    Shop Brand
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
