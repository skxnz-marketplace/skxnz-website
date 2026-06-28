"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useDemoRole } from "@/components/auth/demo-role-provider";
import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { BrandMark } from "@/components/layout/brand-mark";
import {
  DesktopMegaMenu,
  MobileDiscoveryDrawer,
} from "@/components/shared/discovery-menu";
import { SiteSearchBar } from "@/components/shared/site-search-bar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { demoRoleSummaries, getDemoNavLinks } from "@/lib/demo-role";
import { siteConfig } from "@/lib/site";

function isActiveNavItem(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/shop") {
    return pathname === "/shop" || pathname.startsWith("/product/");
  }

  if (href === "/seller") {
    return pathname === "/seller" || pathname === "/seller/dashboard";
  }

  if (href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/dashboard";
  }

  if (href === "/seller/products") {
    return pathname === "/seller/products" || pathname.startsWith("/seller/products/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M4 7h16M4 12h16M4 17h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M16 16 20 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M4 6h2l1.2 7.2a1.5 1.5 0 0 0 1.48 1.25h7.7a1.5 1.5 0 0 0 1.47-1.18L19.2 8H7.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="18.5" r="1.2" fill="currentColor" />
      <circle cx="16.5" cy="18.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M19.4 5.6a5 5 0 0 0-7.1 0L12 5.9l-.3-.3a5 5 0 0 0-7.1 7.1l.3.3L12 20l7.1-7 .3-.3a5 5 0 0 0 0-7.1Z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="8.4" r="3.4" stroke="currentColor" strokeWidth="1.65" />
      <path
        d="M5.8 19.5a6.4 6.4 0 0 1 12.4 0"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { role, isHydrated, clearRole } = useDemoRole();
  const { cartItems } = useMarketplace();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchFocusSignal, setSearchFocusSignal] = useState(0);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const activeRole = isHydrated ? role : null;
  const navLinks = getDemoNavLinks(activeRole);
  const roleLabel = activeRole
    ? `${demoRoleSummaries[activeRole].label} Demo`
    : "Private Beta Preview";
  const showBuyerHeader = activeRole !== "seller" && activeRole !== "admin";

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isDrawerOpen]);

  if (showBuyerHeader) {
    return (
      <>
        <header
          data-site-header
          className="sticky top-0 z-50 shrink-0 border-b border-[rgba(255,254,250,0.10)] bg-[var(--skxnz-obsidian)] text-[#FFFEFA] shadow-[0_14px_34px_rgba(9,7,10,0.22)]"
        >
          <div className="mx-auto max-w-[96rem] px-4 sm:px-6 lg:px-8">
            <div className="grid min-h-[72px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 md:grid-cols-[auto_minmax(14rem,1fr)_auto] xl:grid-cols-[minmax(12rem,0.62fr)_minmax(18rem,0.9fr)_auto]">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen((current) => !current)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(255,254,250,0.14)] bg-[var(--skxnz-maroon-deep)] text-pearlcream transition hover:border-[rgba(255,254,250,0.30)] hover:bg-[var(--skxnz-maroon)]"
                  aria-label="Open navigation menu"
                  aria-expanded={isDrawerOpen}
                  aria-controls="skxnz-discovery-mega-menu skxnz-mobile-discovery-menu"
                >
                  <MenuIcon />
                </button>

                <Link
                  href="/"
                  className="min-w-0 transition hover:opacity-90"
                  aria-label="SKXNZ home"
                >
                  <span className="block whitespace-nowrap text-[1.05rem] font-semibold uppercase leading-none tracking-[0.52em] text-pearlcream sm:text-[1.2rem]">
                    SKXNZ
                  </span>
                  <span className="mt-1 block truncate text-[0.56rem] uppercase tracking-[0.24em] text-pearlcream/70">
                    {siteConfig.tagline}
                  </span>
                </Link>
              </div>

              <div className="hidden min-w-0 md:block">
                <Suspense
                  fallback={
                    <div className="h-12 w-full rounded-full border border-white/[0.12] bg-white/[0.08]" />
                  }
                >
                  <SiteSearchBar
                    focusSignal={searchFocusSignal}
                    placeholder="Search for products, brands or styles..."
                    className="mx-auto w-full max-w-[30rem] [&_input]:h-10 [&_input]:border-[rgba(255,254,250,0.16)] [&_input]:bg-[var(--skxnz-maroon-deep)] [&_input]:text-[#FFFEFA] [&_input]:placeholder:text-[rgba(255,254,250,0.54)] [&_input]:shadow-none"
                  />
                </Suspense>
              </div>

              <div className="flex min-w-0 items-center justify-end gap-2">
                <nav className="hidden min-w-0 items-center justify-end gap-4 xl:flex">
                  {[
                    { href: "/shop", label: "Discover" },
                    { href: "/brands", label: "Brands" },
                    { href: "/ai-stylist", label: "AI Styled" },
                    { href: "/#limited-drops", label: "Limited" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="whitespace-nowrap text-[0.78rem] font-semibold text-[rgba(255,254,250,0.76)] transition hover:text-[#FFFEFA]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <button
                  type="button"
                  onClick={() => setSearchFocusSignal((current) => current + 1)}
                  className="hidden h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,254,250,0.14)] bg-[var(--skxnz-maroon-deep)] text-pearlcream transition hover:border-[rgba(255,254,250,0.30)] hover:bg-[var(--skxnz-maroon)] md:inline-flex xl:hidden"
                  aria-label="Focus site search"
                >
                  <SearchIcon />
                </button>
                <Link
                  href="/wishlist"
                  className="hidden h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,254,250,0.14)] bg-[var(--skxnz-maroon-deep)] text-pearlcream transition hover:border-[rgba(255,254,250,0.30)] hover:bg-[var(--skxnz-maroon)] sm:inline-flex"
                  aria-label="Open wishlist"
                >
                  <HeartIcon />
                </Link>
                <Link
                  href="/cart"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,254,250,0.14)] bg-[var(--skxnz-maroon-deep)] text-pearlcream transition hover:border-[rgba(255,254,250,0.30)] hover:bg-[var(--skxnz-maroon)]"
                  aria-label="Open cart"
                >
                  <CartIcon />
                  {cartCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-pearlcream px-1 text-[0.56rem] font-bold text-sangria">
                      {cartCount}
                    </span>
                  ) : (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-pearlcream/70" />
                  )}
                </Link>
                <Link
                  href="/account"
                  className="hidden h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,254,250,0.14)] bg-[var(--skxnz-maroon-deep)] text-pearlcream transition hover:border-[rgba(255,254,250,0.30)] hover:bg-[var(--skxnz-maroon)] sm:inline-flex"
                  aria-label="Open account"
                >
                  <AccountIcon />
                </Link>
              </div>
            </div>

            <div className="pb-3 md:hidden">
              <Suspense
                fallback={
                  <div className="mx-auto h-11 w-full rounded-full border border-white/[0.12] bg-white/[0.08]" />
                }
              >
                <SiteSearchBar
                  focusSignal={searchFocusSignal}
                  placeholder="Search for products, brands or styles..."
                  className="mx-auto w-full [&_input]:h-11 [&_input]:border-[rgba(255,254,250,0.16)] [&_input]:bg-[var(--skxnz-maroon-deep)] [&_input]:text-[#FFFEFA] [&_input]:placeholder:text-[rgba(255,254,250,0.54)] [&_input]:shadow-none"
                />
              </Suspense>
            </div>
          </div>
        </header>

        <div
          className={cn(
            "fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm transition",
            isDrawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />

        <DesktopMegaMenu
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onNavigate={() => setIsDrawerOpen(false)}
          pathname={pathname}
          searchFocusSignal={searchFocusSignal}
        />

        <MobileDiscoveryDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onNavigate={() => setIsDrawerOpen(false)}
          pathname={pathname}
          searchFocusSignal={searchFocusSignal}
        />
      </>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-sandstone/90 bg-pearlcream/92 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <BrandMark compact />
            <div className="flex flex-wrap items-center gap-3">
              <span className="max-w-full truncate rounded-full border border-sandstone bg-white/80 px-4 py-2 text-[0.68rem] uppercase tracking-[0.2em] text-silver">
                {roleLabel}
              </span>
              {activeRole ? (
                <>
                  <Link
                    href="/login"
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    Switch Role
                  </Link>
                  <Button type="button" variant="ghost" size="sm" onClick={clearRole}>
                    Exit Demo
                  </Button>
                </>
              ) : null}
            </div>
          </div>
          <nav className="-mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            <div className="flex min-w-max items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full border px-4 py-2 text-[0.7rem] uppercase tracking-[0.22em] transition",
                    isActiveNavItem(pathname, link.href)
                      ? "border-teal/35 bg-teal/10 text-sangria"
                      : "border-sandstone bg-white/80 text-silver hover:border-teal/35 hover:text-sangria",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
