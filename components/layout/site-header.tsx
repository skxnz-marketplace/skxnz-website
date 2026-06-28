import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { navLinks } from "@/lib/data/site-content";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-obsidian/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <BrandMark />
            <Link
              href={siteConfig.waitlistUrl}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Join Waitlist
            </Link>
          </div>
          <nav className="-mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            <div className="flex min-w-max items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[0.7rem] uppercase tracking-[0.22em] text-silver transition hover:border-teal/30 hover:text-pearl"
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
