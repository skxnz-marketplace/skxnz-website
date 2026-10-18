"use client";

import Link from "next/link";
import { useState } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { SafeImage } from "@/components/shared/safe-image";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProductHref } from "@/lib/catalog/product-links";
import { formatProductPrice } from "@/lib/data/products";
import { restoreWishlistSelection } from "@/lib/data/wishlist";
import { selectedProductPrice } from "@/lib/data/selected-price";
import { skxnzFallbackAssets } from "@/src/lib/assets";

export function WishlistGrid() {
  const { wishlistEntries, moveWishlistItemToCart, removeFromWishlist } =
    useMarketplace();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  if (wishlistEntries.length === 0) {
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
            <p className="section-kicker text-[0.8rem] uppercase tracking-[0.24em] text-sangria">
              Saved on this device
            </p>
            <p className="mt-2 text-sm leading-6 text-stone">
              Live catalog and preview products save cleanly here on this
              device. Account sync is shown separately above.
            </p>
          </div>
          <Badge>{wishlistEntries.length} saved</Badge>
        </div>
        {feedback ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 rounded-[22px] border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.06)] px-4 py-3 text-sm leading-6 text-midnightbrown"
          >
            {feedback}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {wishlistEntries.map((entry) => {
          const { product } = entry;
          const selection = restoreWishlistSelection(entry, product);
          return (
          <Card
            key={product.id}
            className="section-border flex h-full min-w-0 flex-col rounded-[32px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-4"
          >
            <Link
              href={getProductHref(product)}
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
              <p className="mt-2 line-clamp-1 text-[0.8rem] font-black uppercase tracking-[0.18em] text-sangria">
                {product.brandName}
              </p>
              <Link href={getProductHref(product)}>
                <h3 className="mt-2 line-clamp-2 break-words text-lg font-black leading-tight text-midnightbrown">
                  {product.name}
                </h3>
              </Link>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone">
                {product.shortDescription}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{product.category}</Badge>
                <Badge>{selection?.color ?? entry.selectedColor ?? "Choose color"}</Badge>
                <Badge>{selection?.size ?? entry.selectedSize ?? "Choose size"}</Badge>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="product-price text-lg font-black text-sangria">
                  {formatProductPrice(selectedProductPrice(product, entry.productVariantId))}
                </p>
                {product.salePrice ? (
                  <p className="text-sm text-stone line-through">
                    {formatProductPrice(product.price)}
                  </p>
                ) : null}
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-5">
                {!selection ? <p className="text-sm text-sangria">Saved option unavailable or needs reselection. Open the product to choose again.</p> : null}
                <button
                  type="button"
                  disabled={!selection || movingId !== null}
                  onClick={async () => {
                    setMovingId(product.id);
                    try {
                      const result = await moveWishlistItemToCart(product.id);
                      setFeedback(`${product.name}: ${result.message}`);
                    } finally {
                      setMovingId(null);
                    }
                  }}
                  className={buttonVariants({ variant: "primary", size: "md" })}
                >
                  Move To Cart
                </button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href={getProductHref(product)}
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
          );
        })}
      </div>
    </div>
  );
}
