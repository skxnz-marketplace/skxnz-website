"use client";

import Link from "next/link";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { StatusBadge } from "@/components/sections/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SellerOnboardingStatusCard() {
  const { latestSellerApplication } = useMarketplace();

  return (
    <Card className="section-border rounded-[32px] p-6">
      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
        Onboarding Status
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <StatusBadge
          label={latestSellerApplication?.status ?? "Pending Review"}
        />
        <span className="text-sm leading-6 text-silver">
          Latest application in this browser-local MVP queue
        </span>
      </div>
      <div className="mt-5 space-y-4 text-sm leading-6 text-silver">
        <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4">
          <p className="text-pearl">
            Application: {latestSellerApplication?.status ?? "Pending Review"}
          </p>
          <p className="mt-2">
            {latestSellerApplication
              ? `${latestSellerApplication.storeName} was submitted ${latestSellerApplication.submittedAt}.`
              : "No seller application has been submitted in this browser yet."}
          </p>
        </div>
        <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4">
          Product approval is still required before products appear in the buyer
          shop.
        </div>
        <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4">
          Payments and payouts are not connected in MVP mode.
        </div>
        <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4">
          Real seller login is not connected yet, so this dashboard remains a safe
          demo workspace only.
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/sell"
          className={buttonVariants({ variant: "secondary", size: "lg" })}
        >
          Review Seller Application
        </Link>
        <Link
          href="/seller/products"
          className={buttonVariants({ variant: "ghost", size: "lg" })}
        >
          Product Workspace
        </Link>
      </div>
    </Card>
  );
}
