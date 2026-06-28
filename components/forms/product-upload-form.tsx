"use client";

import { useState, type FormEvent } from "react";

import { useDemoRole } from "@/components/auth/demo-role-provider";
import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { categories } from "@/lib/data/products";
import type { SellerProductCheckResponse } from "@/src/lib/ai/types";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[20px] px-4 py-3 text-sm";

const textareaClassName =
  "field-shell w-full min-w-0 max-w-full break-words rounded-[24px] px-4 py-3 text-sm";

const initialForm = {
  name: "",
  category: "Outerwear",
  price: "248",
  salePrice: "",
  sizes: "S, M, L, XL",
  colors: "Obsidian Black, Midnight Navy",
  tags: "streetwear, premium, layered",
  stock: "12",
  fabric: "Technical cotton blend",
  fit: "Relaxed structured fit",
  description: "",
  imageUrl: "https://placeholder.skxnz.local/products/new-product.jpg",
};

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

export function ProductUploadForm() {
  const { submitProduct } = useMarketplace();
  const { role } = useDemoRole();
  const [form, setForm] = useState(initialForm);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationResult, setValidationResult] =
    useState<SellerProductCheckResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  function updateField(field: keyof typeof initialForm, value: string) {
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
          "x-skxnz-demo-role": role ?? "seller",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category.trim(),
          price: form.price ? Number(form.price) : null,
          salePrice: form.salePrice ? Number(form.salePrice) : null,
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextProduct = submitProduct({
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      sizes: splitCommaValues(form.sizes),
      colors: splitCommaValues(form.colors),
      stock: Number(form.stock),
      fabric: form.fabric.trim(),
      fit: form.fit.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      tags: splitCommaValues(form.tags),
    });

    setSuccessMessage(
      `Product submitted for SKXNZ admin review. ${nextProduct.name} now appears as Pending Review in browser-local MVP state.`,
    );
    setForm(initialForm);
    setValidationResult(null);
  }

  return (
    <Card className="section-border rounded-[36px] p-6 sm:p-8">
      <Badge>MVP Placeholder</Badge>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Product name
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Neutra X Hoodie"
              className={fieldClassName}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Category
            </span>
            <input
              list="skxnz-category-options"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
              placeholder="Outerwear"
              className={fieldClassName}
              required
            />
            <datalist id="skxnz-category-options">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
            Tags
          </span>
          <input
            type="text"
            value={form.tags}
            onChange={(event) => updateField("tags", event.target.value)}
            placeholder="streetwear, limited edition, oversized"
            className={fieldClassName}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Price
            </span>
            <input
              type="number"
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
              Sale price
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.salePrice}
              onChange={(event) => updateField("salePrice", event.target.value)}
              placeholder="219"
              className={fieldClassName}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Stock
            </span>
            <input
              type="number"
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
              value={form.sizes}
              onChange={(event) => updateField("sizes", event.target.value)}
              placeholder="S, M, L, XL"
              className={fieldClassName}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Colors
            </span>
            <input
              type="text"
              value={form.colors}
              onChange={(event) => updateField("colors", event.target.value)}
              placeholder="Obsidian Black, Liquid Silver"
              className={fieldClassName}
              required
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
              value={form.fabric}
              onChange={(event) => updateField("fabric", event.target.value)}
              placeholder="Technical nylon"
              className={fieldClassName}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Fit
            </span>
            <input
              type="text"
              value={form.fit}
              onChange={(event) => updateField("fit", event.target.value)}
              placeholder="Relaxed structured fit"
              className={fieldClassName}
              required
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
            Description
          </span>
          <textarea
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
            Product image URL placeholder
          </span>
          <input
            type="url"
            value={form.imageUrl}
            onChange={(event) => updateField("imageUrl", event.target.value)}
            placeholder="https://placeholder.skxnz.local/products/new-product.jpg"
            className={fieldClassName}
            required
          />
        </label>

        {successMessage ? (
          <div className="rounded-[24px] border border-teal/20 bg-teal/10 p-4 text-sm leading-6 text-pearl break-words">
            {successMessage}
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

        <div className="rounded-[24px] border border-sangria/20 bg-sangria/10 p-4 text-sm leading-6 text-silver break-words">
          This form writes only to browser-local MVP state. Media upload, real database
          writes, and background processing are not live yet.
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
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            Submit For Review
          </Button>
          <button
            type="button"
            onClick={() => setForm(initialForm)}
            className={`${buttonVariants({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}
          >
            Reset Form
          </button>
        </div>
      </form>
    </Card>
  );
}
