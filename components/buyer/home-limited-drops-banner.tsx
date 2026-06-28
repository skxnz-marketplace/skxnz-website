import Link from "next/link";

import { SafeImage } from "@/components/shared/safe-image";
import { buttonVariants } from "@/components/ui/button";
import { structuredCollections } from "@/src/data/collections";
import { ensureCategoryAsset, skxnzFallbackAssets } from "@/src/lib/assets";

const limitedDropsCollection =
  structuredCollections.find((collection) => collection.slug === "limited-edition") ??
  null;

export function HomeLimitedDropsBanner() {
  return (
    <section id="limited-drops">
      <div className="relative overflow-hidden rounded-[20px] border border-sandstone bg-pearlcream shadow-panel sm:rounded-[22px]">
        <div className="absolute inset-y-0 right-0 w-[54%] min-w-[12rem] sm:w-[46%]">
          <SafeImage
            src={ensureCategoryAsset(
              limitedDropsCollection?.image ??
                "/assets/home/categories/women.png",
              limitedDropsCollection?.slug,
            )}
            fallbackSrc={skxnzFallbackAssets.hero}
            alt="Limited Edition Drops"
            fill
            sizes="(max-width: 768px) 65vw, 40vw"
            className="object-cover object-center opacity-70"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(255,255,255,0.16),transparent_24%),radial-gradient(circle_at_84%_68%,rgba(34,211,238,0.12),transparent_26%),linear-gradient(135deg,#100006_0%,#3A0818_56%,#1A030B_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#100006_0%,rgba(26,3,11,0.9)_44%,rgba(58,8,24,0.34)_72%,rgba(16,0,6,0.24)_100%)]" />
        <div className="relative z-10 flex min-h-[168px] max-w-[18rem] flex-col justify-end gap-3 px-5 pb-5 pt-7 sm:min-h-[208px] sm:max-w-[24rem] sm:px-8 sm:pb-7">
          <h2 className="line-clamp-2 font-display text-xl uppercase leading-[0.96] tracking-[0.12em] text-pearlcream sm:text-3xl">
            LIMITED EDITION DROPS
          </h2>
          <p className="line-clamp-2 text-sm text-pearlcream/80 sm:text-base">
            {limitedDropsCollection?.description ?? "Curated high-signal pieces."}
          </p>
          <div className="pt-1">
            <Link
              href={limitedDropsCollection?.href ?? "/shop?q=limited%20edition"}
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              View Limited Drops
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
