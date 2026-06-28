"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  initialSellerProductUploadDraft,
  mapSellerDraftToProductSubmission,
  sellerProductCategories,
  validateSellerProductDraft,
  type SellerProductUploadDraft,
} from "@/lib/data/seller-products";
import { cn } from "@/lib/cn";

const fieldClassName =
  "mt-2 w-full min-w-0 rounded-[20px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-3 text-sm text-midnightbrown outline-none transition placeholder:text-stone focus:border-[rgba(34,211,238,0.34)] focus:ring-4 focus:ring-[rgba(34,211,238,0.08)]";

export function SellerProductUploadDemo() {
  const { submitProduct } = useMarketplace();
  const [form, setForm] = useState<SellerProductUploadDraft>(
    initialSellerProductUploadDraft,
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  function updateField<Field extends keyof SellerProductUploadDraft>(
    field: Field,
    value: SellerProductUploadDraft[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors([]);
    setSuccessMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateSellerProductDraft(form);

    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }

    const product = submitProduct(mapSellerDraftToProductSubmission(form));
    setSuccessMessage(
      `${product.name} submitted as Pending internal review. Public publishing is not live.`,
    );
    setForm(initialSellerProductUploadDraft);
    setErrors([]);
  }

  return (
    <Card className="rounded-[34px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5 shadow-[0_18px_55px_rgba(58,8,24,0.07)] sm:p-7">
      <Badge>Product upload foundation</Badge>
      <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.08em] text-midnightbrown">
        Add demo product
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-stone">
        This creates a browser-local seller product record for internal review only.
        It does not publish a live product, enable payouts, or bypass admin review.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Product name"
            value={form.productName}
            placeholder="Chrome Utility Hoodie"
            onChange={(event) => updateField("productName", event.target.value)}
          />
          <TextField
            label="Brand name"
            value={form.brandName}
            placeholder="Noir Signal"
            onChange={(event) => updateField("brandName", event.target.value)}
          />
          <SelectField
            label="Category"
            value={form.category}
            options={sellerProductCategories}
            onChange={(event) => updateField("category", event.target.value)}
          />
          <TextField
            label="Subcategory"
            value={form.subcategory}
            placeholder="Hoodies, oversized, outerwear"
            onChange={(event) => updateField("subcategory", event.target.value)}
          />
          <TextField
            label="Price"
            type="number"
            value={form.price}
            placeholder="3499"
            onChange={(event) => updateField("price", event.target.value)}
          />
          <TextField
            label="Compare-at price"
            type="number"
            value={form.compareAtPrice}
            placeholder="4299"
            onChange={(event) =>
              updateField("compareAtPrice", event.target.value)
            }
          />
          <TextField
            label="Size options"
            value={form.sizeOptions}
            placeholder="S, M, L, XL"
            onChange={(event) => updateField("sizeOptions", event.target.value)}
          />
          <TextField
            label="Color options"
            value={form.colorOptions}
            placeholder="Black, Silver"
            onChange={(event) => updateField("colorOptions", event.target.value)}
          />
          <TextField
            label="Inventory count"
            type="number"
            value={form.inventoryCount}
            placeholder="12"
            onChange={(event) => updateField("inventoryCount", event.target.value)}
          />
          <TextField
            label="Images placeholder"
            value={form.imageUrl}
            placeholder="/assets/ui/placeholders/product-fallback.svg"
            onChange={(event) => updateField("imageUrl", event.target.value)}
          />
          <TextField
            label="Tags"
            value={form.tags}
            placeholder="streetwear, relaxed, chrome"
            onChange={(event) => updateField("tags", event.target.value)}
            className="sm:col-span-2"
          />
          <label className="min-w-0 sm:col-span-2">
            <span className="text-[0.66rem] font-black uppercase tracking-[0.18em] text-stone">
              Description
            </span>
            <textarea
              value={form.description}
              rows={4}
              placeholder="Describe the product for SKXNZ internal review. Avoid unsupported material or authenticity claims."
              onChange={(event) => updateField("description", event.target.value)}
              className={cn(fieldClassName, "resize-none leading-7")}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ToggleField
            label="Limited edition"
            checked={form.isLimitedEdition}
            onChange={(event) =>
              updateField("isLimitedEdition", event.target.checked)
            }
          />
          <ToggleField
            label="New season"
            checked={form.isNewSeason}
            onChange={(event) => updateField("isNewSeason", event.target.checked)}
          />
          <ToggleField
            label="AI styled"
            checked={form.isAIStyled}
            onChange={(event) => updateField("isAIStyled", event.target.checked)}
          />
        </div>

        {errors.length > 0 ? (
          <div className="rounded-[24px] border border-[rgba(217,70,239,0.24)] bg-[rgba(217,70,239,0.06)] p-4 text-sm leading-6 text-midnightbrown">
            <p className="font-black uppercase tracking-[0.14em]">Fix before submit</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-[24px] border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.07)] p-4 text-sm font-bold leading-6 text-sangria">
            {successMessage}
          </div>
        ) : null}

        <div className="rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4 text-sm leading-6 text-stone">
          Product upload beta. Real public publishing, seller verification, seller
          payouts, and production database writes are not connected yet.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            Submit for Review
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(initialSellerProductUploadDraft);
              setErrors([]);
              setSuccessMessage("");
            }}
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            Reset Form
          </button>
        </div>
      </form>
    </Card>
  );
}

function TextField({
  label,
  className,
  ...props
}: {
  label: string;
  className?: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className={cn("min-w-0", className)}>
      <span className="text-[0.66rem] font-black uppercase tracking-[0.18em] text-stone">
        {label}
      </span>
      <input {...props} className={fieldClassName} />
    </label>
  );
}

function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="text-[0.66rem] font-black uppercase tracking-[0.18em] text-stone">
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

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex min-w-0 items-center justify-between gap-3 rounded-[22px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4 text-sm font-bold text-midnightbrown">
      <span className="line-clamp-1">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-[var(--skxnz-maroon)]"
      />
    </label>
  );
}
