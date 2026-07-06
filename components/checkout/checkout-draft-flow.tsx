"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import { CheckoutNextSteps } from "@/components/checkout/checkout-next-steps";
import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { SafeImage } from "@/components/shared/safe-image";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  emptyCheckoutDraft,
  readCheckoutDraft,
  validateCheckoutDraft,
  writeCheckoutDraft,
  type CheckoutDraft,
  type CheckoutDraftErrors,
} from "@/lib/checkout/checkout-draft";
import {
  buildCheckoutReviewSnapshot,
  writeCheckoutReview,
} from "@/lib/checkout/checkout-review";
import { formatProductPrice } from "@/lib/data/products";
import { cn } from "@/lib/cn";
import { skxnzFallbackAssets } from "@/src/lib/assets";

export function CheckoutDraftFlow() {
  const { cartItems, isHydrated } = useMarketplace();
  const [draft, setDraft] = useState<CheckoutDraft>(emptyCheckoutDraft);
  const [errors, setErrors] = useState<CheckoutDraftErrors>({});
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const [draftStatus, setDraftStatus] = useState<
    "idle" | "incomplete" | "ready"
  >("idle");

  useEffect(() => {
    setDraft(readCheckoutDraft());
    setIsDraftHydrated(true);
  }, []);

  // Persist as the buyer types so a refresh never erases entered details.
  useEffect(() => {
    if (!isDraftHydrated) {
      return;
    }

    writeCheckoutDraft(draft);
  }, [draft, isDraftHydrated]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total + (item.product.salePrice ?? item.product.price) * item.quantity,
        0,
      ),
    [cartItems],
  );

  function updateContact(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setDraft((current) => ({
      ...current,
      contact: { ...current.contact, [name]: value },
    }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setDraftStatus("idle");
  }

  function updateAddress(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setDraft((current) => ({
      ...current,
      address: { ...current.address, [name]: value },
    }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setDraftStatus("idle");
  }

  function updateDeliveryNote(event: ChangeEvent<HTMLTextAreaElement>) {
    const { value } = event.target;

    setDraft((current) => ({ ...current, deliveryNote: value }));
    setDraftStatus("idle");
  }

  function saveDraftForReview() {
    const nextErrors = validateCheckoutDraft(draft);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setDraftStatus("incomplete");
      return;
    }

    writeCheckoutDraft(draft);
    // Save a device-local review snapshot for the future live-payment handoff.
    // This is NOT an order: no order id, payment, or delivery is created here.
    writeCheckoutReview(buildCheckoutReviewSnapshot(cartItems, draft));
    setDraftStatus("ready");
  }

  if (isHydrated && cartItems.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <EmptyState
          title="Checkout needs cart items."
          description="Your cart is empty, so there is nothing to review yet. Add pieces from the SKXNZ catalog to start a checkout draft."
          actionHref="/shop"
          actionLabel="Shop Products"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[92rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Card className="section-border overflow-hidden rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_0.62fr]">
          <div className="min-w-0 p-6 sm:p-8 lg:p-10">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Checkout review
            </p>
            <h1 className="mt-4 max-w-[14ch] break-words font-display text-[2.35rem] uppercase leading-[0.92] tracking-[-0.04em] text-midnightbrown sm:text-5xl lg:text-6xl">
              Prepare your order.
            </h1>
            <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-stone sm:text-base">
              Enter contact and shipping details to prepare a checkout draft.
              Details are saved on this device only.
            </p>
          </div>
          <div className="min-w-0 border-t border-[rgba(58,8,24,0.12)] bg-[linear-gradient(135deg,var(--skxnz-maroon-deep),var(--skxnz-maroon),var(--skxnz-obsidian))] p-6 text-[var(--skxnz-text-light)] sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[rgba(255,254,250,0.72)]">
              Payment status
            </p>
            <h2 className="mt-4 max-w-sm break-words font-display text-2xl uppercase leading-tight tracking-[0.04em] sm:text-3xl">
              Live payment is not connected yet.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[rgba(255,254,250,0.82)]">
              This step prepares a checkout draft only. No payment is collected
              and no order is placed.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section className="min-w-0 space-y-6">
          <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Step 1
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
              Contact details
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field
                label="Full name"
                name="fullName"
                value={draft.contact.fullName}
                error={errors.fullName}
                autoComplete="name"
                onChange={updateContact}
              />
              <Field
                label="Phone"
                name="phone"
                value={draft.contact.phone}
                error={errors.phone}
                type="tel"
                autoComplete="tel"
                onChange={updateContact}
              />
              <Field
                label="Email"
                name="email"
                value={draft.contact.email}
                error={errors.email}
                type="email"
                autoComplete="email"
                className="sm:col-span-2"
                onChange={updateContact}
              />
            </div>
          </Card>

          <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Step 2
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
              Shipping address
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field
                label="Address line 1"
                name="line1"
                value={draft.address.line1}
                error={errors.line1}
                autoComplete="address-line1"
                className="sm:col-span-2"
                onChange={updateAddress}
              />
              <Field
                label="Address line 2 (optional)"
                name="line2"
                value={draft.address.line2}
                autoComplete="address-line2"
                className="sm:col-span-2"
                onChange={updateAddress}
              />
              <Field
                label="City"
                name="city"
                value={draft.address.city}
                error={errors.city}
                autoComplete="address-level2"
                onChange={updateAddress}
              />
              <Field
                label="State"
                name="state"
                value={draft.address.state}
                error={errors.state}
                autoComplete="address-level1"
                onChange={updateAddress}
              />
              <Field
                label="Pincode"
                name="pincode"
                value={draft.address.pincode}
                error={errors.pincode}
                autoComplete="postal-code"
                onChange={updateAddress}
              />
              <Field
                label="Country"
                name="country"
                value={draft.address.country}
                autoComplete="country-name"
                onChange={updateAddress}
              />
            </div>
          </Card>

          <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Step 3
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
              Delivery note
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone">
              Optional instructions for delivery, saved with your draft.
            </p>
            <label className="mt-5 block min-w-0">
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
                Note (optional)
              </span>
              <textarea
                name="deliveryNote"
                value={draft.deliveryNote}
                rows={3}
                maxLength={500}
                onChange={updateDeliveryNote}
                className="mt-2 w-full rounded-[22px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-3 text-sm text-midnightbrown outline-none transition placeholder:text-stone focus:border-[rgba(34,211,238,0.34)] focus:ring-4 focus:ring-[rgba(34,211,238,0.08)]"
                placeholder="Landmark, preferred delivery time, or other instructions."
              />
            </label>
          </Card>

          <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] p-6 sm:p-8">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Step 4
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
              Payment
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone">
              Secure payment is the next step being connected. Nothing is
              charged, and no order exists until live payment goes live.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled
                aria-disabled="true"
                className={cn(
                  buttonVariants({ variant: "primary", size: "lg" }),
                  "cursor-not-allowed opacity-50",
                )}
              >
                Continue To Secure Payment
              </button>
              <p className="text-xs leading-5 text-stone">
                Live payment connection is next. No order is placed yet.
              </p>
            </div>
          </Card>

          <CheckoutNextSteps />
        </section>

        <aside className="min-w-0 space-y-4 self-start xl:sticky xl:top-28">
          <Card className="section-border min-w-0 rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-7">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Cart summary
            </p>
            <div className="mt-5 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}-${item.color}`}
                  className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-4 rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-3"
                >
                  <div className="relative aspect-square overflow-hidden rounded-[18px] bg-[var(--skxnz-card)]">
                    <SafeImage
                      src={item.image || item.product.image}
                      fallbackSrc={skxnzFallbackAssets.product}
                      alt={item.product.name}
                      fill
                      sizes="72px"
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-sangria">
                      {item.product.brandName}
                    </p>
                    <p className="mt-1 line-clamp-2 break-words text-sm font-bold leading-snug text-midnightbrown">
                      {item.product.name}
                    </p>
                    <p className="mt-2 text-xs text-stone">
                      {item.size || "One Size"} · {item.color || "Default"} · Qty{" "}
                      {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <SummaryRow label="Subtotal" value={formatProductPrice(subtotal)} />
              <SummaryRow label="Delivery" value="Calculated at live checkout" />
              <SummaryRow label="Taxes" value="Calculated at live checkout" />
              <SummaryRow
                label="Estimated payable"
                value={formatProductPrice(subtotal)}
                strong
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-stone">
              Estimate before payment. Delivery and taxes are added when live
              checkout is connected.
            </p>
          </Card>

          <Card className="section-border min-w-0 rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-7">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Checkout draft
            </p>
            <p className="mt-3 text-sm leading-7 text-stone">
              Save your details as a draft on this device. This does not place
              an order.
            </p>
            <button
              type="button"
              onClick={saveDraftForReview}
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "mt-4 w-full",
              )}
            >
              Save Checkout Draft
            </button>

            {draftStatus === "ready" ? (
              <div
                role="status"
                className="mt-4 rounded-[22px] border border-[rgba(34,211,238,0.28)] bg-[rgba(34,211,238,0.08)] p-4 text-sm leading-6 text-midnightbrown"
              >
                <span className="mr-2 text-[0.66rem] font-bold uppercase tracking-[0.2em] text-sangria">
                  Checkout draft ready
                </span>
                Your details are saved on this device for the live payment step.
                No order is placed and no payment is taken yet.
                <Link
                  href="/orders"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "mt-3 w-full",
                  )}
                >
                  See Order Readiness
                </Link>
              </div>
            ) : null}

            {draftStatus === "incomplete" ? (
              <div
                role="status"
                className="mt-4 rounded-[22px] border border-[rgba(217,70,239,0.24)] bg-[rgba(217,70,239,0.06)] p-4 text-sm leading-6 text-midnightbrown"
              >
                Some required details are missing or invalid. Check the
                highlighted fields above.
              </div>
            ) : null}

            <Link
              href="/cart"
              className={cn(
                buttonVariants({ variant: "ghost", size: "md" }),
                "mt-4 w-full",
              )}
            >
              Back To Cart
            </Link>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  value,
  error,
  type = "text",
  autoComplete,
  className,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  className?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
        {label}
      </span>
      <input
        name={name}
        value={value}
        type={type}
        autoComplete={autoComplete}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        className="mt-2 w-full rounded-[22px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-3 text-sm text-midnightbrown outline-none transition placeholder:text-stone focus:border-[rgba(34,211,238,0.34)] focus:ring-4 focus:ring-[rgba(34,211,238,0.08)]"
      />
      {error ? (
        <span className="mt-2 block text-xs font-semibold text-sangria">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-[20px] border px-4 py-3",
        strong
          ? "border-[rgba(58,8,24,0.18)] bg-[var(--skxnz-maroon-deep)] text-[var(--skxnz-text-light)]"
          : "border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] text-stone",
      )}
    >
      <span className="min-w-0 break-words">{label}</span>
      <span className="min-w-0 break-words text-right font-bold">{value}</span>
    </div>
  );
}
