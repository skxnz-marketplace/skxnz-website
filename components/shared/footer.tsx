"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useDemoRole } from "@/components/auth/demo-role-provider";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  demoRoleSummaries,
  footerUtilityLinks,
  getDemoNavLinks,
} from "@/lib/demo-role";
import { siteConfig } from "@/lib/site";

const trustFooterLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/support", label: "Support" },
  { href: "/faq", label: "FAQ" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/returns", label: "Returns" },
  { href: "/shipping", label: "Shipping" },
  { href: "/authenticity", label: "Authenticity" },
  { href: "/seller-terms", label: "Seller Terms" },
  { href: "/community-guidelines", label: "Community Guidelines" },
  { href: "/sell", label: "Sell on SKXNZ" },
  { href: "/community", label: "Signal Community Beta" },
] as const;

function getFooterLinkClassName(pathname: string, href: string) {
  const isActive = pathname === href;

  return [
    "rounded-2xl border px-3 py-2 text-[0.66rem] uppercase tracking-[0.16em] transition",
    isActive
      ? "border-teal/45 bg-pearlcream/12 text-pearlcream"
      : "border-pearlcream/10 bg-pearlcream/5 text-pearlcream/72 hover:border-teal/35 hover:text-pearlcream",
  ].join(" ");
}

export function Footer() {
  const pathname = usePathname();
  const { role, isHydrated, clearRole } = useDemoRole();
  const activeRole = isHydrated ? role : null;
  const roleLabel = activeRole
    ? `${demoRoleSummaries[activeRole].label} Demo`
    : "Public Launch Preview";
  const primaryLinks = getDemoNavLinks(activeRole);
  const secondaryLinks = activeRole ? footerUtilityLinks : [];
  const showBuyerFooter = activeRole !== "seller" && activeRole !== "admin";

  if (showBuyerFooter) {
    return (
      <footer className="border-t border-sandstone/90 bg-midnightbrown text-pearlcream">
        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:px-8">
          <div className="space-y-4">
            <BrandMark className="max-w-full" />
            <p className="max-w-lg text-sm leading-7 text-pearlcream/72">
              SKXNZ is preparing a private beta foundation for futurewear
              discovery, sellers, AI-assisted shopping, and Signal Community.
              Policy pages are drafts for review before public launch.
            </p>
          </div>

          <nav
            aria-label="Footer trust and policy links"
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
          >
            {trustFooterLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={getFooterLinkClassName(pathname, link.href)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-sandstone/60 bg-midnightbrown text-pearlcream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-5">
          <BrandMark compact />
          <div className="space-y-2 text-sm leading-7 text-pearlcream/75">
            <p>{siteConfig.tagline}</p>
            <p>{siteConfig.domain}</p>
            <p>{siteConfig.socialHandle}</p>
            <p>{siteConfig.supportEmail}</p>
            <p>{siteConfig.sellerEmail}</p>
          </div>
          <p className="max-w-xl text-sm leading-7 text-pearlcream/75">
            SKXNZ is currently in private MVP testing. Checkout, payments, delivery
            tracking, and AI features are not live yet.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-pearlcream/70">
            <span>{roleLabel}</span>
            <span className="h-1 w-1 rounded-full bg-pearlcream/35" />
            <span>{siteConfig.parentCompany}</span>
          </div>
          {activeRole ? (
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                Switch Role
              </Link>
              <Button type="button" variant="ghost" size="sm" onClick={clearRole}>
                Exit Demo
              </Button>
            </div>
          ) : null}
        </div>

        <div
          className={`grid gap-6 ${secondaryLinks.length > 0 ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}
        >
          <div className="grid gap-3">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-pearlcream/15 bg-pearlcream/6 px-4 py-3 text-sm text-pearlcream/78 transition hover:border-teal/40 hover:text-pearlcream"
              >
                {link.label}
              </Link>
            ))}
          </div>
          {secondaryLinks.length > 0 ? (
            <div className="grid gap-3">
              {secondaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-pearlcream/15 bg-pearlcream/6 px-4 py-3 text-sm text-pearlcream/78 transition hover:border-teal/40 hover:text-pearlcream"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <nav
          aria-label="Internal footer policy links"
          className="lg:col-span-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        >
          {trustFooterLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={getFooterLinkClassName(pathname, link.href)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
