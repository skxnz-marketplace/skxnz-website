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

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="mb-4 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#F4F1EC]/40">
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-[0.76rem] text-[#F4F1EC]/60 transition hover:text-[#F4F1EC]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
  { href: "/community-guidelines", label: "Community Guidelines" },
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
      <footer className="bg-[#0E0E10] text-[#F4F1EC]">
        {/* Main columns */}
        <div className="mx-auto max-w-[1440px] px-6 py-14 sm:px-10 lg:px-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
            {/* Brand column */}
            <div className="space-y-5 sm:col-span-2 lg:col-span-1">
              <div>
                <p className="text-[1.1rem] font-bold uppercase tracking-[0.46em] text-[#F4F1EC]">
                  SKXNZ
                </p>
                <p className="mt-1 text-[0.66rem] uppercase tracking-[0.22em] text-[#F4F1EC]/40">
                  AI-powered premium futurewear fashion marketplace
                </p>
              </div>
              <p className="text-[0.72rem] text-[#F4F1EC]/45">{siteConfig.socialHandle}</p>
              {/* Social icons row */}
              <div className="flex gap-2">
                {["Instagram", "Twitter/X", "YouTube"].map((s) => (
                  <span
                    key={s}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F4F1EC]/10 text-[0.56rem] font-bold uppercase tracking-tight text-[#F4F1EC]/30"
                    title={s}
                  >
                    {s[0]}
                  </span>
                ))}
              </div>
              {/* Newsletter */}
              <div className="flex max-w-[280px] overflow-hidden rounded-full border border-[#F4F1EC]/12 bg-[#F4F1EC]/5">
                <input
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Newsletter email"
                  className="flex-1 bg-transparent px-4 py-2.5 text-[0.72rem] text-[#F4F1EC] placeholder:text-[#F4F1EC]/30 outline-none"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-full bg-[#F4F1EC] px-4 py-2.5 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[#0E0E10] transition hover:bg-white"
                >
                  Join
                </button>
              </div>
            </div>

            {/* Shop */}
            <FooterCol title="Shop" links={[
              { label: "New In", href: "/shop?new=1" },
              { label: "Sneakers", href: "/categories/sneakers" },
              { label: "Streetwear", href: "/categories/streetwear" },
              { label: "Watches", href: "/categories/watches" },
              { label: "Bags", href: "/categories/bags" },
              { label: "Accessories", href: "/categories/accessories" },
              { label: "Sale", href: "/shop?sale=1" },
            ]} />

            {/* Company */}
            <FooterCol title="Company" links={[
              { label: "About Us", href: "/about" },
              { label: "Careers", href: "/about" },
              { label: "Press", href: "/about" },
              { label: "Sustainability", href: "/about" },
              { label: "Waitlist", href: "/waitlist" },
            ]} />

            {/* Support */}
            <FooterCol title="Support" links={[
              { label: "Help Center", href: "/support" },
              { label: "Track Order", href: "/orders" },
              { label: "Returns", href: "/returns" },
              { label: "Shipping Info", href: "/shipping" },
              { label: "Size Guide", href: "/support" },
              { label: "Contact Us", href: "/contact" },
            ]} />

            {/* Explore */}
            <FooterCol title="Explore" links={[
              { label: "Brands", href: "/brands" },
              { label: "AI Stylist", href: "/ai" },
              { label: "Signal Community", href: "/community" },
              { label: "Early Access", href: "/waitlist" },
            ]} />
          </div>
        </div>

        {/* Bottom strip */}
        <div className="border-t border-[#F4F1EC]/8">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-6 py-5 sm:px-10 lg:px-16">
            <p className="text-[0.66rem] text-[#F4F1EC]/35">
              © 2025 SKXNZ. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { label: "Terms", href: "/terms" },
                { label: "Privacy", href: "/privacy" },
                { label: "Cookies", href: "/privacy" },
              ].map((l) => (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  className="text-[0.66rem] text-[#F4F1EC]/35 transition hover:text-[#F4F1EC]/70"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <p className="text-[0.66rem] text-[#F4F1EC]/35">India (INR ₹)</p>
          </div>
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
