"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { ProductPurchasePanel } from "@/components/buyer/product-purchase-panel";
import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { ProductCard } from "@/components/sections/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SafeImage } from "@/components/shared/safe-image";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type Product } from "@/lib/data/products";
import { skxnzFallbackAssets } from "@/src/lib/assets";

type ProductDetailShellProps = {
  productId: string;
  seedProduct: Product | null;
};

function getSimilarProducts(product: Product, products: Product[]) {
  const productTags = new Set(
    [...product.tags, ...product.collections, product.category, product.subcategory].map((tag) =>
      tag.toLowerCase(),
    ),
  );

  return products
    .filter((item) => item.id !== product.id)
    .map((item) => {
      const signals = [
        item.category,
        item.subcategory,
        ...item.tags,
        ...item.collections,
      ].map((signal) => signal.toLowerCase());
      const score = signals.reduce(
        (total, signal) => total + (productTags.has(signal) ? 1 : 0),
        item.category === product.category ? 3 : 0,
      );

      return { product: item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((entry) => entry.product);
}

function ProductAccordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group rounded-[24px] border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] p-5 shadow-[0_12px_30px_rgba(58,8,24,0.05)]"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 marker:hidden">
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[var(--skxnz-text-dark)]">
          {title}
        </span>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--skxnz-border)] text-[var(--skxnz-maroon)] transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="mt-4 text-sm leading-7 text-[var(--skxnz-text-muted)]">
        {children}
      </div>
    </details>
  );
}

