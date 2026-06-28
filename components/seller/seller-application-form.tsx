"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  initialSellerApplicationDraft,
  priceRangeOptions,
  saveDemoSellerApplicationSubmission,
  sellerCategoryOptions,
  sellerTypeOptions,
  type DemoSellerApplicationSubmission,
  type SellerApplicationDraft,
} from "@/lib/data/seller-applications";
import { cn } from "@/lib/cn";

type SellerApplicationStep = "identity" | "products" | "verification" | "review";

const steps: { id: SellerApplicationStep; label: string; title: string }[] = [
  { id: "identity", label: "01", title: "Business identity" },
  { id: "products", label: "02", title: "Product details" },
  { id: "verification", label: "03", title: "Verification preview" },
  { id: "review", label: "04", title: "Review and submit" },
];

const fieldClassName =
  "mt-2 w-full min-w-0 rounded-[22px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-3 text-sm text-midnightbrown outline-none transition placeholder:text-stone focus:border-[rgba(34,211,238,0.34)] focus:ring-4 focus:ring-[rgba(34,211,238,0.08)]";

const textareaClassName =
  "mt-2 w-full min-w-0 rounded-[24px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-3 text-sm leading-7 text-midnightbrown outline-none transition placeholder:text-stone focus:border-[rgba(34,211,238,0.34)] focus:ring-4 focus:ring-[rgba(34,211,238,0.08)]";

function getStepIndex(stepId: SellerApplicationStep) {
  return steps.findIndex((step) => step.id === stepId);
}

function validateStep(step: SellerApplicationStep, form: SellerApplicationDraft) {
  const errors: string[] = [];

  if (step === "identity") {
    if (!form.businessName.trim()) errors.push("Business / brand name is required.");
    if (!form.contactPerson.trim()) errors.push("Contact person is required.");
    if (!form.email.trim() || !form.email.includes("@")) {
      errors.push("A valid email is required.");
    }
    if (!form.phone.trim()) errors.push("Phone number is required.");
    if (!form.city.trim()) errors.push("City is required.");
    if (!form.country.trim()) errors.push("Country is required.");
  }

  if (step === "products") {
    if (!form.subcategories.trim()) errors.push("Add at least one subcategory.");
    if (!Number(form.productsReady) || Number(form.productsReady) < 1) {
      errors.push("Number of products ready must be at least 1.");
    }
    if (form.brandDescription.trim().length < 20) {
      errors.push("Brand description should be at least 20 characters.");
    }
    if (!form.instagramOrWebsite.trim()) {
      errors.push("Instagram / website link is required for review context.");
    }
  }

  if (step === "verification") {
    if (!form.authenticityDeclaration) {
      errors.push("Authenticity declaration is required.");
    }
    if (!form.termsAgreement) {
      errors.push("Terms agreement is required.");
    }
  }

  return errors;
}

function createSellerNotes(form: SellerApplicationDraft) {
  return [
    `Seller application beta.`,
    `Seller type: ${form.sellerType}.`,
    `Main category: ${form.mainCategory}.`,
    `Subcategories: ${form.subcategories}.`,
    `Average price range: ${form.averagePriceRange}.`,
    `Brand description: ${form.brandDescription}.`,
    `Instagram / website: ${form.instagramOrWebsite}.`,
    `Business document placeholder: ${form.businessDocumentStatus}.`,
    `Brand authorization placeholder: ${form.brandAuthorizationStatus}.`,
    `Verification documents will be requested securely later if needed.`,
    `Seller Dashboard Beta is available for internal preview only. No instant approval, payouts, or live seller account activation.`,
  ].join("\n");
}

