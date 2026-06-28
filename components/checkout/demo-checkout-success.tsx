"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  demoCheckoutOrderStorageKey,
  type DemoCheckoutOrder,
} from "@/components/checkout/demo-checkout-data";
import { SafeImage } from "@/components/shared/safe-image";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatProductPrice } from "@/lib/data/products";
import { upsertDemoCheckoutOrder } from "@/lib/data/orders";
import { skxnzFallbackAssets } from "@/src/lib/assets";

export function DemoCheckoutSuccess() {
  const [order, setOrder] = useState<DemoCheckoutOrder | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawOrder = window.localStorage.getItem(demoCheckoutOrderStorageKey);

      if (rawOrder) {
        const parsedOrder = JSON.parse(rawOrder) as DemoCheckoutOrder;
        upsertDemoCheckoutOrder(parsedOrder);
        setOrder(parsedOrder);
      }
    } catch {
      setOrder(null);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  if (!isHydrated) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="section-border rounded-[36px] p-8">
          <p className="text-sm text-stone">Loading internal test order...</p>
        </Card>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-8 text-center">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Demo checkout
          </p>
          <h1 className="mx-auto mt-4 max-w-[14ch] break-words font-display text-4xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
            No internal test order found.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone">
            Start from the cart to create an internal SKXNZ test order. No live
            checkout or payment has been connected.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/cart" className={buttonVariants({ variant: "primary" })}>
              Return To Cart
            </Link>
            <Link href="/shop" className={buttonVariants({ variant: "secondary" })}>
              Continue Shopping
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[86rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Card className="section-border overflow-hidden rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_0.7fr]">
          <div className="min-w-0 p-6 sm:p-8 lg:p-10">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Internal test order
            </p>
            <h1 className="mt-4 max-w-[13ch] break-words font-display text-[2.4rem] uppercase leading-[0.92] tracking-[-0.04em] text-midnightbrown sm:text-5xl lg:text-6xl">
              Demo order created.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone sm:text-base">
              Your SKXNZ demo checkout flow reached the internal success state.
              No live payment was processed and no real order was confirmed.
            </p>
            <div className="mt-6 rounded-[24px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] px-5 py-4 text-sm leading-6 text-midnightbrown">
              Demo order ID: <span className="font-black">{order.id}</span>
            </div>
          </div>
          <div className="min-w-0 border-t border-[rgba(58,8,24,0.12)] bg-[linear-gradient(135deg,var(--skxnz-maroon-deep),var(--skxnz-maroon),var(--skxnz-obsidian))] p-6 text-[var(--skxnz-text-light)] sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[rgba(255,254,250,0.72)]">
              Status
            </p>
            <h2 className="mt-4 break-words font-display text-3xl uppercase tracking-[0.04em]">
              Internal test only.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[rgba(255,254,250,0.78)]">
              Payment integration coming later. Delivery tracking, seller dispatch,
              and refund processing are not live in this MVP flow.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Order Summary
          </p>
          <div className="mt-6 grid gap-4">
            {order.items.map((item) => (
              <div
                key={`${item.product.id}-${item.size}-${item.color}`}
                className="grid min-w-0 gap-4 rounded-[28px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4 sm:grid-cols-[6rem_minmax(0,1fr)_8rem]"
              >
                <div className="relative aspect-square overflow-hidden rounded-[20px] bg-[var(--skxnz-card)]">
                  <SafeImage
                    src={item.image || item.product.image}
                    fallbackSrc={skxnzFallbackAssets.product}
                    alt={item.product.name}
                    fill
                    sizes="96px"
                    className="object-cover object-center"
                  />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sangria">
                    {item.product.brandName}
                  </p>
                  <h3 className="mt-2 line-clamp-2 break-words text-lg font-black leading-tight text-midnightbrown">
                    {item.product.name}
                  </h3>
                  <p className="mt-2 text-sm text-stone">
                    {item.size || "One Size"} · {item.color || "Default"} · Qty{" "}
                    {item.quantity}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-stone">
                    Line total
                  </p>
                  <p className="mt-2 font-black text-sangria">
                    {formatProductPrice(
                      (item.product.salePrice ?? item.product.price) *
                        item.quantity,
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-7">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Details
          </p>
          <div className="mt-5 space-y-4 text-sm leading-7 text-stone">
            <div className="rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4">
              <p className="font-black uppercase tracking-[0.14em] text-midnightbrown">
                Shipping
              </p>
              <p className="mt-2">{order.shipping.fullName}</p>
              <p>{order.shipping.address}</p>
              <p>
                {order.shipping.city}, {order.shipping.state}{" "}
                {order.shipping.pincode}
              </p>
            </div>
            <div className="rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4">
              <p className="font-black uppercase tracking-[0.14em] text-midnightbrown">
                Demo payment
              </p>
              <p className="mt-2">{order.paymentLabel}</p>
            </div>
            <div className="rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-maroon-deep)] p-4 text-[var(--skxnz-text-light)]">
              <p className="flex justify-between gap-3">
                <span>Subtotal</span>
                <span>{formatProductPrice(order.subtotal)}</span>
              </p>
              <p className="mt-2 flex justify-between gap-3">
                <span>Delivery</span>
                <span>Demo estimate only</span>
              </p>
              <p className="mt-3 flex justify-between gap-3 text-lg font-black">
                <span>Total</span>
                <span>{formatProductPrice(order.total)}</span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/shop"
              className={buttonVariants({
                variant: "primary",
                size: "lg",
                className: "w-full",
              })}
            >
              Continue Shopping
            </Link>
            <Link
              href="/account/orders"
              className={buttonVariants({
                variant: "secondary",
                size: "lg",
                className: "w-full",
              })}
            >
              View Orders Placeholder
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
