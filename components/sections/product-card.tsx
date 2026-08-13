"use client";

import Link from "next/link";

import { SafeImage } from "@/components/shared/safe-image";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { getProductHref } from "@/lib/catalog/product-links";
import { formatProductPrice, type Product } from "@/lib/data/products";
import { skxnzFallbackAssets } from "@/src/lib/assets";

type ProductCardProps = {
  product: Product;
  showWishlistAction?: boolean;
};

export function ProductCard({
  product,
  showWishlistAction = false,
}: ProductCardProps) {
  return (
    <Card className="section-border flex h-full min-w-0 flex-col gap-3 overflow-hidden bg-white/88 p-3">
      <div className="relative">
        <Link
          href={getProductHref(product)}
          tabIndex={-1}
          aria-hidden="true"
          className="relative block aspect-[4/5] overflow-hidden rounded-[18px] border border-sandstone bg-pearlcream"
        >
          <SafeImage
            src={product.image}
            fallbackSrc={skxnzFallbackAssets.product}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 31vw, 16vw"
            className="object-cover object-center transition duration-500 hover:scale-[1.02]"
          />
          <div className="absolute left-3 top-3">
            <span className="inline-flex max-w-full rounded-full border border-sandstone/55 bg-midnightbrown/78 px-2.5 py-1 text-[0.56rem] uppercase tracking-[0.12em] text-pearlcream backdrop-blur">
              {product.category}
            </span>
          </div>
        </Link>
        {showWishlistAction ? (
          <WishlistButton
            productId={product.id}
            product={product}
            className="absolute right-3 top-3 h-11 w-11"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="min-w-0">
          <Link
            href={`/brands/${product.brandSlug}`}
            className="line-clamp-1 min-w-0 break-words text-[0.62rem] font-bold uppercase tracking-[0.12em] text-teal transition hover:text-sangria"
          >
            {product.brandName}
          </Link>
          <Link
            href={getProductHref(product)}
            aria-label={`View ${product.name}`}
            className="product-title mt-1 block line-clamp-2 min-w-0 break-words text-sm font-semibold leading-snug text-midnightbrown transition hover:text-sangria"
          >
            {product.name}
          </Link>
          <p className="mt-1 line-clamp-1 min-w-0 text-[0.68rem] text-silver">
            {product.subtitle}
          </p>
        </div>

        <div className="mt-auto min-w-0">
          <p className="product-price break-words text-sm font-bold leading-tight text-sangria sm:text-base">
            {formatProductPrice(product.salePrice ?? product.price)}
          </p>
          {product.salePrice ? (
            <p className="mt-0.5 text-xs leading-5 text-silver line-through">
              {formatProductPrice(product.price)}
            </p>
          ) : null}
        </div>

        {showWishlistAction ? (
          <WishlistButton
            productId={product.id}
            product={product}
            showLabel
            savedLabel="Saved"
            unsavedLabel="Save"
            className={`${buttonVariants({ variant: "ghost", size: "sm" })} w-full`}
          />
        ) : null}
      </div>
    </Card>
  );
}
