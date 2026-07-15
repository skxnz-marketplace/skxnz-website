import Link from "next/link";

import { SafeImage } from "@/components/shared/safe-image";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProductHref } from "@/lib/catalog/product-links";
import { featuredProducts, formatProductPrice } from "@/lib/data/products";
import { skxnzFallbackAssets } from "@/src/lib/assets";

export function HomeTrendingGrid() {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl uppercase tracking-[0.16em] text-midnightbrown sm:text-2xl">
        Trending Now
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {featuredProducts.map((product) => {
          const imageClassName = product.image.includes("/editorial/")
            ? "object-cover object-center"
            : "object-contain scale-[0.96]";

          return (
            <Card
              key={product.id}
              className="section-border flex h-full min-w-0 flex-col gap-3 overflow-hidden rounded-[18px] bg-white/88 p-3 shadow-[0_16px_28px_rgba(90,31,46,0.08)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] border border-sandstone bg-[radial-gradient(circle_at_25%_18%,rgba(47,111,115,0.1),transparent_24%),linear-gradient(180deg,#F8F0E4_0%,#FBF5EE_100%)]">
                <SafeImage
                  src={product.image}
                  fallbackSrc={skxnzFallbackAssets.product}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className={`${imageClassName} transition duration-500 hover:scale-[1.01]`}
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2 px-1 pb-1">
                <p className="line-clamp-1 text-[0.62rem] uppercase tracking-[0.22em] text-teal">
                  {product.category}
                </p>
                <h3 className="product-title line-clamp-2 min-w-0 break-words text-sm font-semibold leading-snug tracking-[0.01em] text-midnightbrown sm:text-[0.95rem]">
                  {product.name}
                </h3>
                <p className="product-price text-base font-bold tracking-[0.01em] text-sangria">
                  {formatProductPrice(product.salePrice ?? product.price)}
                </p>
                <div className="mt-auto pt-2">
                  <Link
                    href={getProductHref(product)}
                    aria-label={`View ${product.name}`}
                    className={buttonVariants({
                      variant: "secondary",
                      size: "md",
                      className: "w-full",
                    })}
                  >
                    View
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
