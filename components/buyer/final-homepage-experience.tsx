"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import {
  featuredProducts,
  formatProductPrice,
  products as catalogProducts,
  type Product,
} from "@/lib/data/products";
import { WishlistButton } from "@/components/wishlist/wishlist-button";

type HeroSlide = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  bgImage: string;
  imagePosition?: string;
};

type HomeProduct = {
  id: string;
  href: string;
  brand: string;
  name: string;
  price: string;
  oldPrice?: string;
  category: string;
  image: string;
  sizes: string[];
  colors: string[];
  imageFit?: "cover" | "contain";
  imagePosition?: string;
  aiPick?: boolean;
  description?: string;
};

type HomeCategory = {
  label: string;
  href: string;
  image: string;
  imagePosition?: string;
};

const safeHeroModel = "/assets/home/categories/men.png";
const safeHeroWearSignal = "/assets/home/hero/wear-the-signal.png";
const safeHeroAiStyled = "/assets/home/hero/ai-styled-fits.png";
const safeHeroNewSeason = "/assets/home/hero/new-season-picks.png";
const safeHeroLimited = "/assets/home/hero/limited-edition-drops.png";
const safeSignalTee = "/assets/demo/products/product-01.webp";
const safeBackTee = "/assets/demo/uploaded/products/skxnz-back-tee.png";
const safeGraphicTee = "/assets/demo/uploaded/products/skxnz-graphic-tee.png";
const safePerfumeTile = "/assets/demo/categories/perfumes.svg";
const safeAccessoryTile = "/assets/demo/categories/accessories.svg";

const heroSlides: HeroSlide[] = [
  {
    id: "wear-the-signal",
    kicker: "Next Generation Fashion",
    title: "WEAR THE SIGNAL",
    subtitle: "Futurewear drops, curated for now.",
    cta: "Shop the Future",
    href: "/shop",
    bgImage: safeHeroWearSignal,
    imagePosition: "center right",
  },
  {
    id: "ai-styled-future",
    kicker: "AI Styled Future",
    title: "AI STYLED FUTURE",
    subtitle: "Smart picks from the SKXNZ catalogue.",
    cta: "Explore AI Styled",
    href: "/categories/ai-styled",
    bgImage: safeHeroAiStyled,
    imagePosition: "center right",
  },
  {
    id: "new-season",
    kicker: "New Season",
    title: "NEW SEASON",
    subtitle: "Fresh pieces for the next rotation.",
    cta: "View New Season",
    href: "/categories/new-season",
    bgImage: safeHeroNewSeason,
    imagePosition: "center right",
  },
  {
    id: "limited-edition",
    kicker: "Limited Edition",
    title: "LIMITED EDITION",
    subtitle: "Short runs. Sharp signals.",
    cta: "View Limited",
    href: "/categories/limited-edition",
    bgImage: safeHeroLimited,
    imagePosition: "center right",
  },
];

const brandPills = [
  "AETHER",
  "NOIR.FM",
  "VLTR",
  "AURIC",
  "PRISM",
  "NEXO",
  "OBSIDN",
  "PARALLX",
];

const categoryTiles: HomeCategory[] = [
  { label: "Men", href: "/categories/men", image: safeHeroModel, imagePosition: "center 18%" },
  { label: "Women", href: "/categories/women", image: safeGraphicTee, imagePosition: "center" },
  { label: "Perfume", href: "/categories/perfume", image: safePerfumeTile, imagePosition: "center" },
  { label: "Accessories", href: "/categories/accessories", image: safeAccessoryTile },
  { label: "Streetwear", href: "/categories/streetwear", image: safeBackTee, imagePosition: "center" },
  { label: "New Season", href: "/categories/new-season", image: safeSignalTee, imagePosition: "center" },
  { label: "AI Styled", href: "/categories/ai-styled", image: safeHeroModel, imagePosition: "center 18%" },
  {
    label: "Limited Edition",
    href: "/categories/limited-edition",
    image: safeBackTee,
    imagePosition: "center",
  },
];

