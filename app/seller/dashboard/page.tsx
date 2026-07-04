import Link from "next/link";

import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";
import { SellerProductTable } from "@/components/seller/seller-product-table";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSellerProductsWithRelations } from "@/lib/catalog/queries";

export default async function SellerDashboardPage() {
  const products = await getSellerProductsWithRelations();
  const pendingCount = products.filter(
    (product) => product.status === "PENDING_REVIEW",
  ).length;
  const activeCount = products.filter((product) => product.status === "ACTIVE").length;

  return (
    <SellerDashboardShell
      title="Seller control center"
      description="A read-only view of your seller-owned Supabase products. Creation, moderation, orders, payouts, and analytics stay separate until their backend steps are connected."
      actions={
        <>
          <Link
            href="/seller/products"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            Products
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
        <div className="grid gap-4 sm:grid-cols-3">
          <SellerMetricCard
            label="Seller products"
            value={products.length.toString()}
            detail="Rows owned by the current seller account in Supabase."
          />
          <SellerMetricCard
            label="Pending review"
            value={pendingCount.toString()}
            detail="Products waiting for admin moderation."
          />
          <SellerMetricCard
            label="Active"
            value={activeCount.toString()}
            detail="Products approved for buyer visibility."
          />
        </div>

        <SellerProductTable liveProducts={products} />
      </div>
    </SellerDashboardShell>
  );
}

function SellerMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="min-w-0 rounded-[30px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-card)] p-5 shadow-[0_16px_40px_rgba(58,8,24,0.06)]">
      <p className="line-clamp-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-stone">
        {label}
      </p>
      <p className="mt-3 truncate text-2xl font-black text-sangria">{value}</p>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-stone">{detail}</p>
    </Card>
  );
}
