"use client";

import Link from "next/link";
import { Suspense } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { SiteSearchBar } from "@/components/shared/site-search-bar";
import { cn } from "@/lib/cn";
import { demoBrands } from "@/src/data/demo-brands";

type DiscoveryLink = {
  label: string;
  href: string;
};

type DiscoverySection = {
  title: string;
  href: string;
  eyebrow: string;
  description: string;
  links: DiscoveryLink[];
};

type DiscoveryMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: () => void;
  pathname: string;
  searchFocusSignal?: number;
};

const discoverySections: DiscoverySection[] = [
  {
    title: "Men",
    href: "/categories/men",
    eyebrow: "Shop",
    description: "Staples. Sneakers. Daily fits.",
    links: [
      { label: "T-Shirts", href: "/shop?q=T-Shirts" },
      { label: "Shirts", href: "/shop?q=Shirts" },
      { label: "Jackets", href: "/shop?q=Jackets" },
      { label: "Hoodies", href: "/shop?q=Hoodies" },
      { label: "Jeans", href: "/shop?q=Jeans" },
      { label: "Sneakers", href: "/shop?q=Sneakers" },
      { label: "Accessories", href: "/categories/accessories" },
    ],
  },
  {
    title: "Women",
    href: "/categories/women",
    eyebrow: "Shop",
    description: "Tops, bags, footwear, scent.",
    links: [
      { label: "Tops", href: "/shop?q=Tops" },
      { label: "Dresses", href: "/shop?q=Dresses" },
      { label: "Jackets", href: "/shop?q=Jackets" },
      { label: "Bags", href: "/shop?q=Bags" },
      { label: "Footwear", href: "/categories/footwear" },
      { label: "Accessories", href: "/categories/accessories" },
      { label: "Perfume", href: "/categories/perfume" },
    ],
  },
  {
    title: "Streetwear",
    href: "/categories/streetwear",
    eyebrow: "Edit",
    description: "Oversized. Cargo. Drops.",
    links: [
      { label: "Oversized", href: "/shop?q=oversized" },
      { label: "Graphic Tees", href: "/shop?q=graphic%20tees" },
      { label: "Cargo", href: "/shop?q=cargo" },
      { label: "Sneakers", href: "/shop?q=sneakers" },
      { label: "Limited Drops", href: "/categories/limited-edition" },
      { label: "Chrome Fits", href: "/shop?q=chrome" },
    ],
  },
  {
    title: "Accessories",
    href: "/categories/accessories",
    eyebrow: "Finish",
    description: "Bags, caps, eyewear, jewelry.",
    links: [
      { label: "Bags", href: "/shop?q=Bags" },
      { label: "Caps", href: "/shop?q=Caps" },
      { label: "Eyewear", href: "/shop?q=Eyewear" },
      { label: "Watches", href: "/shop?q=Watches" },
      { label: "Jewelry", href: "/shop?q=Jewelry" },
    ],
  },
  {
    title: "Perfume",
    href: "/categories/perfume",
    eyebrow: "Scent",
    description: "Men, women, unisex edits.",
    links: [
      { label: "Men", href: "/shop?q=men%20perfume" },
      { label: "Women", href: "/shop?q=women%20perfume" },
      { label: "Unisex", href: "/shop?q=unisex%20perfume" },
      { label: "Luxury", href: "/shop?q=luxury%20perfume" },
      { label: "New Season", href: "/categories/new-season" },
    ],
  },
  {
    title: "Signal Edits",
    href: "/shop?q=Wear%20The%20Signal",
    eyebrow: "Edits",
    description: "AI Styled, limited, new season.",
    links: [
      { label: "Wear The Signal", href: "/categories/wear-the-signal" },
      { label: "AI Styled", href: "/categories/ai-styled" },
      { label: "Limited Edition", href: "/categories/limited-edition" },
      { label: "New Season", href: "/categories/new-season" },
      { label: "Trending Now", href: "/shop?q=trending" },
      { label: "Signal Community Beta", href: "/community" },
    ],
  },
];

const topBrands = demoBrands.slice(0, 6);

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d="M4 10h10.4m0 0-3.8-3.8M14.4 10l-3.8 3.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </svg>
  );
}

