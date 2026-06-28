import Link from "next/link";
import { SafeImage } from "@/components/shared/safe-image";
import { Card } from "@/components/ui/card";
import type { BrandPerformanceSnapshot } from "@/lib/data/brands";
import { cn } from "@/lib/cn";
import { ensureBrandLogoAsset, skxnzFallbackAssets } from "@/src/lib/assets";

type HomeTopBrandsToolbarProps = {
  rankedBrands: BrandPerformanceSnapshot[];
};

export function HomeTopBrandsToolbar({
  rankedBrands,
}: HomeTopBrandsToolbarProps) {
  return (
    <section
      id="top-brands"
      aria-labelledby="home-top-brands-heading"
      className="space-y-4"
    >
      <div className="min-w-0">
        <p
          id="home-top-brands-heading"
          className="text-[0.72rem] uppercase tracking-[0.22em] text-teal"
        >
          Top Brands
        </p>
      </div>

      <Card className="section-border rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex min-w-max items-start gap-4 lg:min-w-0 lg:justify-between">
            {rankedBrands.map((snapshot) => (
              <Link
                key={snapshot.brand.slug}
                href={`/brands/${snapshot.brand.slug}`}
                className="group flex min-w-[4.75rem] shrink-0 flex-col items-center gap-3 text-center sm:min-w-[5.5rem]"
              >
                <div
                  className={cn(
                    "relative h-16 w-16 overflow-hidden rounded-full border border-sandstone bg-white/88 shadow-[0_12px_24px_rgba(90,31,46,0.08)] transition duration-300",
                    "sm:h-20 sm:w-20 lg:h-[82px] lg:w-[82px]",
                    "group-hover:border-teal/45 group-hover:shadow-[0_0_0_1px_rgba(47,111,115,0.18),0_16px_28px_rgba(185,125,90,0.14)]",
                  )}
                >
                  <SafeImage
                    src={ensureBrandLogoAsset(
                      snapshot.brand.logo,
                      snapshot.brand.slug,
                    )}
                    fallbackSrc={skxnzFallbackAssets.brand}
                    alt={snapshot.brand.name}
                    fill
                    sizes="(max-width: 640px) 64px, 82px"
                    className="object-contain object-center p-2 transition duration-300 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(90,31,46,0.05))]" />
                </div>

                <span className="accent-label line-clamp-2 min-w-0 max-w-[5.75rem] break-words text-[0.68rem] font-semibold uppercase leading-tight text-midnightbrown sm:max-w-[6.5rem] sm:text-[0.72rem]">
                  {snapshot.brand.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