function toHomeProduct(product: Product): HomeProduct {
  const displayPrice = product.salePrice ?? product.price;

  return {
    id: product.id,
    href: `/product/${product.slug}`,
    brand: product.brandName,
    name: product.name,
    price: formatProductPrice(displayPrice),
    oldPrice: product.salePrice ? formatProductPrice(product.price) : undefined,
    category: product.category,
    image: product.image,
    sizes: product.sizes,
    colors: product.colors,
    imageFit: product.image.endsWith(".svg") ? "contain" : "cover",
    aiPick:
      product.collections.some((collection) =>
        collection.toLowerCase().includes("ai styl"),
      ) || product.tags.some((tag) => tag.toLowerCase().includes("ai styl")),
    description: product.shortDescription,
  };
}

const homeProducts = (
  featuredProducts.length >= 8 ? featuredProducts : catalogProducts
)
  .slice(0, 8)
  .map(toHomeProduct);

const spotlightProducts = catalogProducts
  .filter((product) => !homeProducts.some((homeProduct) => homeProduct.id === product.id))
  .slice(0, 5)
  .map(toHomeProduct);

const mosaicCategories = [
  { label: "Streetwear", href: "/categories/streetwear", image: safeBackTee, className: "sm:col-span-2 sm:row-span-2" },
  { label: "Men", href: "/categories/men", image: safeHeroModel, className: "" },
  { label: "Women", href: "/categories/women", image: safeGraphicTee, className: "" },
  { label: "Perfume", href: "/categories/perfume", image: safePerfumeTile, className: "" },
  { label: "Limited Edition", href: "/categories/limited-edition", image: safeBackTee, className: "sm:col-span-2" },
  { label: "Brands", href: "/brands", image: safeSignalTee, className: "" },
  { label: "Community Beta", href: "/community", image: safeAccessoryTile, className: "" },
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M7 12h10m0 0-4-4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d={direction === "left" ? "m14.5 5.5-6 6 6 6" : "m9.5 5.5 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M12 3.8 14.2 9l5.4 2.2-5.4 2.2L12 18.6l-2.2-5.2-5.4-2.2L9.8 9 12 3.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ProductImage({ product, priority = false }: { product: HomeProduct; priority?: boolean }) {
  const objectFit = product.imageFit === "contain" ? "object-contain p-4" : "object-cover";

  return (
    <Image
      src={product.image}
      alt={`${product.brand} ${product.name}`}
      fill
      sizes="(max-width: 640px) 46vw, (max-width: 1024px) 22vw, 180px"
      priority={priority}
      className={cn("transition-transform duration-500 group-hover:scale-[1.035]", objectFit)}
      style={{ objectPosition: product.imagePosition ?? "center" }}
    />
  );
}

function ProductCard({
  product,
  isSelected,
  onSelect,
}: {
  product: HomeProduct;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <article
      onMouseEnter={onSelect}
      className={cn(
        "group relative flex h-[218px] min-w-0 flex-col overflow-hidden rounded-[16px] bg-[var(--skxnz-card)] p-2 text-left shadow-[0_8px_18px_rgba(58,8,24,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(58,8,24,0.08)] sm:h-[228px]",
        isSelected
          ? "ring-1 ring-[rgba(217,70,239,0.18)]"
          : "ring-1 ring-[rgba(58,8,24,0.06)]",
      )}
    >
      <Link
        href={product.href}
        onFocus={onSelect}
        className="relative h-[126px] overflow-hidden rounded-[13px] bg-[linear-gradient(180deg,var(--skxnz-surface),var(--skxnz-bg-soft))] sm:h-[136px]"
      >
          <ProductImage product={product} />
          {product.aiPick ? (
            <span className="absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/70 bg-[var(--skxnz-surface)] text-[var(--skxnz-iris)] shadow-[0_0_20px_rgba(34,211,238,0.18)] backdrop-blur">
              <SparkIcon />
            </span>
          ) : null}
      </Link>
      <WishlistButton productId={product.id} className="absolute right-3 top-3 h-8 w-8" />

      <Link href={product.href} onFocus={onSelect} className="flex min-w-0 flex-1 flex-col px-1 py-2">
          <p className="line-clamp-1 min-w-0 break-words text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[var(--skxnz-maroon)]">
            {product.brand}
          </p>
          <h3 className="mt-1 line-clamp-2 min-w-0 break-words text-[0.74rem] font-semibold leading-snug text-[var(--skxnz-text-dark)]">
            {product.name}
          </h3>
          <div className="mt-auto flex min-w-0 items-baseline gap-2 pt-1">
            <p className="text-xs font-bold text-[var(--skxnz-maroon-deep)]">
              {product.price}
            </p>
            {product.oldPrice ? (
              <p className="truncate text-[0.68rem] font-semibold text-[var(--skxnz-text-muted)] line-through">
                {product.oldPrice}
              </p>
            ) : null}
          </div>
      </Link>
      <Link
        href={product.href}
        className="absolute bottom-3 right-3 rounded-full bg-[rgba(255,254,250,0.88)] px-2.5 py-1 text-[0.56rem] font-bold uppercase tracking-[0.08em] text-[var(--skxnz-maroon)] opacity-0 shadow-[0_8px_18px_rgba(58,8,24,0.12)] transition group-hover:opacity-100"
      >
        Preview
      </Link>
    </article>
  );
}

function MiniProductCard({ product }: { product: HomeProduct }) {
  return (
    <article className="group relative flex min-w-0 flex-col rounded-[18px] border border-[var(--skxnz-border)] bg-[var(--skxnz-card)] p-2 shadow-[0_10px_22px_rgba(58,8,24,0.055)] transition hover:-translate-y-0.5 hover:border-[rgba(58,8,24,0.22)]">
      <Link
        href={product.href}
        className="relative h-[106px] overflow-hidden rounded-[14px] border border-[rgba(58,8,24,0.06)] bg-[linear-gradient(180deg,var(--skxnz-surface),var(--skxnz-bg-soft))] sm:h-[116px]"
      >
        <ProductImage product={product} />
      </Link>
      <WishlistButton productId={product.id} className="absolute right-4 top-4 h-8 w-8" />
      <Link href={product.href} className="min-w-0">
        <p className="mt-2 line-clamp-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[var(--skxnz-maroon)]">
          {product.brand}
        </p>
        <p className="line-clamp-2 min-w-0 break-words text-[0.72rem] font-semibold uppercase leading-snug text-[var(--skxnz-text-dark)]">
          {product.name}
        </p>
        <p className="mt-1 text-xs font-bold text-[var(--skxnz-maroon-deep)]">{product.price}</p>
      </Link>
    </article>
  );
}

export function FinalHomepageExperience() {
  const [activeSlide, setActiveSlide] = useState(0);
  const categoryStripRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeHero = heroSlides[activeSlide];

  function scrollCategories(direction: "left" | "right") {
    const strip = categoryStripRef.current;

    if (!strip) {
      return;
    }

    strip.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  }

  return (
    <div className="min-h-screen bg-[var(--skxnz-bg)] pb-8 text-[var(--skxnz-text-dark)]">
      <section className="relative -mt-px overflow-hidden bg-[var(--skxnz-obsidian)]">
        <div className="relative h-[clamp(300px,68vw,410px)] min-h-[300px] max-h-[410px] overflow-hidden bg-[linear-gradient(135deg,#100006_0%,#1A030B_54%,#3A0818_100%)] sm:h-[clamp(330px,42vw,410px)] sm:min-h-[330px] lg:h-[clamp(340px,32vw,410px)] lg:min-h-[340px]">
          {heroSlides.map((slide, index) => (
            <Image
              key={slide.id}
              src={slide.bgImage}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className={cn(
                "object-cover transition-[opacity,transform] duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                index === activeSlide
                  ? "translate-x-0 scale-100 opacity-[0.78]"
                  : index < activeSlide
                    ? "-translate-x-[18%] scale-[1.02] opacity-0"
                    : "translate-x-[18%] scale-[1.02] opacity-0",
              )}
              style={{ objectPosition: slide.imagePosition ?? "center right" }}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,0,6,0.92)_0%,rgba(16,0,6,0.66)_34%,rgba(16,0,6,0.18)_70%,rgba(16,0,6,0.34)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,254,250,0.10),transparent_25%),radial-gradient(circle_at_84%_78%,rgba(255,254,250,0.08),transparent_24%)]" />

          <div className="relative z-10 mx-auto flex h-full max-w-[96rem] flex-col justify-center px-[clamp(1.5rem,5vw,4.5rem)]">
            <div className="w-full max-w-[calc(100vw-3rem)] sm:max-w-[470px]">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[rgba(255,254,250,0.76)] sm:text-[10px]">
                {activeHero.kicker}
              </p>
              <h1 className="mt-3 max-w-[12ch] break-words text-[clamp(2.05rem,9.4vw,3.35rem)] font-semibold uppercase leading-[0.96] tracking-[-0.025em] text-[var(--skxnz-text-light)] sm:text-[clamp(2.45rem,4.8vw,3.45rem)] lg:text-[clamp(2.75rem,4vw,3.65rem)]">
                {activeHero.title}
              </h1>
              <p className="mt-3 w-64 max-w-full break-words text-[0.82rem] font-medium leading-6 text-[rgba(255,254,250,0.80)] sm:w-auto sm:max-w-[360px] sm:text-sm">
                {activeHero.subtitle}
              </p>
              <Link
                href={activeHero.href}
                className="mt-5 inline-flex h-10 min-w-0 items-center gap-3 rounded-full border border-[rgba(255,254,250,0.28)] bg-[rgba(255,254,250,0.08)] px-5 text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--skxnz-text-light)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:bg-[rgba(255,254,250,0.13)]"
              >
                <span className="truncate">{activeHero.cta}</span>
                <ArrowIcon />
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)
            }
            className="absolute left-4 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,254,250,0.20)] bg-[rgba(16,0,6,0.62)] text-[var(--skxnz-text-light)] transition hover:bg-[rgba(58,8,24,0.86)] lg:inline-flex"
            aria-label="Previous hero slide"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide((current) => (current + 1) % heroSlides.length)}
            className="absolute right-4 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,254,250,0.20)] bg-[rgba(16,0,6,0.62)] text-[var(--skxnz-text-light)] transition hover:bg-[rgba(58,8,24,0.86)] lg:inline-flex"
            aria-label="Next hero slide"
          >
            <ChevronIcon direction="right" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  index === activeSlide
                    ? "w-6 bg-[rgba(255,254,250,0.86)]"
                    : "w-1.5 bg-[rgba(255,254,250,0.34)] hover:bg-[rgba(255,254,250,0.58)]",
                )}
                aria-label={`Open hero slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1520px] space-y-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5 xl:px-10">
        <section className="relative" aria-label="Shop by category">
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            className="absolute left-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(255,254,250,0.92)] text-[var(--skxnz-maroon)] shadow-[0_10px_24px_rgba(58,8,24,0.12)] ring-1 ring-[rgba(58,8,24,0.10)] lg:inline-flex"
            aria-label="Scroll categories left"
          >
            <ChevronIcon direction="left" />
          </button>
          <div
            ref={categoryStripRef}
            className="-mx-4 overflow-x-auto scroll-smooth px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
          <div className="flex w-max gap-2.5 pr-3">
            {categoryTiles.map((category) => (
              <Link
                key={category.label}
                href={category.href}
                className="group relative h-[76px] w-[8.8rem] shrink-0 snap-start overflow-hidden rounded-[14px] bg-[var(--skxnz-obsidian)] shadow-[0_8px_18px_rgba(58,8,24,0.07)] sm:h-[86px] sm:w-[9.8rem]"
              >
                <Image
                  src={category.image}
                  alt={category.label}
                  fill
                  sizes="180px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ objectPosition: category.imagePosition ?? "center" }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,0,6,0.04)_20%,rgba(16,0,6,0.80)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 flex min-w-0 items-center justify-between gap-2 p-2.5">
                  <span className="line-clamp-1 min-w-0 break-words text-[0.72rem] font-bold text-[var(--skxnz-text-light)]">
                    {category.label}
                  </span>
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(255,254,250,0.88)] text-[var(--skxnz-maroon)]">
                    <ArrowIcon />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          </div>
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(255,254,250,0.92)] text-[var(--skxnz-maroon)] shadow-[0_10px_24px_rgba(58,8,24,0.12)] ring-1 ring-[rgba(58,8,24,0.10)] lg:inline-flex"
            aria-label="Scroll categories right"
          >
            <ChevronIcon direction="right" />
          </button>
        </section>

        <section className="grid gap-3 lg:grid-cols-[minmax(15rem,0.62fr)_minmax(0,1.38fr)]">
          <div className="min-w-0 py-2 lg:py-2">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[var(--skxnz-maroon)]">
              Browse the signal
            </p>
            <h2 className="mt-2 max-w-xl text-2xl font-semibold uppercase leading-tight tracking-[-0.02em] text-[var(--skxnz-text-dark)] sm:text-3xl">
              Categories, edits, and drops in one clean view.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[var(--skxnz-text-muted)]">
              Less noise. More product discovery.
            </p>
          </div>
          <div className="grid auto-rows-[82px] grid-cols-2 gap-2 sm:auto-rows-[94px] sm:grid-cols-4 lg:auto-rows-[74px]">
            {mosaicCategories.map((category) => (
              <Link
                key={category.label}
                href={category.href}
                className={cn(
                  "group relative min-w-0 overflow-hidden rounded-[18px] bg-[var(--skxnz-obsidian)] shadow-[0_10px_26px_rgba(58,8,24,0.075)]",
                  category.className,
                )}
              >
                <Image
                  src={category.image}
                  alt={category.label}
                  fill
                  sizes="(max-width: 768px) 50vw, 22vw"
                  className="object-cover opacity-[0.82] transition duration-500 group-hover:scale-[1.035]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,0,6,0.05),rgba(16,0,6,0.72))]" />
                <span className="absolute bottom-3 left-3 right-3 line-clamp-1 text-xs font-bold uppercase tracking-[0.08em] text-[var(--skxnz-text-light)]">
                  {category.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--skxnz-text-dark)]">
                Trending Now
              </h2>
              <p className="mt-1 text-xs text-[var(--skxnz-text-muted)]">
                Compact picks from the current catalog.
              </p>
            </div>
            <Link
              href="/shop"
              className="shrink-0 text-[0.64rem] font-bold uppercase tracking-[0.12em] text-[var(--skxnz-maroon)]"
            >
              Shop All
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {homeProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section
          id="top-brands"
          className="overflow-x-auto rounded-[18px] bg-[rgba(255,255,255,0.54)] p-1 shadow-[0_8px_20px_rgba(58,8,24,0.035)] backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Top brand toolbar"
        >
          <div className="flex min-w-max items-center gap-1.5 xl:min-w-0">
            {brandPills.map((brand, index) => (
              <Link
                key={brand}
                href="/brands"
                className={cn(
                  "inline-flex h-8 min-w-[6.2rem] flex-1 items-center justify-center rounded-full px-3 text-center text-[0.6rem] font-bold uppercase tracking-[0.12em] transition",
                  index === 4
                    ? "bg-[var(--skxnz-surface)] text-[var(--skxnz-maroon)] shadow-[0_0_0_3px_rgba(139,92,246,0.08)]"
                    : "text-[var(--skxnz-text-dark)] hover:bg-white",
                )}
              >
                {brand}
              </Link>
            ))}
            <Link
              href="/brands"
              className="inline-flex h-8 min-w-[6.2rem] flex-1 items-center justify-center gap-2 rounded-full bg-[var(--skxnz-surface)] px-3 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[var(--skxnz-text-dark)] transition hover:bg-white"
            >
              View All <ArrowIcon />
            </Link>
          </div>
        </section>

        <section
          id="limited-drops"
          className="relative overflow-hidden rounded-[22px] border border-[rgba(255,254,250,0.18)] bg-[linear-gradient(135deg,#100006,#3A0818,#1A030B)] px-6 py-5 text-[var(--skxnz-text-light)] shadow-[0_20px_42px_rgba(58,8,24,0.15)] sm:px-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_26%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_84%_72%,rgba(34,211,238,0.12),transparent_22%),linear-gradient(90deg,rgba(26,3,11,0.96),rgba(58,8,24,0.62),rgba(16,0,6,0.92))]" />
          <div className="absolute -right-20 top-[-1rem] h-28 w-[30rem] rotate-[-12deg] rounded-full border border-white/[0.14] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.18),transparent)]" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="line-clamp-1 break-words text-xl font-semibold uppercase tracking-[0.18em] sm:text-2xl">
                Limited Edition Drop
              </h2>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[rgba(255,254,250,0.78)]">
                Exclusive pieces. Limited quantities.
              </p>
            </div>
            <Link
              href="/shop?q=limited%20edition"
              className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-[rgba(255,254,250,0.32)] bg-[rgba(255,254,250,0.08)] px-6 py-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--skxnz-text-light)] backdrop-blur transition hover:bg-[rgba(255,254,250,0.14)] sm:w-auto"
            >
              Explore Drop <ArrowIcon />
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--skxnz-text-dark)]">
              Brand Spotlight
            </h2>
            <Link
              href="/brands"
              className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[var(--skxnz-maroon)]"
            >
              View All
            </Link>
          </div>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.45fr)]">
            <Link
              href="/brands"
              className="relative min-h-[250px] overflow-hidden rounded-[22px] border border-white/20 bg-[var(--skxnz-obsidian)] p-7 text-[var(--skxnz-text-light)] shadow-[0_20px_46px_rgba(58,8,24,0.13)]"
            >
              <Image
                src={safeHeroModel}
                alt=""
                fill
                sizes="(max-width: 1280px) 100vw, 40vw"
                className="object-cover opacity-60"
                style={{ objectPosition: "center 18%" }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,0,6,0.96),rgba(42,6,19,0.76),rgba(58,8,24,0.18))]" />
              <div className="absolute right-0 top-4 h-52 w-72 rotate-[-18deg] rounded-full border border-white/[0.12] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.16),transparent)]" />
              <div className="relative z-10 flex h-full max-w-sm flex-col justify-end">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.24em] text-[rgba(255,254,250,0.70)]">
                  Featured Brand
                </p>
                <h3 className="mt-3 text-4xl font-semibold uppercase tracking-[0.18em]">
                  AETHER
                </h3>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(255,254,250,0.82)]">
                  Engineered for tomorrow.
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(255,254,250,0.82)]">
                  Built to stand apart.
                </p>
                <span className="mt-5 inline-flex w-fit items-center gap-3 rounded-full border border-[rgba(255,254,250,0.32)] bg-[rgba(255,254,250,0.08)] px-5 py-3 text-[0.68rem] font-bold uppercase tracking-[0.14em]">
                  Explore AETHER <ArrowIcon />
                </span>
              </div>
            </Link>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {spotlightProducts.map((product) => (
                <MiniProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-3">
          <Link
            href="/categories/new-season"
            className="group relative min-h-[220px] overflow-hidden rounded-[22px] bg-[var(--skxnz-obsidian)] p-5 text-[var(--skxnz-text-light)] shadow-[0_16px_38px_rgba(58,8,24,0.10)] lg:col-span-2"
          >
            <Image
              src={safeSignalTee}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover opacity-[0.72] transition duration-500 group-hover:scale-[1.025]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,0,6,0.88),rgba(16,0,6,0.44),rgba(16,0,6,0.16))]" />
            <div className="relative z-10 flex h-full max-w-sm flex-col justify-end">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/64">
                New Season
              </p>
              <h2 className="mt-2 text-2xl font-semibold uppercase leading-tight">
                Fresh daily futurewear.
              </h2>
              <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.08em]">
                Shop New <ArrowIcon />
              </span>
            </div>
          </Link>
          <div className="grid gap-3">
            <Link
              href="/categories/ai-styled"
              className="rounded-[22px] bg-[var(--skxnz-surface)] p-5 shadow-[0_12px_30px_rgba(58,8,24,0.055)] ring-1 ring-[rgba(58,8,24,0.07)]"
            >
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--skxnz-maroon)]">
                AI Styled
              </p>
              <h3 className="mt-2 text-lg font-semibold uppercase leading-tight text-[var(--skxnz-text-dark)]">
                Catalog-aware picks.
              </h3>
              <p className="mt-2 text-sm text-[var(--skxnz-text-muted)]">
                Beta suggestions from SKXNZ data.
              </p>
            </Link>
            <Link
              href="/community"
              className="rounded-[22px] bg-[var(--skxnz-card)] p-5 shadow-[0_12px_30px_rgba(58,8,24,0.05)] ring-1 ring-[rgba(58,8,24,0.06)]"
            >
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--skxnz-maroon)]">
                Signal Community Beta
              </p>
              <h3 className="mt-2 text-lg font-semibold uppercase leading-tight text-[var(--skxnz-text-dark)]">
                Fits, updates, drops.
              </h3>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
