"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { readCheckoutDraft } from "@/lib/checkout/checkout-draft";
import { cn } from "@/lib/cn";
import {
  createOrderIntent,
  type CreateOrderItemInput,
} from "@/lib/orders/create-order-intent";
import type { BuyerAddressOption } from "@/lib/orders/read-buyer-addresses";

// Checkout → real internal DRAFT order (D4-8). This is NOT payment: it calls
// the server action createOrderIntent, which re-fetches every price/product/
// address server-side and inserts an unpaid DRAFT order. The client only
// sends WHICH product/variant/quantity and WHICH saved address — never
// prices, titles, or totals. On success we route to /orders/<id>; the cart
// is deliberately NOT cleared (see note in the panel copy + PROGRESS.md).

type PlaceDraftOrderProps = {
  addresses: BuyerAddressOption[];
  /** false only if the commerce tables are missing (pre-migration). */
  backendReady: boolean;
};

function formatAddress(address: BuyerAddressOption): string {
  return [
    address.label ? `${address.label}: ` : "",
    address.line1,
    address.city,
    address.postalCode ?? "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function PlaceDraftOrder({ addresses, backendReady }: PlaceDraftOrderProps) {
  const router = useRouter();
  const { cartItems, isHydrated } = useMarketplace();
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Cart empty state is already handled by CheckoutDraftFlow above; render
  // nothing here so the page does not show two empty states.
  if (isHydrated && cartItems.length === 0) {
    return null;
  }

  function handleCreateDraftOrder() {
    if (isPending) {
      return; // double-submit guard (in addition to the disabled button)
    }
    setError(null);

    if (!backendReady) {
      setError(
        "Order creation is not connected yet. Nothing was created and nothing was charged.",
      );
      return;
    }
    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!selectedAddressId) {
      setError("Select a delivery address before creating an order.");
      return;
    }

    const items: CreateOrderItemInput[] = cartItems.map((item) => ({
      productId: item.productId,
      productSlug: item.product.slug,
      variantId: item.productVariantId ?? null,
      quantity: item.quantity,
    }));
    // Delivery note comes from the device-local checkout draft (optional).
    const notes = readCheckoutDraft().deliveryNote?.trim() || null;

    startTransition(async () => {
      const result = await createOrderIntent({
        items,
        shippingAddressId: selectedAddressId,
        notes,
      });

      if (result.ok) {
        // Cart is intentionally left as-is: the order is an UNPAID draft, so
        // clearing the cart would hide the items before anything is paid.
        router.push(result.redirectTo);
        return;
      }
      setError(result.message);
    });
  }

  const hasAddresses = addresses.length > 0;

  return (
    <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        Create draft order
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
        Save an unpaid draft order.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-stone">
        This creates a real but unpaid <strong>draft</strong> order in your
        account from your cart. No payment is taken, nothing ships, and no
        order is confirmed — you complete payment later when live checkout is
        connected.
      </p>

      {!hasAddresses ? (
        <div className="mt-5 rounded-[22px] border border-[rgba(58,8,24,0.14)] bg-[var(--skxnz-bg-soft)] p-4">
          <p className="text-sm leading-6 text-midnightbrown">
            Add a delivery address to continue checkout. Your saved addresses
            appear here for selection.
          </p>
          <Link
            href="/account/addresses"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-3")}
          >
            Add Delivery Address
          </Link>
        </div>
      ) : (
        <fieldset className="mt-5">
          <legend className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
            Deliver to
          </legend>
          <div className="mt-3 space-y-2">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-[20px] border p-4 text-sm",
                  selectedAddressId === address.id
                    ? "border-[rgba(34,211,238,0.4)] bg-[rgba(34,211,238,0.06)]"
                    : "border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)]",
                )}
              >
                <input
                  type="radio"
                  name="shippingAddress"
                  value={address.id}
                  checked={selectedAddressId === address.id}
                  onChange={() => {
                    setSelectedAddressId(address.id);
                    setError(null);
                  }}
                  className="mt-1"
                />
                <span className="min-w-0 break-words text-midnightbrown">
                  {formatAddress(address)}
                  {address.isDefault ? (
                    <span className="ml-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sangria">
                      Default
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
          <Link
            href="/account/addresses"
            className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.16em] text-sangria underline-offset-4 hover:underline"
          >
            Add or manage addresses
          </Link>
        </fieldset>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleCreateDraftOrder}
          disabled={isPending || !hasAddresses}
          aria-busy={isPending}
          className={cn(
            buttonVariants({ variant: "primary", size: "lg" }),
            (isPending || !hasAddresses) && "cursor-not-allowed opacity-50",
          )}
        >
          {isPending ? "Creating Draft Order…" : "Create Draft Order"}
        </button>
        <p className="text-xs leading-5 text-stone">
          Unpaid draft only. No payment is taken and nothing ships yet.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-[22px] border border-[rgba(217,70,239,0.24)] bg-[rgba(217,70,239,0.06)] p-4 text-sm leading-6 text-midnightbrown"
        >
          {error}
        </div>
      ) : null}
    </Card>
  );
}
