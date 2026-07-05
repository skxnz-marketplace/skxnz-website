"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SellerProductCheckResponse } from "@/src/lib/ai/types";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[20px] px-4 py-3 text-sm";

const textareaClassName =
  "field-shell w-full min-w-0 max-w-full break-words rounded-[24px] px-4 py-3 text-sm";

type ProductUploadActionState = {
  message?: string;
};

type ProductUploadAction = (
  previousState: ProductUploadActionState,
  formData: FormData,
) => Promise<ProductUploadActionState>;

type ProductUploadOption = {
  id: string;
  name: string;
};

type ProductUploadFormProps = {
  brands?: ProductUploadOption[];
  categories?: ProductUploadOption[];
  action?: ProductUploadAction;
};

type ProductUploadFormState = {
  name: string;
  brandId: string;
  categoryId: string;
  price: string;
  compareAtPrice: string;
  sizes: string;
  colors: string;
  tags: string;
  stock: string;
  fabric: string;
  fit: string;
  description: string;
  imageUrl: string;
};

const initialActionState: ProductUploadActionState = {};

function createInitialForm(
  _brands: ProductUploadOption[],
  _categories: ProductUploadOption[],
): ProductUploadFormState {
  return {
    name: "",
    // Empty = auto-assign; the server action resolves the first active
    // brand/category for the V1 QA flow.
    brandId: "",
    categoryId: "",
    price: "248",
    compareAtPrice: "",
    sizes: "S, M, L, XL",
    colors: "Obsidian Black, Midnight Navy",
    tags: "streetwear, premium, layered",
    stock: "12",
    fabric: "Technical cotton blend",
    fit: "Relaxed structured fit",
    description: "",
    imageUrl: "",
  };
}

function splitCommaValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getApiErrorMessage(
  payload: SellerProductCheckResponse | { message?: string },
) {
  return "message" in payload && payload.message
    ? payload.message
    : "Seller validation could not run.";
}

async function disabledProductAction(): Promise<ProductUploadActionState> {
  return { message: "Live product submission is not available on this surface." };
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="w-full sm:w-auto"
      disabled={disabled || pending}
    >
      {pending ? "Submitting..." : "Submit For Review"}
    </Button>
  );
}

