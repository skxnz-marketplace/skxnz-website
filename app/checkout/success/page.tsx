import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// NOTE: The old demo checkout success view (DemoCheckoutSuccess) is
// intentionally no longer rendered. This route must never look like a real
// order confirmation while live payment is not connected. It becomes a real
// confirmation page only after server-verified payment exists.

export const metadata: Metadata = {
  title: "Checkout Status",
  description:
    "SKXNZ checkout status. Payment is unavailable and this route is not an order confirmation.",
};

export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-8 text-center sm:p-10">
        <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
          Checkout status
        </p>
        <h1 className="mx-auto mt-4 max-w-[16ch] break-words font-display text-4xl uppercase leading-tight tracking-[0.04em] text-midnightbrown sm:text-5xl">
          No paid order is confirmed.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone">
          This route is not used for unpaid draft success. Nothing was charged
          and there is no paid confirmation to show. Return to checkout to review
          your cart or create an unpaid draft safely.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/checkout"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            Back To Checkout Review
          </Link>
          <Link
            href="/cart"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            View Cart
          </Link>
          <Link
            href="/shop"
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            Continue Shopping
          </Link>
        </div>
      </Card>
    </main>
  );
}
