"use client";

import Link from "next/link";
import { useState } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { SafeImage } from "@/components/shared/safe-image";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatProductPrice } from "@/lib/data/products";
import { skxnzFallbackAssets } from "@/src/lib/assets";

export function WishlistGrid() {
  const { wishlistProducts, moveWishlistItemToCart, removeFromWishlist } =
    useMarketplace();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (wishlistProducts.length === 0) {
    return (
      <EmptyState
        title="No saved products yet."
        description="Save SKXNZ products — live catalog or preview — from the shop or product detail page. Saved on this device for now."
        actionHref="/shop"
        actionLabel="Explore Shop"
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card className="section-border rounded-[30px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Saved on this device
            </p>
            <p className="mt-2 text-sm leading-6 text-stone">
              Live catalog and preview products save cleanly here on this
              device. Account sync is shown separately above.
            </p>
          </div>
          <Badge>{wishlistProducts.length} saved</Badge>
        </div>
        {feedback ? (
          <div className="mt-4 rounded-[22px] border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.06)] px-4 py-3 text-sm leading-6 text-midnightbrown">
            {feedback}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {wishlistProducts.map((product) => (
          <Card
            key={product.id}
            className="section-border flex h-full min-w-0 flex-col rounded-[32px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-4"
          >
            <Link
              href={`/product/${product.id}`}
              className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-card)]"
            >
              <SafeImage
                src={product.image}
                fallbackSrc={skxnzFallbackAssets.product}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center transition duration-500 hover:scale-[1.03]"
              />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col p-2">
              <p className="mt-2 line-clamp-1 text-[0.68rem] font-black uppercase tracking-[0.18em] text-sangria">
                {product.brandName}
              </p>
              <Link href={`/product/${product.id}`}>
                <h3 className="mt-2 line-clamp-2 break-words text-lg font-black leading-tight text-midnightbrown">
                  {product.name}
                </h3>
              </Link>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone">
                {product.shortDescription}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{product.category}</Badge>
                <Badge>{product.colors[0] ?? "Color"}</Badge>
                <Badge>{product.sizes[0] ?? "Size"}</Badge>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="product-price text-lg font-black text-sangria">
                  {formatProductPrice(product.salePrice ?? product.price)}
                </p>
                {product.salePrice ? (
                  <p className="text-sm text-stone line-through">
                    {formatProductPrice(product.price)}
                  </p>
                ) : null}
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    const result = moveWishlistItemToCart(product.id);
                    setFeedback(result.message);
                  }}
                  className={buttonVariants({ variant: "primary", size: "md" })}
                >
                  Move To Cart
                </button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/product/${product.id}`}
                    className={buttonVariants({
                      variant: "secondary",
                      size: "md",
                    })}
                  >
                    View Product
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      removeFromWishlist(product.id);
                      setFeedback(
                        `${product.name} was removed from the local wishlist.`,
                      );
                    }}
                    className={buttonVariants({ variant: "ghost", size: "md" })}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