function DrawerSection({
  section,
  onNavigate,
}: {
  section: DiscoverySection;
  onNavigate: () => void;
}) {
  return (
    <details className="group rounded-[16px] bg-white/[0.055] ring-1 ring-white/[0.08]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
        <span className="min-w-0">
          <span className="block text-[0.56rem] font-bold uppercase tracking-[0.16em] text-[rgba(255,254,250,0.52)]">
            {section.eyebrow}
          </span>
          <span className="mt-1 block truncate text-sm font-bold uppercase tracking-[0.1em] text-[#FFFEFA]">
            {section.title}
          </span>
        </span>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[var(--skxnz-glint)] transition group-open:rotate-90">
          <ArrowIcon />
        </span>
      </summary>
      <div className="border-t border-[rgba(255,254,250,0.10)] px-4 pb-4 pt-3">
        <p className="line-clamp-1 text-xs text-[rgba(255,254,250,0.66)]">
          {section.description}
        </p>
        <Link
          href={section.href}
          onClick={onNavigate}
          className="mt-3 flex items-center justify-between rounded-full bg-white/[0.07] px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#FFFEFA] ring-1 ring-[rgba(34,211,238,0.18)]"
        >
          Open {section.title}
          <ArrowIcon />
        </Link>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {section.links.map((link) => (
            <Link
              key={`${section.title}-${link.label}`}
              href={link.href}
              onClick={onNavigate}
              className="truncate rounded-full bg-white/[0.05] px-3 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.06em] text-[rgba(255,254,250,0.74)] ring-1 ring-white/[0.08] transition hover:text-[#FFFEFA] hover:ring-[rgba(34,211,238,0.35)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}

function BrandPills({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {topBrands.map((brand) => (
        <Link
          key={brand.id}
          href={`/brands/${brand.slug}`}
          onClick={onNavigate}
          className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-white/[0.78] ring-1 ring-white/[0.08] transition hover:text-white hover:ring-[rgba(34,211,238,0.32)]"
        >
          {brand.name}
        </Link>
      ))}
      <Link
        href="/brands"
        onClick={onNavigate}
        className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--skxnz-glint)] ring-1 ring-[rgba(139,92,246,0.20)] transition hover:text-white"
      >
        View All
      </Link>
    </div>
  );
}

export function DesktopMegaMenu({
  isOpen,
  onClose,
  onNavigate,
}: DiscoveryMenuProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <aside
      id="skxnz-discovery-mega-menu"
      className="fixed bottom-0 left-0 top-[72px] z-[140] hidden w-[min(420px,calc(100vw-2rem))] overflow-hidden border-r border-[rgba(255,254,250,0.12)] bg-[linear-gradient(145deg,rgba(16,0,6,0.98),rgba(42,6,19,0.98),rgba(58,8,24,0.96))] text-[#FFFEFA] shadow-[28px_0_72px_rgba(16,0,6,0.36)] backdrop-blur-2xl motion-safe:animate-[skxnz-drawer-in_180ms_ease-out] lg:flex lg:flex-col"
      aria-label="SKXNZ discovery mega menu"
    >
      <div className="border-b border-[rgba(255,254,250,0.10)] bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.12),transparent_28%),rgba(16,0,6,0.30)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[var(--skxnz-glint)]">
              Discover
            </p>
            <h2 className="mt-2 text-xl font-semibold uppercase tracking-[0.04em] text-[#FFFEFA]">
              Find the signal
            </h2>
            <p className="mt-2 text-xs leading-5 text-[rgba(255,254,250,0.66)]">
              Browse categories, brands, and edits.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(255,254,250,0.14)] bg-white/[0.08] text-[#FFFEFA] transition hover:border-[rgba(34,211,238,0.45)]"
            aria-label="Close discovery menu"
          >
            X
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 rounded-[16px] bg-white/[0.055] p-3 ring-1 ring-white/[0.08]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[var(--skxnz-glint)]">
              Top Brands
            </p>
            <Link
              href="/brands"
              onClick={onNavigate}
              className="text-[0.58rem] font-bold uppercase tracking-[0.08em] text-white/[0.58] hover:text-white"
            >
              View All
            </Link>
          </div>
          <div className="mt-3">
            <BrandPills onNavigate={onNavigate} />
          </div>
        </div>

        <div className="grid gap-2">
          {discoverySections.slice(0, 5).map((section) => (
            <DrawerSection
              key={section.title}
              section={section}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-2">
          {[
            { label: "Brands", href: "/brands" },
            { label: "AI Styled", href: "/categories/ai-styled" },
            { label: "Limited Edition", href: "/categories/limited-edition" },
            { label: "Signal Community Beta", href: "/community" },
            { label: "Sell on SKXNZ", href: "/sell" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center justify-between rounded-[16px] bg-white/[0.055] px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[rgba(255,254,250,0.84)] ring-1 ring-white/[0.08] transition hover:bg-white/[0.10] hover:text-[#FFFEFA] hover:ring-[rgba(34,211,238,0.32)]"
            >
              {item.label}
              <ArrowIcon />
            </Link>
          ))}
        </div>

      </div>
    </aside>
  );
}

export function MobileDiscoveryDrawer({
  isOpen,
  onClose,
  onNavigate,
  pathname,
  searchFocusSignal = 0,
}: DiscoveryMenuProps) {
  return (
    <aside
      id="skxnz-mobile-discovery-menu"
      className={cn(
        "fixed inset-y-0 left-0 z-[140] flex w-full max-w-[30rem] flex-col border-r border-[var(--skxnz-border)] bg-[var(--skxnz-bg)] shadow-[0_30px_90px_rgba(16,0,6,0.24)] transition duration-300 lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
      aria-label="SKXNZ mobile discovery menu"
      aria-hidden={!isOpen}
      inert={!isOpen ? true : undefined}
    >
      <div className="border-b border-[var(--skxnz-border)] bg-[linear-gradient(135deg,rgba(16,0,6,0.98),rgba(42,6,19,0.96),rgba(58,8,24,0.94))] px-5 py-5 text-[#FFFEFA]">
        <div className="flex items-center justify-between gap-4">
          <BrandMark className="max-w-full [&_span:last-child]:text-[#FFFEFA]/70" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(255,254,250,0.14)] bg-white/[0.08] text-[#FFFEFA] transition hover:border-[rgba(34,211,238,0.45)]"
            aria-label="Close navigation menu"
          >
            X
          </button>
        </div>

        <div className="mt-5">
          <Suspense
            fallback={
              <div className="h-11 w-full rounded-full border border-white/[0.12] bg-white/[0.08]" />
            }
          >
            <SiteSearchBar
              focusSignal={searchFocusSignal}
              placeholder="Search SKXNZ..."
              className="w-full [&_input]:h-11 [&_input]:border-[rgba(255,254,250,0.16)] [&_input]:bg-[rgba(255,254,250,0.09)] [&_input]:text-[#FFFEFA] [&_input]:placeholder:text-[rgba(255,254,250,0.54)] [&_input]:shadow-none"
            />
          </Suspense>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mb-4 rounded-[18px] bg-[linear-gradient(135deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep))] p-4 text-[#FFFEFA] shadow-[0_12px_30px_rgba(16,0,6,0.14)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[var(--skxnz-glint)]">
              Top Brands
            </p>
            <Link
              href="/brands"
              onClick={onNavigate}
              className="text-[0.58rem] font-bold uppercase tracking-[0.08em] text-white/[0.58]"
            >
              View All
            </Link>
          </div>
          <div className="mt-3">
            <BrandPills onNavigate={onNavigate} />
          </div>
        </div>

        <div className="grid gap-3">
          {discoverySections.map((section) => (
            <details
              key={section.title}
              className="group rounded-[18px] bg-[var(--skxnz-surface)] shadow-[0_8px_22px_rgba(58,8,24,0.045)] ring-1 ring-[rgba(58,8,24,0.08)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 marker:hidden">
                <span className="min-w-0">
                  <span className="block text-[0.58rem] font-bold uppercase tracking-[0.24em] text-[var(--skxnz-text-muted)]">
                    {section.eyebrow}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block truncate text-sm font-bold uppercase tracking-[0.18em]",
                      pathname === section.href
                        ? "text-[var(--skxnz-maroon)]"
                        : "text-[var(--skxnz-text-dark)]",
                    )}
                  >
                    {section.title}
                  </span>
                </span>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--skxnz-bg-soft)] text-[var(--skxnz-maroon)] ring-1 ring-[rgba(58,8,24,0.08)] transition group-open:rotate-90">
                  <ArrowIcon />
                </span>
              </summary>
              <div className="border-t border-[rgba(58,8,24,0.08)] px-4 py-4">
                <Link
                  href={section.href}
                  onClick={onNavigate}
                  className="mb-3 flex items-center justify-between rounded-full border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.08)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--skxnz-maroon)]"
                >
                  Open {section.title}
                  <ArrowIcon />
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  {section.links.map((link) => (
                    <Link
                      key={`${section.title}-${link.label}`}
                      href={link.href}
                      onClick={onNavigate}
                      className="min-w-0 rounded-full bg-[var(--skxnz-card)] px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--skxnz-text-dark)] ring-1 ring-[rgba(58,8,24,0.07)] transition hover:ring-[rgba(34,211,238,0.28)]"
                    >
                      <span className="line-clamp-2 break-words">{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-5 rounded-[20px] bg-[var(--skxnz-card)] p-4 ring-1 ring-[rgba(58,8,24,0.08)]">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[var(--skxnz-text-muted)]">
            Seller Access
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--skxnz-text-muted)]">
            Apply for internal seller review.
          </p>
          <Link
            href="/sell"
            onClick={onNavigate}
            className="mt-4 inline-flex w-full items-center justify-between rounded-full border border-[var(--skxnz-border)] bg-[var(--skxnz-maroon)] px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#FFFEFA]"
          >
            Apply as Seller
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </aside>
  );
}
