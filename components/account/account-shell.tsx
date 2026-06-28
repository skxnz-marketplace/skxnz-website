"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

const accountNav = [
  { href: "/account", label: "Overview" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/cart-sync", label: "Cart Sync" },
  { href: "/cart", label: "Cart" },
];

type AccountShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
};

export function AccountShell({
  eyebrow = "Account foundation",
  title,
  description,
  children,
  aside,
}: AccountShellProps) {
  const pathname = usePathname();

  return (
    <DemoRoleGate
      allowedRoles={["buyer"]}
      areaLabel="Buyer account"
      helperText="The account area is a beta foundation for profile, wishlist, and order-history previews before real authentication and database persistence are connected."
    >
      <main className="mx-auto max-w-[92rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Card className="section-border overflow-hidden rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-0">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_0.68fr]">
            <div className="min-w-0 p-6 sm:p-8 lg:p-10">
              <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
                {eyebrow}
              </p>
              <h1 className="mt-4 max-w-[13ch] break-words font-display text-[2.35rem] uppercase leading-[0.92] tracking-[-0.04em] text-midnightbrown sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-stone sm:text-base">
                {description}
              </p>
            </div>
            <div className="min-w-0 border-t border-[rgba(58,8,24,0.12)] bg-[linear-gradient(135deg,var(--skxnz-maroon-deep),var(--skxnz-maroon),var(--skxnz-obsidian))] p-6 text-[var(--skxnz-text-light)] sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[rgba(255,254,250,0.72)]">
                Beta safety
              </p>
              <h2 className="mt-4 break-words font-display text-2xl uppercase leading-tight tracking-[0.04em] sm:text-3xl">
                Demo account area.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[rgba(255,254,250,0.78)]">
                Saved locally for now. Persistent account sync, real login, and
                production user data storage are coming later.
              </p>
            </div>
          </div>
        </Card>

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Account navigation">
          {accountNav.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center rounded-full border px-5 text-xs font-bold uppercase tracking-[0.14em] transition",
                  isActive
                    ? "border-[rgba(34,211,238,0.28)] bg-[rgba(34,211,238,0.08)] text-sangria"
                    : "border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] text-stone hover:text-sangria",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="min-w-0">{children}</section>
          {aside ? <aside className="min-w-0">{aside}</aside> : null}
        </div>
      </main>
    </DemoRoleGate>
  );
}
