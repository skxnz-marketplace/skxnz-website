import Link from "next/link";

import { ProductUploadForm } from "@/components/forms/product-upload-form";
import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getActiveBrands, getActiveCategories } from "@/lib/catalog/queries";

import { createSellerProduct } from "./actions";

export default async function NewSellerProductPage() {
  const [brands, categories] = await Promise.all([
    getActiveBrands(),
    getActiveCategories(),
  ]);

  const brandOptions = brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
  }));
  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  return (
    <SellerDashboardShell
      eyebrow="Seller product create"
      title="Submit a product for review"
      description="Create a real Supabase seller product. New submissions are saved as PENDING_REVIEW and stay hidden from buyers until admin approval."
      actions={
        <Link
          href="/seller/products"
          className={buttonVariants({ variant: "secondary" })}
        >
          Back To Products
        </Link>
      }
    >
      <div className="space-y-6">
        <Card className="section-border rounded-[28px] p-5 text-sm leading-6 text-stone">
          This page writes to the live catalog through Supabase RLS. The server
          sets the current seller as owner and forces the product status to
          PENDING_REVIEW.
        </Card>
        <ProductUploadForm
          brands={brandOptions}
          categories={categoryOptions}
          action={createSellerProduct}
        />
      </div>
    </SellerDashboardShell>
  );
}
