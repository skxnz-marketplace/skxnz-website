import Link from "next/link";

import { SellerAiToolsPreview } from "@/components/seller/seller-ai-tools-preview";
import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";
import { SellerProductTable } from "@/components/seller/seller-product-table";
import { SellerStatsCards } from "@/components/seller/seller-stats-cards";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SellerDashboardPage() {
  return (
    <SellerDashboardShell
      title="Seller control center"
      description="A beta workspace for demo listings, order visibility, analytics previews, and future seller tools."
      actions={
        <>
          <Link
            href="/seller/products"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            Add Product Demo
          </Link>
          <Link
            href="/sell"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Seller Application
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <SellerStatsCards />

        <Card className="rounded-[34px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5 shadow-[0_18px_55px_rgba(58,8,24,0.07)] sm:p-7">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="min-w-0">
              <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-stone">
                Seller status
              </p>
              <h2 className="mt-3 font-display text-3xl uppercase tracking-[0.08em] text-midnightbrown">
                Demo Seller
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone">
                Seller Dashboard Beta is available for internal workflow testing.
                Product approval, payouts, seller verification, and production login
                are not connected yet.
              </p>
            </div>
            <div className="rounded-[28px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.07)] p-5 text-sm leading-7 text-midnightbrown">
              <p className="font-black uppercase tracking-[0.16em] text-sangria">
                Internal review rule
              </p>
              <p className="mt-2 text-stone">
                New seller products stay in Pending internal review. Nothing is
                automatically pushed live to the buyer marketplace.
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[26px] bg-[var(--skxnz-surface)] p-5 shadow-[0_14px_42px_rgba(58,8,24,0.055)] ring-1 ring-[rgba(58,8,24,0.08)] sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="text-[0.64rem] font-black uppercase tracking-[0.14em] text-sangria">
                Visibility support
              </p>
              <h2 className="mt-2 text-xl font-semibold uppercase tracking-[-0.01em] text-midnightbrown">
                Promote your brand
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone">
                Featured visibility options are reviewed by SKXNZ. Payment collection is
                not live yet, and performance is not guaranteed.
              </p>
              <p className="mt-2 text-xs leading-5 text-stone">
                Promoted placements may influence featured suggestions when relevant.
                Organic relevance stays first.
              </p>
            </div>
            <Link
              href="/contact"
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              Request Support
            </Link>
          </div>
        </Card>

        <SellerProductTable />
        <SellerAiToolsPreview />
      </div>
    </SellerDashboardShell>
  );
}
