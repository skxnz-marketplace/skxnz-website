import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { navLinks } from "@/lib/data/site-content";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-obsidian/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-5">
          <BrandMark compact />
          <p className="max-w-xl text-sm leading-7 text-silver">
            {siteConfig.description} Built as the first private foundation for{" "}
            {siteConfig.parentCompany}.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-silver">
            <span>{siteConfig.domain}</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>{siteConfig.launchMode}</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-silver transition hover:border-teal/30 hover:text-pearl"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
