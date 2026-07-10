"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { StatusBadge } from "@/components/sections/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatProductPrice, type Product } from "@/lib/data/products";

type ProductPurchasePanelProps = {
  product: Product;
};

const accentSwatches = [
  { terms: ["ma" + "genta"], value: "#D946EF" },
  { terms: ["cy" + "an"], value: "#22D3EE" },
  { terms: ["pur" + "ple", "vio" + "let"], value: "#8B5CF6" },
];

function resolveSwatchColor(color: string) {
  const normalizedColor = color.toLowerCase();

  if (normalizedColor.includes("black") || normalizedColor.includes("obsidian")) {
    return "#100006";
  }

  if (normalizedColor.includes("navy") || normalizedColor.includes("midnight")) {
    return "#1A030B";
  }

  if (normalizedColor.includes("silver") || normalizedColor.includes("chrome")) {
    return "#C7C3BB";
  }

  if (normalizedColor.includes("pearl") || normalizedColor.includes("white")) {
    return "#FFFEFA";
  }

  for (const swatch of accentSwatches) {
    if (swatch.terms.some((term) => normalizedColor.includes(term))) {
      return swatch.value;
    }
  }

  return "#FFFDF7";
}

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const { addToCart, isInWishlist, toggleWishlist } = useMarketplace();
  const requiresSizeChoice = product.sizes.length > 1;
  const [selectedSize, setSelectedSize] = useState<string | null>(
    requiresSizeChoice ? null : product.sizes[0] ?? "One Size",
  );
  const [selectedColor, setSelectedColor] = useState(product.colors[0] ?? "Pearl Cream");
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  const displayPrice = product.salePrice ?? product.price;
  const isLiveProduct = product.dataSource === "live";
  const isApproved = product.status === "Approved Preview" || isLiveProduct;
  const savedInWishlist = isInWishlist(product.id);
  // Live products only carry real stock when variant rows exist behind them.
  const isVariantBacked = isLiveProduct && (product.variants?.length ?? 0) > 0;
  const hasRealStockData = !isLiveProduct || (product.variantCount ?? 0) > 0;

  // Resolve the real variant row for the current size/color selection so the
  // cart can carry a product_variants.id and the server can validate stock.
  const selectedVariant = useMemo(() => {
    if (!isVariantBacked || !selectedSize) return undefined;
    const options = product.variants ?? [];
    const size = selectedSize ?? "";
    const color = selectedColor ?? "";
    return (
      options.find(
        (option) => (option.size ?? "") === size && (option.color ?? "") === color,
      ) ??
      options.find((option) => (option.size ?? "") === size && !option.color) ??
      options.find((option) => (option.color ?? "") === color && !option.size)
    );
  }, [isVariantBacked, product.variants, selectedSize, selectedColor]);

  // Available stock for the current selection: the resolved variant's stock
  // when variant-backed, else the product-level summed stock.
  const availableStock = isVariantBacked
    ? selectedVariant?.stock ?? 0
    : product.stock;
  // For variant-backed products a selection with no resolvable/active variant
  // is treated as unavailable.
  const selectionUnavailable =
    isVariantBacked && Boolean(selectedSize) && (!selectedVariant || !selectedVariant.isActive);
  const isOutOfStock = hasRealStockData && (availableStock <= 0 || selectionUnavailable);

  const stockLabel = useMemo(() => {
    if (!hasRealStockData) {
      return "Stock data being connected";
    }
    if (selectionUnavailable) {
      return "Selected option unavailable";
    }
    if (availableStock <= 0) {
      return "Currently unavailable";
    }
    if (availableStock <= 5) {
      return "Low stock";
    }
    return "In stock";
  }, [hasRealStockData, isLiveProduct, availableStock, selectionUnavailable]);

  function handleAddToCart() {
    if (!selectedSize) {
      setFeedback({ ok: false, message: "Select a size to add this piece to your cart." });
      return;
    }
    if (isVariantBacked && (!selectedVariant || !selectedVariant.isActive)) {
      setFeedback({
        ok: false,
        message: "That size or option is no longer available. Pick another.",
      });
      return;
    }

    const result = addToCart({
      productId: product.id,
      size: selectedSize,
      color: selectedColor,
      quantity,
      variantId: selectedVariant?.id ?? null,
      product,
    });

    setFeedback(result);
  }

  return (
    <Card className="sticky top-24 rounded-[32px] border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] p-5 shadow-[0_22px_54px_rgba(58,8,24,0.10)] sm:p-6 lg:p-7">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            href={`/brands/${product.brandSlug}`}
            className="line-clamp-1 min-w-0 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[var(--skxnz-maroon)] transition hover:text-[var(--skxnz-wine)]"
          >
            {product.brandName}
          </Link>
          <StatusBadge label={product.status} />
        </div>

        <h1 className="mt-4 line-clamp-3 min-w-0 break-words text-[2rem] font-semibold uppercase leading-[0.95] tracking-[-0.035em] text-[var(--skxnz-text-dark)] sm:text-[2.55rem] lg:text-[3rem]">
          {product.name}
        </h1>

        <p className="mt-4 line-clamp-3 break-words text-sm leading-6 text-[var(--skxnz-text-muted)] sm:text-base">
          {product.shortDescription}
        </p>

        <div className="mt-5 flex min-w-0 flex-wrap items-end gap-3">
          <p className="product-price text-2xl font-bold leading-none text-[var(--skxnz-maroon-deep)] sm:text-3xl">
            {formatProductPrice(displayPrice)}
          </p>
          {product.salePrice ? (
            <p className="text-sm font-semibold text-[var(--skxnz-text-muted)] line-through">
              {formatProductPrice(product.price)}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge>{product.category}</Badge>
          <Badge>{product.subcategory ?? product.fit}</Badge>
          <Badge>{product.fabric}</Badge>
        </div>
      </div>

      <div className="mt-7 rounded-[26px] border border-[var(--skxnz-border)] bg-[var(--skxnz-card)] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[var(--skxnz-text-muted)]">
              Stock
            </p>
            <p className="mt-1 line-clamp-1 text-sm font-bold text-[var(--skxnz-text-dark)]">
              {stockLabel}
            </p>
          </div>
          {hasRealStockData ? (
            <span className="shrink-0 rounded-full border border-[rgba(47,111,115,0.22)] bg-[rgba(34,211,238,0.08)] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[var(--skxnz-maroon)]">
              {product.stock} units
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-7 space-y-6">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-[var(--skxnz-text-muted)]">
              Size
            </p>
            <span className="text-xs font-semibold text-[var(--skxnz-text-muted)]">
              {selectedSize ?? "Select a size"}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const isSelected = size === selectedSize;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={
                    isSelected
                      ? "min-w-11 rounded-full border border-[var(--skxnz-maroon)] bg-[var(--skxnz-maroon-deep)] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--skxnz-text-light)] shadow-[0_0_0_4px_rgba(34,211,238,0.07)]"
                      : "min-w-11 rounded-full border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--skxnz-text-dark)] transition hover:border-[rgba(34,211,238,0.45)]"
                  }
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-[var(--skxnz-text-muted)]">
              Color
            </p>
            <span className="text-xs font-semibold text-[var(--skxnz-text-muted)]">
              {selectedColor}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.colors.map((color) => {
              const isSelected = color === selectedColor;

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={
                    isSelected
                      ? "inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--skxnz-maroon)] bg-[var(--skxnz-maroon-deep)] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--skxnz-text-light)] shadow-[0_0_0_4px_rgba(139,92,246,0.08)]"
                      : "inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--skxnz-text-dark)] transition hover:border-[rgba(139,92,246,0.34)]"
                  }
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-[rgba(58,8,24,0.18)]"
                    style={{ backgroundColor: resolveSwatchColor(color) }}
                  />
                  <span className="line-clamp-1 break-words">{color}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-[var(--skxnz-text-muted)]">
            Quantity
          </p>
          <div className="mt-3 inline-flex items-center overflow-hidden rounded-full border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)]">
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              className="h-11 w-12 text-lg font-semibold text-[var(--skxnz-maroon)] transition hover:bg-[var(--skxnz-bg-soft)]"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="min-w-10 text-center text-sm font-bold text-[var(--skxnz-text-dark)]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.min(9, current + 1))}
              className="h-11 w-12 text-lg font-semibold text-[var(--skxnz-maroon)] transition hover:bg-[var(--skxnz-bg-soft)]"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Button
          type="button"
          size="lg"
          onClick={handleAddToCart}
          disabled={!isApproved || isOutOfStock || !selectedSize}
          className="w-full"
        >
          {isOutOfStock
            ? "Currently Unavailable"
            : !selectedSize
              ? "Select A Size"
              : "Add To Cart"}
        </Button>
        <button
          type="button"
          onClick={() => toggleWishlist(product.id, product)}
          className={`${buttonVariants({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}
        >
          {savedInWishlist ? "Saved" : "Save"}
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Link
          href="/cart"
          className={`${buttonVariants({ variant: "ghost", size: "md" })} w-full`}
        >
          View Cart
        </Link>
        <Link
          href="/ai-stylist"
          className={`${buttonVariants({ variant: "ghost", size: "md" })} w-full`}
        >
          Ask SKXNZ AI
        </Link>
      </div>

      {feedback ? (
        <div
          role="status"
          className={
            feedback.ok
              ? "mt-4 rounded-[22px] border border-[rgba(34,211,238,0.28)] bg-[rgba(34,211,238,0.08)] p-4 text-sm leading-6 text-[var(--skxnz-text-dark)]"
              : "mt-4 rounded-[22px] border border-[rgba(217,70,239,0.24)] bg-[rgba(217,70,239,0.06)] p-4 text-sm leading-6 text-[var(--skxnz-text-dark)]"
          }
        >
          {feedback.ok ? (
            <span className="mr-2 text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[var(--skxnz-maroon)]">
              Added to cart
            </span>
          ) : null}
          {feedback.message}
        </div>
      ) : null}

      {!isApproved ? (
        <div className="mt-4 rounded-[22px] border border-[var(--skxnz-border)] bg-[var(--skxnz-card)] p-4 text-sm leading-6 text-[var(--skxnz-text-muted)]">
          Only approved products can move into the buyer cart. This product is still in
          review or draft mode.
        </div>
      ) : null}

      {isLiveProduct ? (
        <div className="mt-4 rounded-[22px] border border-[var(--skxnz-border)] bg-[var(--skxnz-card)] p-4 text-sm leading-6 text-[var(--skxnz-text-muted)]">
          This active catalog product can be added to your cart on this device.
          Live payment and delivery are still being connected.
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        <div className="rounded-[22px] border border-[var(--skxnz-border)] bg-[var(--skxnz-card)] p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[var(--skxnz-text-muted)]">
            Delivery
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--skxnz-text-muted)]">
            {product.deliveryWindow}. Delivery tracking is not live yet.
          </p>
        </div>
        <div className="rounded-[22px] border border-[var(--skxnz-border)] bg-[var(--skxnz-card)] p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[var(--skxnz-text-muted)]">
            Returns
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--skxnz-text-muted)]">
            Return approval and pickup are preview-only until policy and operations are connected.
          </p>
        </div>
      </div>

      <p className="mt-5 rounded-[22px] border border-[var(--skxnz-border)] bg-[var(--skxnz-bg-soft)] p-4 text-sm leading-6 text-[var(--skxnz-text-muted)]">
        {isLiveProduct
          ? "This product is loaded from the active catalog. Live payment, delivery, and refund processing are not connected yet."
          : "Live payment, delivery, and refund processing are not connected yet."}
      </p>
    </Card>
  );
}
