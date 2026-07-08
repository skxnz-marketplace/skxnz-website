"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { SafeImage } from "@/components/shared/safe-image";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatProductPrice, type Product } from "@/lib/data/products";
import { cn } from "@/lib/cn";
import { skxnzFallbackAssets } from "@/src/lib/assets";

export function CartPreviewTable() {
  const { cartItems, updateCartQuantity, addToWishlist } = useMarketplace();
  const [notice, setNotice] = useState<string | null>(null);

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (total, item) =>
        total + (item.product.salePrice ?? item.product.price) * item.quantity,
      0,
    );

    return {
      subtotal,
      shipping: 0,
      total: subtotal,
      count: cartItems.reduce((total, item) => total + item.quantity, 0),
    };
  }, [cartItems]);

  if (cartItems.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty."
        description="Add pieces from the SKXNZ catalog to build your cart. Live payment is not connected yet."
        actionHref="/shop"
        actionLabel="Back To Shop"
      />
    );
  }

  function saveForLater(product: Product, size: string, color: string) {
    // Pass the full snapshot so LIVE catalog items (not in the demo catalog)
    // can be saved and still render in the wishlist.
    addToWishlist(product.id, product);
    updateCartQuantity(product.id, size, color, 0);
    setNotice(`${product.name} moved to your wishlist on this device.`);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <Card className="section-border min-w-0 rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-0">
        <div className="border-b border-[rgba(58,8,24,0.10)] p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
                Cart Items
              </p>
              <h2 className="mt-2 break-words font-display text-2xl uppercase leading-tight tracking-[0.06em] text-midnightbrown sm:text-3xl">
                Ready for checkout review
              </h2>
            </div>
            <p className="rounded-full border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone">
              {totals.count} item{totals.count === 1 ? "" : "s"}
            </p>
          </div>
          {notice ? (
            <div className="mt-4 rounded-[22px] border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.06)] px-4 py-3 text-sm leading-6 text-midnightbrown">
              {notice}
            </div>
          ) : null}
        </div>

        <div className="divide-y divide-[rgba(58,8,24,0.10)]">
          {cartItems.map((item) => {
            const unitPrice = item.product.salePrice ?? item.product.price;
            const lineTotal = unitPrice * item.quantity;

            return (
              <article
                key={`${item.product.id}-${item.size}-${item.color}`}
                className="grid min-w-0 gap-5 p-5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:p-7 lg:grid-cols-[8.5rem_minmax(0,1fr)_10rem]"
              >
                <Link
                  href={`/product/${item.product.id}`}
                  className="relative block aspect-square min-w-0 overflow-hidden rounded-[26px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-card)]"
                  aria-label={`View ${item.product.name}`}
                >
                  <SafeImage
                    src={item.image || item.product.image}
                    fallbackSrc={skxnzFallbackAssets.product}
                    alt={item.product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 136px"
                    className="object-cover object-center transition duration-500 hover:scale-[1.03]"
                  />
                </Link>

                <div className="min-w-0 space-y-4">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-sangria">
                      {item.product.brandName}
                    </p>
                    <Link
                      href={`/product/${item.product.id}`}
                      className="mt-2 block min-w-0"
                    >
                      <h3 className="product-title line-clamp-2 break-words text-lg font-bold leading-tight text-midnightbrown">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-stone">
                      {item.product.shortDescription}
                    </p>
                  </div>

                  <div className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone sm:grid-cols-2">
                    <div className="rounded-2xl border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] px-3 py-2">
                      Size <span className="text-midnightbrown">{item.size || "One Size"}</span>
                    </div>
                    <div className="rounded-2xl border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] px-3 py-2">
                      Color <span className="text-midnightbrown">{item.color || "Default"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center rounded-full border border-[rgba(58,8,24,0.12)] bg-white px-2 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(
                            item.product.id,
                            item.size,
                            item.color,
                            item.quantity - 1,
                          )
                        }
                        className="h-8 w-8 rounded-full border border-[rgba(58,8,24,0.12)] text-sangria transition hover:border-[rgba(34,211,238,0.34)]"
                        aria-label={`Decrease quantity for ${item.product.name}`}
                      >
                        -
                      </button>
                      <span className="min-w-10 text-center text-sm font-bold text-midnightbrown">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(
                            item.product.id,
                            item.size,
                            item.color,
                            item.quantity + 1,
                          )
                        }
                        className="h-8 w-8 rounded-full border border-[rgba(58,8,24,0.12)] text-sangria transition hover:border-[rgba(34,211,238,0.34)]"
                        aria-label={`Increase quantity for ${item.product.name}`}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        saveForLater(item.product, item.size, item.color)
                      }
                      className="rounded-full border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sangria transition hover:border-[rgba(139,92,246,0.28)]"
                    >
                      Save For Later
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQuantity(
                          item.product.id,
                          item.size,
                          item.color,
                          0,
                        )
                      }
                      className="rounded-full border border-[rgba(58,8,24,0.12)] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-stone transition hover:text-sangria"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="min-w-0 rounded-[26px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4 lg:text-right">
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-stone">
                    Price
                  </p>
                  <p className="product-price mt-2 text-lg font-black text-sangria">
                    {formatProductPrice(unitPrice)}
                  </p>
                  {item.product.salePrice ? (
                    <p className="mt-1 text-sm text-stone line-through">
                      {formatProductPrice(item.product.price)}
                    </p>
                  ) : null}
                  <p className="mt-4 text-[0.68rem] uppercase tracking-[0.2em] text-stone">
                    Subtotal
                  </p>
                  <p className="product-price mt-2 text-xl font-black text-midnightbrown">
                    {formatProductPrice(lineTotal)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </Card>

      <CartSummary
        subtotal={totals.subtotal}
        shipping={totals.shipping}
        total={totals.total}
      />
    </div>
  );
}

function CartSummary({
  subtotal,
  shipping,
  total,
}: {
  subtotal: number;
  shipping: number;
  total: number;
}) {
  const rows = [
    ["Subtotal", formatProductPrice(subtotal)],
    ["Delivery", shipping === 0 ? "Calculated at a later step" : formatProductPrice(shipping)],
    ["Estimated total", formatProductPrice(total)],
  ];

  return (
    <Card className="section-border sticky top-28 min-w-0 self-start rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-7">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        Order Summary
      </p>
      <h2 className="mt-3 break-words font-display text-2xl uppercase leading-tight tracking-[0.06em] text-midnightbrown">
        Checkout review
      </h2>

      <div className="mt-6 space-y-3">
        {rows.map(([label, value], index) => (
          <div
            key={label}
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[rgba(58,8,24,0.10)] px-4 py-3 text-sm",
              index === rows.length - 1
                ? "bg-[var(--skxnz-maroon-deep)] text-[var(--skxnz-text-light)]"
                : "bg-[var(--skxnz-bg-soft)] text-stone",
            )}
          >
            <span className="min-w-0 break-words">{label}</span>
            <span className="min-w-0 break-words text-right font-bold">
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[24px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-4 text-sm leading-6 text-midnightbrown">
        Live payment is not connected yet. The next step is a checkout review
        only.
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/checkout"
          className={buttonVariants({
            variant: "primary",
            size: "lg",
            className: "w-full",
          })}
        >
          Continue To Checkout Review
        </Link>
        <Link
          href="/shop"
          className={buttonVariants({
            variant: "secondary",
            size: "lg",
            className: "w-full",
          })}
        >
          Continue Shopping
        </Link>
      </div>
    </Card>
  );
}