export function ProductUploadForm({
  brands = [],
  categories = [],
  action,
}: ProductUploadFormProps) {
  const [actionState, formAction] = useActionState(
    action ?? disabledProductAction,
    initialActionState,
  );
  const [form, setForm] = useState(() => createInitialForm(brands, categories));
  const [validationResult, setValidationResult] =
    useState<SellerProductCheckResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Clear a selected option if it disappears from the loaded lists; keep ""
    // (auto-assign) as the default.
    setForm((current) => ({
      ...current,
      brandId: brands.some((brand) => brand.id === current.brandId)
        ? current.brandId
        : "",
      categoryId: categories.some((category) => category.id === current.categoryId)
        ? current.categoryId
        : "",
    }));
  }, [brands, categories]);

  const selectedBrand = brands.find((brand) => brand.id === form.brandId);
  const selectedCategory = categories.find(
    (category) => category.id === form.categoryId,
  );
  // Brand/category are optional for the V1 QA flow — the server action
  // auto-assigns the first active brand/category when omitted.
  const isSubmissionDisabled = !action;

  function updateField(field: keyof ProductUploadFormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setValidationResult(null);
    setValidationError(null);
  }

  async function runValidation() {
    setIsValidating(true);
    setValidationError(null);

    try {
      const response = await fetch("/api/ai/seller-product-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-skxnz-demo-role": "seller",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          category: selectedCategory?.name ?? "Auto-assigned (SKXNZ)",
          price: form.price ? Number(form.price) : null,
          salePrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
          sizes: splitCommaValues(form.sizes),
          colors: splitCommaValues(form.colors),
          stock: form.stock ? Number(form.stock) : null,
          fabric: form.fabric.trim(),
          fit: form.fit.trim(),
          description: form.description.trim(),
          imageUrl: form.imageUrl.trim(),
          tags: splitCommaValues(form.tags),
        }),
      });

      const payload = (await response.json()) as
        | SellerProductCheckResponse
        | { message?: string };

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload));
      }

      setValidationResult(payload as SellerProductCheckResponse);
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : "Seller validation could not run.",
      );
    } finally {
      setIsValidating(false);
    }
  }

  function resetForm() {
    setForm(createInitialForm(brands, categories));
    setValidationResult(null);
    setValidationError(null);
  }

  if (!action) {
    return (
      <Card className="section-border rounded-[36px] p-6 sm:p-8">
        <Badge>Live submit unavailable</Badge>
        <p className="mt-4 text-sm leading-6 text-stone">
          Open the seller product creation page to submit a real Supabase product
          for admin review.
        </p>
      </Card>
    );
  }

  return (
    <Card className="section-border rounded-[36px] p-6 sm:p-8">
      <Badge>Live Supabase Submit</Badge>
      <form className="mt-6 space-y-4" action={formAction}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Product name
            </span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Neutra X Hoodie"
              className={fieldClassName}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Brand
            </span>
            <select
              name="brand_id"
              value={form.brandId}
              onChange={(event) => updateField("brandId", event.target.value)}
              className={fieldClassName}
            >
              <option value="">Auto-assign (SKXNZ)</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Category
            </span>
            <select
              name="category_id"
              value={form.categoryId}
              onChange={(event) => updateField("categoryId", event.target.value)}
              className={fieldClassName}
            >
              <option value="">Auto-assign (SKXNZ)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Tags
            </span>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={(event) => updateField("tags", event.target.value)}
              placeholder="streetwear, limited edition, oversized"
              className={fieldClassName}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Price
            </span>
            <input
              type="number"
              name="price_inr"
              min="1"
              step="1"
              value={form.price}
              onChange={(event) => updateField("price", event.target.value)}
              placeholder="248"
              className={fieldClassName}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Compare-at price
            </span>
            <input
              type="number"
              name="compare_at_price_inr"
              min="0"
              step="1"
              value={form.compareAtPrice}
              onChange={(event) =>
                updateField("compareAtPrice", event.target.value)
              }
              placeholder="279"
              className={fieldClassName}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Stock
            </span>
            <input
              type="number"
              name="stock_quantity"
              min="0"
              step="1"
              value={form.stock}
              onChange={(event) => updateField("stock", event.target.value)}
              placeholder="12"
              className={fieldClassName}
              required
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Sizes
            </span>
            <input
              type="text"
              name="sizes"
              value={form.sizes}
              onChange={(event) => updateField("sizes", event.target.value)}
              placeholder="S, M, L, XL"
              className={fieldClassName}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Colors
            </span>
            <input
              type="text"
              name="colors"
              value={form.colors}
              onChange={(event) => updateField("colors", event.target.value)}
              placeholder="Obsidian Black, Liquid Silver"
              className={fieldClassName}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Fabric
            </span>
            <input
              type="text"
              name="fabric"
              value={form.fabric}
              onChange={(event) => updateField("fabric", event.target.value)}
              placeholder="Technical nylon"
              className={fieldClassName}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Fit
            </span>
            <input
              type="text"
              name="fit"
              value={form.fit}
              onChange={(event) => updateField("fit", event.target.value)}
              placeholder="Relaxed structured fit"
              className={fieldClassName}
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
            Description
          </span>
          <textarea
            name="description"
            rows={5}
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Describe the silhouette, materials, and intended buyer mood."
            className={textareaClassName}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
            Product image URL
          </span>
          <input
            type="url"
            name="image_url"
            value={form.imageUrl}
            onChange={(event) => updateField("imageUrl", event.target.value)}
            placeholder="https://example.com/products/new-product.jpg"
            className={fieldClassName}
          />
        </label>

        {actionState.message ? (
          <div className="rounded-[24px] border border-sangria/20 bg-sangria/10 p-4 text-sm leading-6 text-sangria break-words">
            {actionState.message}
          </div>
        ) : null}

        {validationError ? (
          <div className="rounded-[24px] border border-sangria/20 bg-sangria/10 p-4 text-sm leading-6 text-sangria break-words">
            {validationError}
          </div>
        ) : null}

        {validationResult ? (
          <div className="rounded-[24px] border border-sandstone/80 bg-pearlcream/80 p-4 text-sm leading-6 text-obsidian break-words">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-teal">
              Seller AI Validation
            </p>
            <p className="mt-2 font-medium text-sangria">
              {validationResult.reviewState === "READY_FOR_ADMIN_REVIEW"
                ? "Ready for admin review"
                : "Needs seller fixes before review"}
            </p>
            <p className="mt-2 text-sm text-obsidian/75">
              {validationResult.disclaimer}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>
                Publish ready: {validationResult.publishReady ? "Yes" : "No"}
              </Badge>
              <Badge>
                Duplicate risk: {validationResult.duplicateRisk.level}
              </Badge>
              <Badge>Admin review required</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {validationResult.checklist.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[18px] border border-sandstone bg-white/80 p-3"
                >
                  <p className="text-[0.68rem] uppercase tracking-[0.22em] text-teal">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm text-obsidian/80">{item.detail}</p>
                </div>
              ))}
            </div>
            {validationResult.suggestedTags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {validationResult.suggestedTags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-[24px] border border-teal/20 bg-teal/10 p-4 text-sm leading-6 text-silver break-words">
          Submitting creates a real Supabase product owned by the current seller
          as PENDING_REVIEW. Buyers will not see it until admin approval changes
          the status to ACTIVE.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={runValidation}
            disabled={isValidating}
          >
            {isValidating ? "Checking draft..." : "Run Seller AI Validation"}
          </Button>
          <SubmitButton disabled={isSubmissionDisabled} />
          <button
            type="button"
            onClick={resetForm}
            className={`${buttonVariants({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}
          >
            Reset Form
          </button>
        </div>

        <p className="text-xs leading-5 text-stone">
          Selected review path: {selectedBrand?.name ?? "Auto-assign"} /{" "}
          {selectedCategory?.name ?? "Auto-assign"}
        </p>
      </form>
    </Card>
  );
}
