"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { type HomeProduct, formatPrice } from "@/lib/home-data";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M19.4 5.6a5 5 0 0 0-7.1 0L12 5.9l-.3-.3a5 5 0 0 0-7.1 7.1l.3.3L12 20l7.1-7 .3-.3a5 5 0 0 0 0-7.1Z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M2.4 12C3.9 7.4 7.6 4 12 4s8.1 3.4 9.6 8c-1.5 4.6-5.2 8-9.6 8s-8.1-3.4-9.6-8Z"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.65" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="m14.5 5.5-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="m9.5 5.5 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PRODUCT_GRADIENTS = [
  "from-[#181820] to-[#22222e]",
  "from-[#181418] to-[#262028]",
  "from-[#141818] to-[#202828]",
  "from-[#181614] to-[#2a2420]",
  "from-[#141618] to-[#202430]",
  "from-[#181818] to-[#262626]",
];

function ProductCard({ product, index }: { product: HomeProduct; index: number }) {
  const [wishlisted, setWishlisted] = useState(false);
  const gradient = PRODUCT_GRADIENTS[index % PRODUCT_GRADIENTS.length] ?? PRODUCT_GRADIENTS[0];

  return (
    <article className="group relative flex flex-col rounded-2xl bg-white shadow-sm ring-1 ring-black/6 transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Placeholder image */}
      <Link
        href={product.href}
        className={cn(
          "relative flex aspect-[3/4] w-full items-end overflow-hidden rounded-t-2xl bg-gradient-to-br",
          gradient,
        )}
        tabIndex={-1}
      >
        <span className="absolute inset-x-0 bottom-3 truncate px-3 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-white/40">
          {product.brand} · {product.name}
        </span>
      </Link>

      {/* Wishlist */}
      <button
        type="button"
        onClick={() => setWishlisted((w) => !w)}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className={cn(
          "absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white",
          wishlisted ? "text-rose-500" : "text-[#161616]/40",
        )}
      >
        <HeartIcon filled={wishlisted} />
      </button>

      {/* Preview pill — visible on hover and keyboard focus */}
      <Link
        href={product.href}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute bottom-[72px] left-1/2 hidden -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[#161616] shadow-sm group-focus-within:flex group-hover:flex"
      >
        <EyeIcon />
        Preview
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-0.5 p-3">
        <p className="truncate text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#2E1014]">
          {product.brand}
        </p>
        <Link
          href={product.href}
          className="line-clamp-2 rounded text-[0.76rem] font-semibold leading-snug text-[#161616] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E1014]"
          aria-label={`View ${product.brand} ${product.name}`}
        >
          {product.name}
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[0.82rem] font-bold text-[#161616]">
            {formatPrice(product.price)}
          </span>
          {product.oldPrice != null && (
            <span className="text-[0.7rem] font-medium text-[#161616]/40 line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

type ProductRowProps = {
  heading: string;
  viewAllHref: string;
  products: HomeProduct[];
};

export function ProductRow({ heading, viewAllHref, products }: ProductRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    rowRef.current?.scrollBy({ left: dir === "left" ? -380 : 380, behavior: "smooth" });
  }

  return (
    <section aria-label={heading} className="bg-[#F4F1EC] py-8">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-grotesk text-xl font-bold uppercase tracking-[-0.01em] text-[#161616]">
            {heading}
          </h2>
          <Link
            href={viewAllHref}
            className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#2E1014] transition hover:opacity-70"
          >
            View All →
          </Link>
        </div>

        {/* Product grid — desktop: scroll row, mobile: 2-col grid */}
        <div className="hidden sm:relative sm:block">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label={`Scroll ${heading} left`}
            className="absolute -left-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/8 transition hover:shadow-lg lg:flex"
          >
            <ChevronLeft />
          </button>

          <div
            ref={rowRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 [&::-webkit-scrollbar]:hidden"
          >
            {products.map((p, i) => (
              <div key={p.id} className="shrink-0 sm:shrink">
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label={`Scroll ${heading} right`}
            className="absolute -right-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/8 transition hover:shadow-lg lg:flex"
          >
            <ChevronRight />
          </button>
        </div>

        {/* Mobile: 2-col grid */}
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
