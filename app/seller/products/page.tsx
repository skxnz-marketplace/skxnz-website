import Link from "next/link";

import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";
import { SellerProductTable } from "@/components/seller/seller-product-table";
import { buttonVariants } from "@/components/ui/button";
import { getSellerProductsWithRelations } from "@/lib/catalog/queries";

export default async function SellerProductsPage() {
  const products = await getSellerProductsWithRelations();

  return (
    <SellerDashboardShell
      eyebrow="Seller products"
      title="Products and review queue"
      description="Your live Supabase products. New products are submitted as PENDING_REVIEW and appear publicly after admin approval."
      actions={
        <Link
          href="/seller/products/new"
          className={buttonVariants({ variant: "primary", size: "lg" })}
        >
          Add Product
        </Link>
      }
    >
      <SellerProductTable liveProducts={products} />
    </SellerDashboardShell>
  );
}
