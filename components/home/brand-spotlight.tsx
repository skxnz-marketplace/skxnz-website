import Link from "next/link";

import { SafeImage } from "@/components/shared/safe-image";
import { getTopBrands } from "@/lib/data/brands";
import { skxnzFallbackAssets } from "@/src/lib/assets";

/**
 * Ranked brand cards — same getTopBrands() ranking the shop page's brand
 * toolbar uses, just a distinct full-bleed treatment for the homepage
 * instead of the horizontal-scroll chip list.
 */
export function BrandSpotlight() {
  const top = getTopBrands({ limit: 3 });

  if (top.length === 0) return null;

  return (
    <section aria-label="Brand spotlight" className="bg-[#F4F1EC] pb-14 sm:pb-20">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.24em] text-[#2E1014]/60">
              Ranked by Momentum
            </p>
            <h2 className="mt-2 font-grotesk text-2xl font-bold uppercase tracking-[-0.015em] text-[#161616] sm:text-3xl">
              Brand Spotlight
            </h2>
          </div>
          <Link
            href="/brands"
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-full px-2 text-[0.8rem] font-bold uppercase tracking-[0.1em] text-[#2E1014] transition hover:opacity-70"
          >
            All Brands →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {top.map((snapshot, index) => (
            <Link
              key={snapshot.brand.slug}
              href={`/brands/${snapshot.brand.slug}`}
              className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-[24px] bg-[#161616] p-6"
            >
              <SafeImage
                src={snapshot.featuredImage}
                fallbackSrc={skxnzFallbackAssets.hero}
                alt={snapshot.brand.name}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover object-center opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              <span className="relative mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                #{index + 1} · {snapshot.momentumLabel}
              </span>
              <div className="relative flex items-center gap-3">
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/25 bg-white/90">
                  <SafeImage
                    src={snapshot.brand.logo}
                    fallbackSrc={skxnzFallbackAssets.brand}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain p-1"
                  />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-grotesk text-lg uppercase tracking-[0.08em] text-white">
                    {snapshot.brand.name}
                  </p>
                  <p className="text-[0.75rem] text-white/60">
                    {snapshot.approvedProductCount} approved pieces
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BrandSpotlight;
