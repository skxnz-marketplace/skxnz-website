import Link from "next/link";
import { SafeImage } from "@/components/shared/safe-image";
import { structuredCategories } from "@/src/data/categories";
import { getCategoryPageHref } from "@/src/lib/catalog-content";
import { ensureCategoryAsset, skxnzFallbackAssets } from "@/src/lib/assets";

const homepageCategoryOrder = [
  "men",
  "woman",
  "perfume",
  "accessories",
  "footwear",
  "streetwear",
] as const;

const categories = homepageCategoryOrder
  .map((slug) => structuredCategories.find((category) => category.slug === slug))
  .filter((category): category is (typeof structuredCategories)[number] => Boolean(category));

export function HomeCategoryGrid() {
  return (
    <section className="space-y-4 sm:space-y-5">
      <h2 className="font-display text-xl uppercase tracking-[0.14em] text-midnightbrown sm:text-2xl">
        Shop by Category
      </h2>

      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={getCategoryPageHref(category.slug)}
            className="group relative aspect-[0.95/1] overflow-hidden rounded-[18px] border border-sandstone bg-pearlcream shadow-[0_16px_30px_rgba(90,31,46,0.08)]"
          >
            <SafeImage
              src={ensureCategoryAsset(category.image, category.slug)}
              fallbackSrc={skxnzFallbackAssets.category}
              alt={category.displayName}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 16vw"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(35,31,27,0.04)_0%,rgba(35,31,27,0.16)_38%,rgba(35,31,27,0.78)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 sm:gap-3 sm:p-4">
              <p className="category-label line-clamp-2 min-w-0 pr-1 text-[0.82rem] font-semibold uppercase leading-tight text-pearlcream sm:text-[0.95rem]">
                {category.displayName}
              </p>
              <span className="shrink-0 text-sm text-pearlcream transition group-hover:translate-x-0.5 sm:text-base">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
