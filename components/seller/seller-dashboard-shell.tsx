"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { Badge } from "@/components/ui/badge";
import { sellerSidebarLinks } from "@/lib/data/site-content";
import { cn } from "@/lib/cn";

type SellerDashboardShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function SellerDashboardShell({
  eyebrow = "Seller Dashboard Beta",
  title,
  description,
  children,
  actions,
}: SellerDashboardShellProps) {
  const pathname = usePathname();

  return (
    <DemoRoleGate
      allowedRoles={["seller", "admin"]}
      areaLabel="Seller dashboard"
      helperText="Seller dashboard routes are server role-gated for SELLER and ADMIN accounts. Product list and creation are live; verification, payouts, and order tools are not connected yet."
    >
      <main className="min-h-screen bg-[var(--skxnz-bg)] px-4 py-8 text-midnightbrown sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="h-fit rounded-[26px] border border-[rgba(255,254,250,0.12)] bg-[linear-gradient(145deg,rgba(16,0,6,0.98),rgba(58,8,24,0.94))] p-3 text-[var(--skxnz-text-light)] shadow-[0_18px_48px_rgba(42,6,19,0.16)] lg:sticky lg:top-28">
            <div className="rounded-[20px] border border-white/10 bg-white/[0.06] p-4">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-white/58">
                SKXNZ Seller
              </p>
              <h2 className="mt-2 text-xl font-semibold uppercase leading-none tracking-[0.06em]">
                Control
              </h2>
              <p className="mt-2 text-xs leading-5 text-white/64">
                Beta workspace. Live where connected.
              </p>
            </div>

            <nav className="mt-3 grid gap-2">
              {sellerSidebarLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/seller" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "group min-w-0 rounded-[18px] border px-3 py-2.5 transition",
                      isActive
                        ? "border-[rgba(34,211,238,0.32)] bg-white/[0.12] text-white shadow-[0_0_28px_rgba(34,211,238,0.08)]"
                        : "border-white/10 bg-white/[0.04] text-white/72 hover:border-white/20 hover:bg-white/[0.08] hover:text-white",
                    )}
                  >
                    <span className="block truncate text-xs font-bold uppercase tracking-[0.08em]">
                      {link.label}
                    </span>
                    <span className="mt-1 line-clamp-1 block text-xs leading-5 opacity-70">
                      {link.description}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0">
            <div className="rounded-[28px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5 shadow-[0_16px_44px_rgba(58,8,24,0.07)] sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <Badge>{eyebrow}</Badge>
                  <h1 className="mt-3 break-words font-display text-[2rem] font-semibold uppercase leading-[1] tracking-[-0.02em] text-midnightbrown sm:text-4xl">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-stone">
                    {description}
                  </p>
                </div>
                {actions ? (
                  <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                    {actions}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 min-w-0">{children}</div>
          </section>
        </div>
      </main>
    </DemoRoleGate>
  );
}
