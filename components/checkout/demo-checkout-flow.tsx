"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { SafeImage } from "@/components/shared/safe-image";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  demoCheckoutOrderStorageKey,
  demoPaymentLabels,
  type DemoCheckoutOrder,
  type DemoPaymentMethod,
  type DemoShippingDetails,
} from "@/components/checkout/demo-checkout-data";
import { formatProductPrice } from "@/lib/data/products";
import {
  addressToSingleLine,
  getDefaultDemoAddress,
  getDemoAddresses,
} from "@/lib/data/addresses";
import { upsertDemoCheckoutOrder } from "@/lib/data/orders";
import type { Address } from "@/lib/types/skxnz-data";
import { cn } from "@/lib/cn";
import { skxnzFallbackAssets } from "@/src/lib/assets";

type CheckoutStep = "shipping" | "payment" | "review";
type ShippingErrors = Partial<Record<keyof DemoShippingDetails, string>>;

const initialShipping: DemoShippingDetails = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

const checkoutSteps: { id: CheckoutStep; label: string }[] = [
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Demo payment" },
  { id: "review", label: "Review" },
];

const paymentOptions: {
  id: DemoPaymentMethod;
  title: string;
  description: string;
}[] = [
  {
    id: "cod-demo",
    title: "Cash on delivery demo",
    description:
      "Internal test option only. No delivery collection workflow is connected.",
  },
  {
    id: "card-demo",
    title: "Card demo placeholder",
    description:
      "No card details are collected. Live payment gateway integration comes later.",
  },
  {
    id: "upi-demo",
    title: "UPI demo placeholder",
    description:
      "No UPI request is created. This only tests the checkout interface.",
  },
];

function createDemoOrderId() {
  return `SKXNZ-DEMO-${Date.now().toString(36).toUpperCase()}`;
}