export function SellerApplicationForm() {
  const { submitSellerApplication } = useMarketplace();
  const [form, setForm] = useState<SellerApplicationDraft>(
    initialSellerApplicationDraft,
  );
  const [activeStep, setActiveStep] =
    useState<SellerApplicationStep>("identity");
  const [errors, setErrors] = useState<string[]>([]);
  const [submission, setSubmission] =
    useState<DemoSellerApplicationSubmission | null>(null);

  const activeStepIndex = getStepIndex(activeStep);
  const isFirstStep = activeStepIndex === 0;
  const isReviewStep = activeStep === "review";

  const summaryRows = useMemo(
    () => [
      ["Business / brand", form.businessName || "Not entered"],
      ["Seller type", form.sellerType],
      ["Contact", form.contactPerson || "Not entered"],
      ["Email", form.email || "Not entered"],
      ["Phone", form.phone || "Not entered"],
      ["City / country", `${form.city || "City"} · ${form.country || "Country"}`],
      ["Main category", form.mainCategory],
      ["Subcategories", form.subcategories || "Not entered"],
      ["Average price", form.averagePriceRange],
      ["Products ready", form.productsReady || "Not entered"],
      ["Instagram / website", form.instagramOrWebsite || "Not entered"],
      ["Document status", "Secure upload requested later"],
    ],
    [form],
  );

  function updateField<Field extends keyof SellerApplicationDraft>(
    field: Field,
    value: SellerApplicationDraft[Field],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors([]);
  }

  function goToStep(step: SellerApplicationStep) {
    const targetIndex = getStepIndex(step);

    if (targetIndex <= activeStepIndex) {
      setActiveStep(step);
      setErrors([]);
      return;
    }

    const currentErrors = validateStep(activeStep, form);

    if (currentErrors.length > 0) {
      setErrors(currentErrors);
      return;
    }

    setActiveStep(step);
    setErrors([]);
  }

  function goNext() {
    const currentErrors = validateStep(activeStep, form);

    if (currentErrors.length > 0) {
      setErrors(currentErrors);
      return;
    }

    const nextStep = steps[activeStepIndex + 1]?.id;

    if (nextStep) {
      setActiveStep(nextStep);
      setErrors([]);
    }
  }

  function goBack() {
    const previousStep = steps[activeStepIndex - 1]?.id;

    if (previousStep) {
      setActiveStep(previousStep);
      setErrors([]);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const allErrors = [
      ...validateStep("identity", form),
      ...validateStep("products", form),
      ...validateStep("verification", form),
    ];

    if (allErrors.length > 0) {
      setErrors(allErrors);
      setActiveStep(
        validateStep("identity", form).length > 0
          ? "identity"
          : validateStep("products", form).length > 0
            ? "products"
            : "verification",
      );
      return;
    }

    const marketplaceApplication = submitSellerApplication({
      storeName: form.businessName.trim(),
      ownerName: form.contactPerson.trim(),
      phoneNumber: form.phone.trim(),
      email: form.email.trim(),
      instagramPage: form.instagramOrWebsite.trim(),
      city: form.city.trim(),
      productCategory: `${form.mainCategory} / ${form.subcategories}`,
      productCount: Number(form.productsReady),
      gstAvailable: false,
      canShipOrders: false,
      productPhotoLink: form.instagramOrWebsite.trim(),
      priceRange: form.averagePriceRange,
      notes: createSellerNotes(form),
    });

    const nextSubmission = saveDemoSellerApplicationSubmission(
      form,
      marketplaceApplication.id,
    );

    setSubmission(nextSubmission);
    setForm(initialSellerApplicationDraft);
    setActiveStep("identity");
    setErrors([]);
  }

  if (submission) {
    return (
      <Card
        id="seller-application-form"
        className="section-border rounded-[30px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5 sm:p-6 lg:p-8"
      >
        <Badge>Application received</Badge>
        <h2 className="mt-4 max-w-[14ch] break-words font-display text-[2rem] font-semibold uppercase leading-[1] tracking-[-0.02em] text-midnightbrown sm:text-4xl">
          Seller application received for internal review.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-stone">
          Saved locally as a beta submission for internal review.
        </p>
        <div className="mt-5 rounded-[22px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-4 text-sm leading-6 text-midnightbrown">
          <p>
            Demo submission ID: <span className="font-black">{submission.id}</span>
          </p>
          <p>
            Review queue ID:{" "}
            <span className="font-black">{submission.marketplaceApplicationId}</span>
          </p>
          <p className="mt-2 text-stone">
            Dashboard Beta is internal only. Secure document requests come later.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href="/seller"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            Open Seller Dashboard Beta
          </a>
          <button
            type="button"
            onClick={() => setSubmission(null)}
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Submit Another Application
          </button>
          <a
            href="/contact"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Contact SKXNZ
          </a>
        </div>
      </Card>
    );
  }

  return (
    <Card
      id="seller-application-form"
      className="section-border rounded-[30px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5 sm:p-6 lg:p-8"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Badge>Seller application beta</Badge>
          <h2 className="mt-3 font-display text-2xl font-semibold uppercase leading-tight text-midnightbrown">
            Application intake
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone">
            Local intake only. No approval, payouts, or live seller account.
          </p>
        </div>
        <div className="rounded-[18px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-sangria">
          Step {activeStepIndex + 1} of {steps.length}
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-4">
        {steps.map((step, index) => {
          const isActive = step.id === activeStep;
          const isComplete = index < activeStepIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => goToStep(step.id)}
              className={cn(
                "flex min-w-0 items-center gap-3 rounded-[16px] px-3 py-2.5 text-left ring-1 transition",
                isActive
                  ? "bg-[rgba(58,8,24,0.08)] text-midnightbrown ring-[rgba(58,8,24,0.22)]"
                  : isComplete
                    ? "bg-[var(--skxnz-maroon-deep)] text-[var(--skxnz-text-light)] ring-[rgba(58,8,24,0.18)]"
                    : "bg-[var(--skxnz-bg-soft)] text-midnightbrown ring-[rgba(58,8,24,0.08)]",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.68rem] font-black tracking-[0.06em]",
                  isActive
                    ? "bg-[var(--skxnz-maroon-deep)] text-[var(--skxnz-text-light)]"
                    : isComplete
                      ? "bg-[var(--skxnz-text-light)] text-[var(--skxnz-maroon-deep)]"
                      : "bg-white text-[var(--skxnz-maroon)] ring-1 ring-[rgba(58,8,24,0.14)]",
                )}
              >
                {step.label}
              </span>
              <span className="line-clamp-2 block min-w-0 text-[0.68rem] font-black uppercase tracking-[0.06em]">
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      <form className="mt-6" onSubmit={handleSubmit}>
        {activeStep === "identity" ? (
          <BusinessIdentityStep form={form} updateField={updateField} />
        ) : null}

        {activeStep === "products" ? (
          <ProductDetailsStep form={form} updateField={updateField} />
        ) : null}

        {activeStep === "verification" ? (
          <VerificationStep form={form} updateField={updateField} />
        ) : null}

        {activeStep === "review" ? (
          <ReviewStep summaryRows={summaryRows} />
        ) : null}

        {errors.length > 0 ? (
          <div className="mt-6 rounded-[24px] border border-[rgba(217,70,239,0.24)] bg-[rgba(217,70,239,0.06)] p-4 text-sm leading-6 text-midnightbrown">
            <p className="font-black uppercase tracking-[0.14em]">Check these fields</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 rounded-[20px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-3 text-sm leading-6 text-stone">
          Beta intake. Secure documents, verification, payouts, and live access
          come later.
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {!isFirstStep ? (
            <button
              type="button"
              onClick={goBack}
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Back
            </button>
          ) : null}
          {isReviewStep ? (
            <button
              type="submit"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Submit Application
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Continue
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setForm(initialSellerApplicationDraft);
              setActiveStep("identity");
              setErrors([]);
            }}
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            Reset
          </button>
        </div>
      </form>
    </Card>
  );
}

function BusinessIdentityStep({
  form,
  updateField,
}: {
  form: SellerApplicationDraft;
  updateField: <Field extends keyof SellerApplicationDraft>(
    field: Field,
    value: SellerApplicationDraft[Field],
  ) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        label="Business / brand name"
        value={form.businessName}
        placeholder="Signal Atelier"
        onChange={(event) => updateField("businessName", event.target.value)}
      />
      <SelectField
        label="Seller type"
        value={form.sellerType}
        onChange={(event) =>
          updateField("sellerType", event.target.value as SellerApplicationDraft["sellerType"])
        }
        options={sellerTypeOptions}
      />
      <TextField
        label="Contact person"
        value={form.contactPerson}
        placeholder="Founder / owner name"
        onChange={(event) => updateField("contactPerson", event.target.value)}
      />
      <TextField
        label="Email"
        value={form.email}
        type="email"
        placeholder="studio@example.com"
        onChange={(event) => updateField("email", event.target.value)}
      />
      <TextField
        label="Phone"
        value={form.phone}
        type="tel"
        placeholder="+91 98765 43210"
        onChange={(event) => updateField("phone", event.target.value)}
      />
      <TextField
        label="City"
        value={form.city}
        placeholder="Mumbai"
        onChange={(event) => updateField("city", event.target.value)}
      />
      <TextField
        label="Country"
        value={form.country}
        placeholder="India"
        onChange={(event) => updateField("country", event.target.value)}
      />
    </div>
  );
}

function ProductDetailsStep({
  form,
  updateField,
}: {
  form: SellerApplicationDraft;
  updateField: <Field extends keyof SellerApplicationDraft>(
    field: Field,
    value: SellerApplicationDraft[Field],
  ) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label="Main category"
        value={form.mainCategory}
        onChange={(event) =>
          updateField("mainCategory", event.target.value as SellerApplicationDraft["mainCategory"])
        }
        options={sellerCategoryOptions}
      />
      <TextField
        label="Subcategories"
        value={form.subcategories}
        placeholder="Oversized tees, cargo pants, sneakers"
        onChange={(event) => updateField("subcategories", event.target.value)}
      />
      <SelectField
        label="Average product price range"
        value={form.averagePriceRange}
        onChange={(event) =>
          updateField(
            "averagePriceRange",
            event.target.value as SellerApplicationDraft["averagePriceRange"],
          )
        }
        options={priceRangeOptions}
      />
      <TextField
        label="Number of products ready"
        value={form.productsReady}
        type="number"
        placeholder="24"
        onChange={(event) => updateField("productsReady", event.target.value)}
      />
      <TextField
        label="Instagram / website link"
        value={form.instagramOrWebsite}
        placeholder="@brand or https://brand.example"
        onChange={(event) =>
          updateField("instagramOrWebsite", event.target.value)
        }
        className="sm:col-span-2"
      />
      <TextareaField
        label="Brand description"
        value={form.brandDescription}
        placeholder="Brand direction, categories, and sourcing clarity."
        onChange={(event) => updateField("brandDescription", event.target.value)}
        className="sm:col-span-2"
      />
    </div>
  );
}

function VerificationStep({
  form,
  updateField,
}: {
  form: SellerApplicationDraft;
  updateField: <Field extends keyof SellerApplicationDraft>(
    field: Field,
    value: SellerApplicationDraft[Field],
  ) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <UploadPlaceholder
          title="GST / business document"
          description="Secure upload comes later if needed."
        />
        <UploadPlaceholder
          title="Brand authorization"
          description="Authorization proof may be requested later."
        />
      </div>

      <label className="flex min-w-0 items-start gap-3 rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4">
        <input
          type="checkbox"
          checked={form.authenticityDeclaration}
          onChange={(event) =>
            updateField("authenticityDeclaration", event.target.checked)
          }
          className="mt-1 h-4 w-4 accent-[var(--skxnz-maroon)]"
        />
        <span className="text-sm leading-6 text-stone">
          I confirm this information is accurate for internal SKXNZ review.
        </span>
      </label>

      <label className="flex min-w-0 items-start gap-3 rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4">
        <input
          type="checkbox"
          checked={form.termsAgreement}
          onChange={(event) => updateField("termsAgreement", event.target.checked)}
          className="mt-1 h-4 w-4 accent-[var(--skxnz-maroon)]"
        />
        <span className="text-sm leading-6 text-stone">
          I understand this beta submission does not create approval, live listings,
          payouts, or a live seller account.
        </span>
      </label>
    </div>
  );
}

function ReviewStep({ summaryRows }: { summaryRows: string[][] }) {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-5 text-sm leading-7 text-midnightbrown">
        Review before submitting. This creates a browser-local demo submission.
      </div>
      <div className="grid gap-3">
        {summaryRows.map(([label, value]) => (
          <div
            key={label}
            className="grid min-w-0 gap-2 rounded-[22px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4 sm:grid-cols-[13rem_minmax(0,1fr)]"
          >
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-stone">
              {label}
            </p>
            <p className="min-w-0 break-words text-sm font-bold text-midnightbrown">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-w-0 rounded-[28px] border border-dashed border-[rgba(58,8,24,0.22)] bg-[var(--skxnz-bg-soft)] p-5">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-midnightbrown">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-stone">{description}</p>
      <button
        type="button"
        disabled
        className={buttonVariants({
          variant: "secondary",
          size: "sm",
          className: "mt-4 cursor-not-allowed opacity-70",
        })}
      >
        Upload Later
      </button>
    </div>
  );
}

function TextField({
  label,
  value,
  placeholder,
  type = "text",
  className,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  className?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-stone">
        {label}
      </span>
      <input
        value={value}
        type={type}
        min={type === "number" ? 1 : undefined}
        step={type === "number" ? 1 : undefined}
        onChange={onChange}
        placeholder={placeholder}
        className={fieldClassName}
      />
    </label>
  );
}

function SelectField<Option extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: Option;
  options: readonly Option[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-stone">
        {label}
      </span>
      <select value={value} onChange={onChange} className={fieldClassName}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  value,
  placeholder,
  className,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  className?: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-stone">
        {label}
      </span>
      <textarea
        value={value}
        rows={5}
        onChange={onChange}
        placeholder={placeholder}
        className={textareaClassName}
      />
    </label>
  );
}
