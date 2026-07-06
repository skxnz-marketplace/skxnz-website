"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { readCheckoutReview } from "@/lib/checkout/checkout-review";
import type { CheckoutReviewSnapshot } from "@/lib/orders/order-readiness";
import { cn } from "@/lib/cn";
import { formatInrFromPaise } from "@/lib/money";

// Honest buyer order-readiness state. No fake orders, no fake IDs, no delivery
// dates. It reports what the buyer has prepared on-device and points to the
// real next steps only.
export function OrderReadinessPanel() {
  const { cartItems, isHydrated } = useMarketplace();
  const [review, setReview] = useState<CheckoutReviewSnapshot | null>(null);
  const [isReviewHydrated, setIsReviewHydrated] = useState(false);

  useEffect(() => {
    setReview(readCheckoutReview());
    setIsReviewHydrated(true);
  }, []);

  const hasCartItems = isHydrated && cartItems.length > 0;
  const hasReview =
    isReviewHydrated && review !== null && review.lineItems.length > 0;

  return (
    <Card className="section-border overflow-hidden rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        Order readiness
      </p>
      <h2 className="mt-3 max-w-[18ch] font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown sm:text-4xl">
        No orders yet — and we will not fake one.
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-stone">
        Order history will appear after live payment is connected. Until then
        there are no orders to show, so nothing is invented here — no order IDs,
        no payment status, no delivery dates.
      </p>

      {hasReview ? (
        <div className="mt-6 rounded-[24px] border border-[rgba(34,211,238,0.28)] bg-[rgba(34,211,238,0.08)] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-sangria">
              Saved checkout review
            </span>
            <span className="rounded-full border border-[rgba(58,8,24,0.16)] bg-[var(--skxnz-surface)] px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-stone">
              Not an order
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-midnightbrown">
            You prepared {review.lineItems.length}{" "}
            {review.lineItems.length === 1 ? "item" : "items"} on this device.
            Estimated subtotal {formatInrFromPaise(review.subtotalCents)}, before
            delivery and taxes. This is a draft for the live payment step, not a
            placed order.
          </p>
          <Link
            href="/checkout"
            className={cn(
              buttonVariants({ variant: "secondary", size: "md" }),
              "mt-4",
            )}
          >
            Review Checkout Details
          </Link>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/shop"
          className={buttonVariants({ variant: "primary", size: "lg" })}
        >
          Back To Shop
        </Link>
        {hasCartItems ? (
          <Link
            href="/cart"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            View Cart ({cartItems.length})
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
