"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { readCheckoutDraft } from "@/lib/checkout/checkout-draft";
import {
  checkoutAttemptKey,
  resolveCheckoutAttempt,
  type CheckoutAttemptView,
} from "@/lib/checkout/order-attempt";
import { cn } from "@/lib/cn";
import {
  createOrderIntent,
  type CreateOrderItemInput,
} from "@/lib/orders/create-order-intent";
import type { BuyerAddressOption } from "@/lib/orders/read-buyer-addresses";

type PlaceDraftOrderProps = {
  addresses: BuyerAddressOption[];
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
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? "",
  );
  const [attempt, setAttempt] = useState<CheckoutAttemptView>({ kind: "ready" });
  const [submissionPhase, setSubmissionPhase] = useState<
    "idle" | "validating" | "submitting"
  >("idle");
  const [isPending, startTransition] = useTransition();
  const idempotencyKey = useRef(crypto.randomUUID());
  const submitLock = useRef(false);

  if (isHydrated && cartItems.length === 0) return null;

  function startNewAttempt() {
    idempotencyKey.current = checkoutAttemptKey(
      idempotencyKey.current,
      "new-attempt",
      () => crypto.randomUUID(),
    );
    setAttempt({ kind: "ready" });
  }

  function handleCreateDraftOrder() {
    if (isPending || submitLock.current) return;

    if (!backendReady) {
      setAttempt(
        resolveCheckoutAttempt({
          ok: false,
          code: "NOT_WIRED",
          message: "Unavailable",
        }),
      );
      return;
    }
    if (cartItems.length === 0) {
      setAttempt(
        resolveCheckoutAttempt({
          ok: false,
          code: "VALIDATION_FAILED",
          message: "Empty cart",
        }),
      );
      return;
    }
    if (!selectedAddressId) {
      setAttempt(
        resolveCheckoutAttempt({
          ok: false,
          code: "ADDRESS_REQUIRED",
          message: "Address required",
        }),
      );
      return;
    }

    const items: CreateOrderItemInput[] = cartItems.map((item) => ({
      productId: item.productId,
      productSlug: item.product.slug,
      variantId: item.productVariantId ?? null,
      quantity: item.quantity,
      clientUnitPricePaise: item.unitPriceCents,
    }));
    const notes = readCheckoutDraft().deliveryNote?.trim() || null;

    setAttempt({ kind: "ready" });
    setSubmissionPhase("validating");
    submitLock.current = true;
    startTransition(async () => {
      setSubmissionPhase("submitting");
      try {
        const result = await createOrderIntent({
          items,
          shippingAddressId: selectedAddressId,
          notes,
          idempotencyKey: checkoutAttemptKey(
            idempotencyKey.current,
            "retry",
            () => crypto.randomUUID(),
          ),
        });
        setAttempt(resolveCheckoutAttempt(result));

        if (result.ok) {
          router.replace(result.redirectTo);
        }
      } catch {
        setAttempt(
          resolveCheckoutAttempt({
            ok: false,
            code: "DB_ERROR",
            message: "Temporary failure",
          }),
        );
      } finally {
        submitLock.current = false;
        setSubmissionPhase("idle");
      }
    });
  }

  const hasAddresses = addresses.length > 0;
  const isFailure = !["ready", "created", "recovered"].includes(attempt.kind);
  const isRetryable = attempt.kind === "retryable";

  return (
    <Card className="section-border overflow-hidden rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)]">
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.68fr)]">
        <div className="min-w-0 p-6 sm:p-8 lg:p-10">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Final review
          </p>
          <h2 className="mt-3 break-words font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown sm:text-4xl">
            Create an unpaid draft.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone">
            We recheck each item, option, quantity, price, and address before saving.
            A draft is not a paid or confirmed order. Nothing is charged or shipped.
          </p>

          {!hasAddresses ? (
            <div className="mt-5 rounded-[22px] border border-[rgba(58,8,24,0.14)] bg-[var(--skxnz-bg-soft)] p-4">
              <p className="text-sm leading-6 text-midnightbrown">
                Add a delivery address before creating your draft.
              </p>
              <Link
                href="/account/addresses"
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-3")}
              >
                Add delivery address
              </Link>
            </div>
          ) : (
            <fieldset className="mt-6">
              <legend className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
                Deliver to
              </legend>
              <div className="mt-3 space-y-2">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-start gap-3 rounded-[20px] border p-4 text-sm focus-within:ring-4 focus-within:ring-[rgba(34,211,238,0.10)]",
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
                        setAttempt({ kind: "ready" });
                      }}
                      className="mt-1 h-4 w-4"
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
                className="mt-3 inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-[0.16em] text-sangria underline-offset-4 hover:underline"
              >
                Add or manage addresses
              </Link>
            </fieldset>
          )}
        </div>

        <div className="min-w-0 border-t border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-stone">
            Draft status
          </p>
          <h3 className="mt-3 font-display text-2xl uppercase leading-tight text-midnightbrown">
            {submissionPhase === "validating"
              ? "Validating your cart"
              : submissionPhase === "submitting"
                ? "Saving your draft"
                : "Ready when you are"}
          </h3>
          <p className="mt-3 text-sm leading-6 text-stone">
            {isPending
              ? "Checking live availability and saving one draft. Keep this page open."
              : "Your cart stays intact. If a temporary problem occurs, retrying uses the same protected attempt."}
          </p>

          <button
            type="button"
            onClick={handleCreateDraftOrder}
            disabled={isPending || !hasAddresses || attempt.kind === "conflict"}
            aria-busy={isPending}
            className={cn(
              buttonVariants({ variant: "primary", size: "lg" }),
              "mt-6 min-h-12 w-full",
              (isPending || !hasAddresses || attempt.kind === "conflict") &&
                "cursor-not-allowed opacity-50",
            )}
          >
            {isPending
              ? "Creating draft…"
              : isRetryable
                ? "Try again"
                : "Create draft order"}
          </button>
          <p className="mt-3 text-xs leading-5 text-stone">
            No payment is taken. Payment remains unavailable until its secure connection is complete.
          </p>
          <Link
            href="/support"
            className="mt-2 inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-[0.16em] text-sangria underline-offset-4 hover:underline"
          >
            Get checkout support
          </Link>

          {attempt.kind !== "ready" ? (
            <div
              role={isFailure ? "alert" : "status"}
              aria-live={isFailure ? "assertive" : "polite"}
              className={cn(
                "mt-5 rounded-[22px] border p-4 text-sm leading-6 text-midnightbrown",
                isFailure
                  ? "border-[rgba(217,70,239,0.24)] bg-[rgba(217,70,239,0.06)]"
                  : "border-[rgba(34,211,238,0.28)] bg-[rgba(34,211,238,0.08)]",
              )}
            >
              <p className="font-bold">{attempt.title}</p>
              <p className="mt-1">{attempt.message}</p>
              {attempt.kind === "conflict" ? (
                <button
                  type="button"
                  onClick={startNewAttempt}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "mt-3 min-h-11 w-full",
                  )}
                >
                  Start a new checkout attempt
                </button>
              ) : null}
              {attempt.kind === "auth" ? (
                <Link
                  href="/login?next=%2Fcheckout"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "mt-3 min-h-11 w-full",
                  )}
                >
                  Sign in again
                </Link>
              ) : null}
              {["address", "stock", "unavailable", "invalid"].includes(attempt.kind) ? (
                <Link
                  href={attempt.kind === "address" ? "/account/addresses" : "/cart"}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "mt-3 min-h-11 w-full",
                  )}
                >
                  {attempt.kind === "address" ? "Review addresses" : "Review cart"}
                </Link>
              ) : null}
            </div>
          ) : (
            <p role="status" aria-live="polite" className="sr-only">
              Checkout is ready for review.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