function validateShipping(shipping: DemoShippingDetails) {
  const errors: ShippingErrors = {};

  if (!shipping.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!shipping.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (shipping.phone.replace(/\D/g, "").length < 7) {
    errors.phone = "Enter a valid phone number for demo checkout.";
  }

  if (!shipping.email.trim()) {
    errors.email = "Email is required.";
  } else if (!shipping.email.includes("@")) {
    errors.email = "Enter a valid email format.";
  }

  if (!shipping.address.trim()) {
    errors.address = "Address is required.";
  }

  if (!shipping.city.trim()) {
    errors.city = "City is required.";
  }

  if (!shipping.state.trim()) {
    errors.state = "State is required.";
  }

  if (!shipping.pincode.trim()) {
    errors.pincode = "Pincode is required.";
  } else if (shipping.pincode.replace(/\D/g, "").length < 4) {
    errors.pincode = "Enter a valid pincode for demo checkout.";
  }

  return errors;
}

export function DemoCheckoutFlow() {
  const router = useRouter();
  const { cartItems, clearCart } = useMarketplace();
  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [shipping, setShipping] =
    useState<DemoShippingDetails>(initialShipping);
  const [shippingErrors, setShippingErrors] = useState<ShippingErrors>({});
  const [paymentMethod, setPaymentMethod] =
    useState<DemoPaymentMethod | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  useEffect(() => {
    const addresses = getDemoAddresses();
    const defaultAddress = getDefaultDemoAddress(addresses);

    setSavedAddresses(addresses);

    if (defaultAddress) {
      setShipping((current) => ({
        ...current,
        fullName: defaultAddress.fullName,
        phone: defaultAddress.phoneNumber,
        address: addressToSingleLine(defaultAddress),
        city: defaultAddress.city,
        state: defaultAddress.state ?? "",
        pincode: defaultAddress.postalCode,
      }));
    }
  }, []);

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (total, item) =>
        total + (item.product.salePrice ?? item.product.price) * item.quantity,
      0,
    );

    return {
      subtotal,
      shippingEstimate: 0,
      total: subtotal,
    };
  }, [cartItems]);

  function handleShippingChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setShipping((current) => ({
      ...current,
      [name]: value,
    }));
    setShippingErrors((current) => ({
      ...current,
      [name]: undefined,
    }));
  }

  function handleShippingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateShipping(shipping);
    setShippingErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setStep("payment");
  }

  function continueToReview() {
    if (!paymentMethod) {
      setPaymentError("Select a demo payment method before review.");
      return;
    }

    setPaymentError(null);
    setStep("review");
  }

  function createInternalTestOrder() {
    if (!paymentMethod || cartItems.length === 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const order: DemoCheckoutOrder = {
      id: createDemoOrderId(),
      createdAt: new Date().toISOString(),
      shipping,
      paymentMethod,
      paymentLabel: demoPaymentLabels[paymentMethod],
      items: cartItems,
      subtotal: totals.subtotal,
      shippingEstimate: totals.shippingEstimate,
      total: totals.total,
      note: "Internal test order only. Payment integration coming later.",
    };

    window.localStorage.setItem(
      demoCheckoutOrderStorageKey,
      JSON.stringify(order),
    );
    upsertDemoCheckoutOrder(order);
    clearCart();
    router.push("/checkout/success");
  }

  if (cartItems.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <EmptyState
          title="Checkout needs cart items."
          description="Demo checkout is blocked when the cart is empty. Add a product first to create an internal test order."
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
              Demo checkout
            </p>
            <h1 className="mt-4 max-w-[14ch] break-words font-display text-[2.35rem] uppercase leading-[0.92] tracking-[-0.04em] text-midnightbrown sm:text-5xl lg:text-6xl">
              Internal test order.
            </h1>
            <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-stone sm:text-base">
              Complete a safe SKXNZ checkout rehearsal. This does not process live
              payment, reserve delivery, or create a production order.
            </p>
          </div>
          <div className="min-w-0 border-t border-[rgba(58,8,24,0.12)] bg-[linear-gradient(135deg,var(--skxnz-maroon-deep),var(--skxnz-maroon),var(--skxnz-obsidian))] p-6 text-[var(--skxnz-text-light)] sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[rgba(255,254,250,0.72)]">
              Safety label
            </p>
            <p className="mt-4 text-sm leading-7 text-[rgba(255,254,250,0.82)]">
              Payment integration coming later. Card and UPI options below are
              interface placeholders and never ask for real payment details.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section className="min-w-0 space-y-6">
          <CheckoutSteps currentStep={step} />

          {step === "shipping" ? (
            <ShippingStep
              shipping={shipping}
              savedAddresses={savedAddresses}
              errors={shippingErrors}
              onChange={handleShippingChange}
              onUseAddress={(address) =>
                setShipping((current) => ({
                  ...current,
                  fullName: address.fullName,
                  phone: address.phoneNumber,
                  address: addressToSingleLine(address),
                  city: address.city,
                  state: address.state ?? "",
                  pincode: address.postalCode,
                }))
              }
              onSubmit={handleShippingSubmit}
            />
          ) : null}

          {step === "payment" ? (
            <PaymentStep
              selectedPayment={paymentMethod}
              error={paymentError}
              onSelect={(method) => {
                setPaymentMethod(method);
                setPaymentError(null);
              }}
              onBack={() => setStep("shipping")}
              onContinue={continueToReview}
            />
          ) : null}

          {step === "review" ? (
            <ReviewStep
              shipping={shipping}
              paymentMethod={paymentMethod}
              subtotal={totals.subtotal}
              shippingEstimate={totals.shippingEstimate}
              total={totals.total}
              isSubmitting={isSubmitting}
              onBack={() => setStep("payment")}
              onCreateOrder={createInternalTestOrder}
            />
          ) : null}
        </section>

        <CheckoutSummary
          subtotal={totals.subtotal}
          shippingEstimate={totals.shippingEstimate}
          total={totals.total}
        />
      </div>
    </main>
  );
}

