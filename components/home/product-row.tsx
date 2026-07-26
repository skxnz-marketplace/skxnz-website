"use client";

import Link from "next/link";
import { useRef } from "react";

import { SafeImage } from "@/components/shared/safe-image";
import { cn } from "@/lib/cn";
import { type HomeProduct, formatPrice } from "@/lib/home-data";
import { skxnzFallbackAssets } from "@/src/lib/assets";

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
  const gradient = PRODUCT_GRADIENTS[index % PRODUCT_GRADIENTS.length] ?? PRODUCT_GRADIENTS[0];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/6 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(22,22,22,0.12)] focus-within:-translate-y-1 focus-within:shadow-[0_18px_44px_rgba(22,22,22,0.12)] motion-reduce:transform-none motion-reduce:transition-none">
      {/* Product image (branded gradient behind while loading / when absent) */}
      <Link
        href={product.href}
        className={cn(
          "relative flex aspect-[3/4] w-full items-end overflow-hidden rounded-t-2xl bg-gradient-to-br",
          gradient,
        )}
        tabIndex={-1}
      >
        {product.image ? (
          <SafeImage
            src={product.image}
            fallbackSrc={skxnzFallbackAssets.product}
            alt={`${product.brand} ${product.name}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover object-center transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-x-0 bottom-3 truncate px-3 text-[0.78rem] font-medium uppercase tracking-[0.18em] text-white/40">
            {product.brand} · {product.name}
          </span>
        )}
      </Link>

      {/* Preview pill — visible on hover and keyboard focus */}
      <Link
        href={product.href}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute bottom-[72px] left-1/2 hidden -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[#161616] shadow-sm group-focus-within:flex group-hover:flex"
      >
        <EyeIcon />
        Preview
      </Link>

      {/* Info — brand is the quiet label, product name and price carry the
          weight. Previously the name rendered smaller than the brand above it,
          which inverted the hierarchy. */}
      <div className="flex flex-col gap-1 p-4">
        <p className="truncate text-[0.75rem] font-bold uppercase tracking-[0.12em] text-[#2E1014]/70">
          {product.brand}
        </p>
        <Link
          href={product.href}
          className="line-clamp-2 rounded text-[0.95rem] font-semibold leading-snug text-[#161616] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E1014]"
          aria-label={`View ${product.brand} ${product.name}`}
        >
          {product.name}
        </Link>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[1rem] font-bold tracking-[-0.01em] text-[#161616]">
            {formatPrice(product.price)}
          </span>
          {product.oldPrice != null && (
            <span className="text-[0.8rem] font-medium text-[#161616]/40 line-through">
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
  /** Alternating up/down card offsets with a slow float animation; row stretches near full-bleed. */
  staggered?: boolean;
};

export function ProductRow({ heading, viewAllHref, products, staggered = false }: ProductRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    rowRef.current?.scrollBy({ left: dir === "left" ? -380 : 380, behavior: "smooth" });
  }

  if (staggered) {
    return (
      <section aria-label={heading} className="overflow-hidden bg-[#F4F1EC] pb-14 pt-10 sm:pb-20 sm:pt-14">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="font-grotesk text-2xl font-bold uppercase tracking-[-0.015em] text-[#161616] sm:text-3xl">
              {heading}
            </h2>
            <Link
              href={viewAllHref}
              className="inline-flex min-h-[44px] shrink-0 items-center rounded-full px-2 text-[0.8rem] font-bold uppercase tracking-[0.1em] text-[#2E1014] transition hover:opacity-70"
            >
              View All →
            </Link>
          </div>

          {/* Staggered grid — alternate cards drop down, all float slowly */}
          <div className="hidden gap-5 sm:grid sm:grid-cols-3 lg:grid-cols-6 lg:gap-6">
            {products.map((p, i) => (
              <div key={p.id} className={cn(i % 2 === 1 && "sm:mt-14")}>
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>

          {/* Mobile: 2-col grid, no stagger */}
          <div className="grid grid-cols-2 gap-4 sm:hidden">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label={heading} className="bg-[#F4F1EC] py-14 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="font-grotesk text-2xl font-bold uppercase tracking-[-0.015em] text-[#161616] sm:text-3xl">
            {heading}
          </h2>
          <Link
            href={viewAllHref}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-full px-2 text-[0.8rem] font-bold uppercase tracking-[0.1em] text-[#2E1014] transition hover:opacity-70"
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
            className="absolute -left-5 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/8 transition hover:shadow-lg lg:flex"
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
            className="absolute -right-5 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/8 transition hover:shadow-lg lg:flex"
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