export function ProductDetailShell({
  productId,
  seedProduct,
}: ProductDetailShellProps) {
  const { getProductById, approvedProducts, isHydrated } = useMarketplace();
  const product =
    seedProduct?.dataSource === "live" ? seedProduct : getProductById(productId) ?? seedProduct;
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!product) {
      setActiveImage(null);
      return;
    }

    setActiveImage(product.gallery[0] ?? product.image);
  }, [product]);

  if (!product && !isHydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="rounded-[36px] border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] p-8 text-center">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
            Product Route
          </p>
          <h1 className="mt-4 break-words text-[1.6rem] font-semibold leading-tight text-[var(--skxnz-text-dark)] sm:text-3xl">
            Loading product.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl break-words text-sm leading-7 text-[var(--skxnz-text-muted)]">
            One moment while SKXNZ loads this product.
          </p>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <EmptyState
          title="Product not found."
          description="This product is not available. It may have been removed or is no longer in the catalog."
          actionHref="/shop"
          actionLabel="Back To Shop"
        />
      </div>
    );
  }

  const galleryImages = product.gallery.length ? product.gallery : [product.image];
  const activeGalleryImage = activeImage ?? galleryImages[0];
  const similarProducts = getSimilarProducts(product, approvedProducts).length
    ? getSimilarProducts(product, approvedProducts)
    : approvedProducts.filter((item) => item.id !== product.id).slice(0, 3);

  function showGalleryImage(offset: number) {
    const currentIndex = Math.max(galleryImages.indexOf(activeGalleryImage), 0);
    const nextIndex =
      (currentIndex + offset + galleryImages.length) % galleryImages.length;

    setActiveImage(galleryImages[nextIndex]);
  }

  return (
    <div className="bg-[var(--skxnz-bg)] text-[var(--skxnz-text-dark)]">
      <section className="border-b border-[var(--skxnz-border)] bg-[linear-gradient(180deg,var(--skxnz-bg-soft),var(--skxnz-bg))]">
        <div className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.78fr)]">
            <div className="min-w-0 space-y-4">
              <Card className="overflow-hidden rounded-[34px] border-[var(--skxnz-border)] bg-[var(--skxnz-card)] p-2 shadow-[0_24px_70px_rgba(58,8,24,0.10)]">
                <div className="relative min-h-[420px] overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,var(--skxnz-surface),var(--skxnz-bg-soft))] sm:min-h-[580px] xl:min-h-[680px]">
                  <SafeImage
                    src={activeGalleryImage}
                    fallbackSrc={skxnzFallbackAssets.product}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 1280px) 100vw, 58vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2 sm:left-6 sm:top-6">
                    <span className="inline-flex rounded-full border border-white/20 bg-[rgba(16,0,6,0.72)] px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--skxnz-text-light)] backdrop-blur">
                      {product.category}
                    </span>
                    {product.collections.slice(0, 1).map((collection) => (
                      <span
                        key={collection}
                        className="inline-flex rounded-full border border-white/20 bg-[rgba(58,8,24,0.70)] px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--skxnz-text-light)] backdrop-blur"
                      >
                        {collection}
                      </span>
                    ))}
                  </div>
                  {galleryImages.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => showGalleryImage(-1)}
                        className="absolute left-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(16,0,6,0.62)] text-[var(--skxnz-text-light)] shadow-[0_10px_24px_rgba(16,0,6,0.24)] ring-1 ring-white/15 backdrop-blur transition hover:bg-[rgba(58,8,24,0.82)] sm:left-6"
                        aria-label="View previous product image"
                      >
                        <span aria-hidden="true">{"<"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => showGalleryImage(1)}
                        className="absolute right-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(16,0,6,0.62)] text-[var(--skxnz-text-light)] shadow-[0_10px_24px_rgba(16,0,6,0.24)] ring-1 ring-white/15 backdrop-blur transition hover:bg-[rgba(58,8,24,0.82)] sm:right-6"
                        aria-label="View next product image"
                      >
                        <span aria-hidden="true">{">"}</span>
                      </button>
                    </>
                  ) : null}
                </div>
              </Card>

              <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max gap-3 sm:grid sm:min-w-0 sm:grid-cols-4">
                  {galleryImages.map((image, index) => {
                    const isActive = activeGalleryImage === image;

                    return (
                      <button
                        key={`${product.id}-gallery-${index + 1}`}
                        type="button"
                        onClick={() => setActiveImage(image)}
                        className="group min-w-[8.5rem] text-left sm:min-w-0"
                      >
                        <div
                          className={`relative h-28 overflow-hidden rounded-[20px] border bg-[var(--skxnz-card)] transition sm:h-36 ${
                            isActive
                              ? "border-[rgba(34,211,238,0.55)] shadow-[0_0_0_4px_rgba(34,211,238,0.08)]"
                              : "border-[var(--skxnz-border)] hover:border-[rgba(58,8,24,0.24)]"
                          }`}
                        >
                          <SafeImage
                            src={image}
                            fallbackSrc={skxnzFallbackAssets.product}
                            alt={`${product.name} thumbnail ${index + 1}`}
                            fill
                            sizes="(max-width: 640px) 35vw, 16vw"
                            className="object-cover object-center transition duration-500 group-hover:scale-[1.025]"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <ProductPurchasePanel product={product} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.42fr)]">
          <div className="grid gap-4">
            <ProductAccordion title="Product Details" defaultOpen>
              <p className="break-words">{product.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {product.tags.slice(0, 8).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </ProductAccordion>

            <ProductAccordion title="Size Guide">
              {product.dataSource === "live" ? (
                <p>
                  Available sizes: {product.sizes.join(", ")}. Fit guidance is still being
                  prepared, so please use the listed size options as the current catalog data.
                </p>
              ) : (
                <p>
                  Available sizes: {product.sizes.join(", ")}. Select your size before adding
                  to cart. Detailed fit guidance is still being prepared.
                </p>
              )}
            </ProductAccordion>

            <ProductAccordion title="Delivery And Returns">
              <p>
                {product.deliveryWindow}. Delivery tracking, return pickup, payment, and refund
                processing are not live yet.
              </p>
            </ProductAccordion>
          </div>

          <Card className="relative overflow-hidden rounded-[30px] border-[rgba(255,254,250,0.16)] bg-[linear-gradient(135deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep),var(--skxnz-maroon))] p-6 text-[var(--skxnz-text-light)] shadow-[0_24px_60px_rgba(16,0,6,0.18)]">
            <div className="absolute right-[-5rem] top-[-4rem] h-48 w-48 rounded-full bg-[rgba(34,211,238,0.14)] blur-3xl" />
            <div className="absolute bottom-[-5rem] left-[-4rem] h-48 w-48 rounded-full bg-[rgba(139,92,246,0.16)] blur-3xl" />
            <div className="relative z-10">
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[rgba(255,254,250,0.66)]">
                AI Styling Preview
              </p>
              <h2 className="mt-4 text-2xl font-semibold uppercase leading-tight tracking-[0.04em]">
                Ask SKXNZ AI how this could be styled.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[rgba(255,254,250,0.76)]">
                {product.dataSource === "live"
                  ? "Get styling guidance using SKXNZ catalog context only. AI try-on is not live yet."
                  : "Get styling guidance using SKXNZ catalog context only. AI try-on is not live yet."}
              </p>
              <Link
                href={`/ai-stylist?q=${encodeURIComponent(product.name)}`}
                className={`${buttonVariants({ variant: "secondary", size: "lg" })} mt-6 border-[rgba(255,254,250,0.20)] bg-[rgba(255,254,250,0.10)] text-[var(--skxnz-text-light)] hover:bg-[rgba(255,254,250,0.16)]`}
              >
                Ask SKXNZ AI
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[96rem] px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
              Similar Products
            </p>
            <h2 className="mt-2 break-words text-2xl font-semibold uppercase leading-tight tracking-[-0.02em] text-[var(--skxnz-text-dark)] sm:text-3xl">
              More signals in this lane.
            </h2>
          </div>
          <Link
            href="/shop"
            className={`${buttonVariants({ variant: "ghost" })} w-full sm:w-auto`}
          >
            Back To Shop
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {similarProducts.map((relatedProduct) => (
            <ProductCard key={relatedProduct.id} product={relatedProduct} />
          ))}
        </div>
      </section>
    </div>
  );
}