function CheckoutSteps({ currentStep }: { currentStep: CheckoutStep }) {
  const currentIndex = checkoutSteps.findIndex((item) => item.id === currentStep);

  return (
    <Card className="section-border rounded-[32px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {checkoutSteps.map((item, index) => {
          const isActive = item.id === currentStep;
          const isComplete = index < currentIndex;

          return (
            <div
              key={item.id}
              className={cn(
                "rounded-[22px] border px-4 py-3 text-xs font-bold uppercase tracking-[0.14em]",
                isActive
                  ? "border-[rgba(34,211,238,0.28)] bg-[rgba(34,211,238,0.08)] text-sangria"
                  : isComplete
                    ? "border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-maroon-deep)] text-[var(--skxnz-text-light)]"
                    : "border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] text-stone",
              )}
            >
              <span className="mr-2">{index + 1}.</span>
              {item.label}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ShippingStep({
  shipping,
  savedAddresses,
  errors,
  onChange,
  onUseAddress,
  onSubmit,
}: {
  shipping: DemoShippingDetails;
  savedAddresses: Address[];
  errors: ShippingErrors;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onUseAddress: (address: Address) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        Step 1
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
        Shipping details
      </h2>
      {savedAddresses.length > 0 ? (
        <div className="mt-6 rounded-[28px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-4">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-sangria">
            Saved local addresses
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {savedAddresses.map((address) => (
              <button
                key={address.id}
                type="button"
                onClick={() => onUseAddress(address)}
                className="min-w-0 rounded-[22px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-4 text-left transition hover:border-[rgba(34,211,238,0.30)]"
              >
                <span className="line-clamp-1 text-sm font-black uppercase tracking-[0.14em] text-midnightbrown">
                  {address.label || "Demo address"}
                  {address.isDefault ? " · Default" : ""}
                </span>
                <span className="mt-2 line-clamp-2 block text-sm leading-6 text-stone">
                  {addressToSingleLine(address)}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-stone">
            These are saved locally for now. Persistent account addresses coming
            later.
          </p>
        </div>
      ) : null}
      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <Field
          label="Full name"
          name="fullName"
          value={shipping.fullName}
          error={errors.fullName}
          onChange={onChange}
        />
        <Field
          label="Phone"
          name="phone"
          value={shipping.phone}
          error={errors.phone}
          onChange={onChange}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          value={shipping.email}
          error={errors.email}
          onChange={onChange}
        />
        <Field
          label="City"
          name="city"
          value={shipping.city}
          error={errors.city}
          onChange={onChange}
        />
        <Field
          label="State"
          name="state"
          value={shipping.state}
          error={errors.state}
          onChange={onChange}
        />
        <Field
          label="Pincode"
          name="pincode"
          value={shipping.pincode}
          error={errors.pincode}
          onChange={onChange}
        />
        <Field
          label="Address"
          name="address"
          value={shipping.address}
          error={errors.address}
          onChange={onChange}
          multiline
          className="sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <button
            type="submit"
            className={buttonVariants({
              variant: "primary",
              size: "lg",
              className: "w-full sm:w-auto",
            })}
          >
            Continue To Demo Payment
          </button>
        </div>
      </form>
    </Card>
  );
}

function PaymentStep({
  selectedPayment,
  error,
  onSelect,
  onBack,
  onContinue,
}: {
  selectedPayment: DemoPaymentMethod | null;
  error: string | null;
  onSelect: (method: DemoPaymentMethod) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        Step 2
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
        Demo payment
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-stone">
        Select a demo payment option. No card details, UPI requests, wallet
        redirects, or live gateway calls are connected.
      </p>

      <div className="mt-6 grid gap-4">
        {paymentOptions.map((option) => {
          const isSelected = selectedPayment === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                "min-w-0 rounded-[28px] border p-5 text-left transition",
                isSelected
                  ? "border-[rgba(34,211,238,0.32)] bg-[rgba(34,211,238,0.07)] shadow-[0_16px_34px_rgba(34,211,238,0.08)]"
                  : "border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] hover:border-[rgba(139,92,246,0.24)]",
              )}
            >
              <span className="block text-sm font-black uppercase tracking-[0.16em] text-midnightbrown">
                {option.title}
              </span>
              <span className="mt-2 block text-sm leading-6 text-stone">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="mt-4 rounded-[20px] border border-[rgba(217,70,239,0.24)] bg-[rgba(217,70,239,0.06)] px-4 py-3 text-sm text-midnightbrown">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onContinue}
          className={buttonVariants({ variant: "primary", size: "lg" })}
        >
          Continue To Review
        </button>
        <button
          type="button"
          onClick={onBack}
          className={buttonVariants({ variant: "secondary", size: "lg" })}
        >
          Back To Shipping
        </button>
      </div>
    </Card>
  );
}

function ReviewStep({
  shipping,
  paymentMethod,
  subtotal,
  shippingEstimate,
  total,
  isSubmitting,
  onBack,
  onCreateOrder,
}: {
  shipping: DemoShippingDetails;
  paymentMethod: DemoPaymentMethod | null;
  subtotal: number;
  shippingEstimate: number;
  total: number;
  isSubmitting: boolean;
  onBack: () => void;
  onCreateOrder: () => void;
}) {
  return (
    <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        Step 3
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
        Review internal test order
      </h2>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ReviewCard title="Shipping">
          <p>{shipping.fullName}</p>
          <p>{shipping.phone}</p>
          <p>{shipping.email}</p>
          <p>{shipping.address}</p>
          <p>
            {shipping.city}, {shipping.state} {shipping.pincode}
          </p>
        </ReviewCard>
        <ReviewCard title="Payment method">
          <p>{paymentMethod ? demoPaymentLabels[paymentMethod] : "Not selected"}</p>
          <p className="mt-2">
            Demo checkout for internal testing. No live payment will be
            processed.
          </p>
        </ReviewCard>
        <ReviewCard title="Totals">
          <p>Subtotal: {formatProductPrice(subtotal)}</p>
          <p>
            Delivery estimate:{" "}
            {shippingEstimate === 0
              ? "Demo estimate only"
              : formatProductPrice(shippingEstimate)}
          </p>
          <p className="font-black text-sangria">
            Demo total: {formatProductPrice(total)}
          </p>
        </ReviewCard>
        <ReviewCard title="Safety note">
          <p>
            This creates an internal test order only. Production order creation,
            delivery tracking, payment capture, and refunds are not connected.
          </p>
        </ReviewCard>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onCreateOrder}
          disabled={isSubmitting}
          className={buttonVariants({ variant: "primary", size: "lg" })}
        >
          Create Internal Test Order
        </button>
        <button
          type="button"
          onClick={onBack}
          className={buttonVariants({ variant: "secondary", size: "lg" })}
        >
          Back To Demo Payment
        </button>
      </div>
    </Card>
  );
}

function CheckoutSummary({
  subtotal,
  shippingEstimate,
  total,
}: {
  subtotal: number;
  shippingEstimate: number;
  total: number;
}) {
  const { cartItems } = useMarketplace();

  return (
    <Card className="section-border sticky top-28 min-w-0 self-start rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-7">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        Product Summary
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
        <SummaryRow
          label="Delivery"
          value={
            shippingEstimate === 0
              ? "Demo estimate only"
              : formatProductPrice(shippingEstimate)
          }
        />
        <SummaryRow label="Demo total" value={formatProductPrice(total)} strong />
      </div>

      <div className="mt-5 rounded-[24px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-4 text-sm leading-6 text-midnightbrown">
        Demo checkout. Payment integration coming later.
      </div>
    </Card>
  );
}

function Field({
  label,
  name,
  value,
  error,
  type = "text",
  multiline = false,
  className,
  onChange,
}: {
  label: string;
  name: keyof DemoShippingDetails;
  value: string;
  error?: string;
  type?: string;
  multiline?: boolean;
  className?: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  const fieldClassName =
    "mt-2 w-full rounded-[22px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-3 text-sm text-midnightbrown outline-none transition placeholder:text-stone focus:border-[rgba(34,211,238,0.34)] focus:ring-4 focus:ring-[rgba(34,211,238,0.08)]";

  return (
    <label className={cn("block min-w-0", className)}>
      <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
        {label}
      </span>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          rows={3}
          onChange={onChange}
          className={fieldClassName}
        />
      ) : (
        <input
          name={name}
          value={value}
          type={type}
          onChange={onChange}
          className={fieldClassName}
        />
      )}
      {error ? (
        <span className="mt-2 block text-xs font-semibold text-sangria">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function ReviewCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[26px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-5 text-sm leading-7 text-stone">
      <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-sangria">
        {title}
      </p>
      <div className="break-words">{children}</div>
    </div>
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
