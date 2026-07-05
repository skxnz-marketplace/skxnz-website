import Link from "next/link";

import { ProductUploadForm } from "@/components/forms/product-upload-form";
import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getActiveBrandsDetail, getActiveCategoriesDetail } from "@/lib/catalog/queries";

import { createSellerProduct } from "./actions";

// Options must reflect the live catalog on every load.
export const dynamic = "force-dynamic";

export default async function NewSellerProductPage() {
  const [brandsResult, categoriesResult] = await Promise.all([
    getActiveBrandsDetail(),
    getActiveCategoriesDetail(),
  ]);

  const brandOptions = brandsResult.data.map((brand) => ({
    id: brand.id,
    name: brand.name,
  }));
  const categoryOptions = categoriesResult.data.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  // Distinguish "query failed" from "table is genuinely empty/inactive" so
  // the form never shows a silent, misleading empty state.
  const loadProblems: string[] = [];
  if (brandsResult.error) {
    loadProblems.push(`Brand query failed: ${brandsResult.error}`);
  } else if (brandOptions.length === 0) {
    loadProblems.push(
      "Brand query ran but returned 0 active brands — the connected Supabase project has no rows in public.brands with is_active = true.",
    );
  }
  if (categoriesResult.error) {
    loadProblems.push(`Category query failed: ${categoriesResult.error}`);
  } else if (categoryOptions.length === 0) {
    loadProblems.push(
      "Category query ran but returned 0 active categories — the connected Supabase project has no rows in public.categories with is_active = true.",
    );
  }

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
          PENDING_REVIEW. For this V1 QA flow, SKXNZ assigns the first active
          brand/category automatically when none is selected. Brand-specific
          seller assignment will be added later.
        </Card>
        {loadProblems.length > 0 && (
          <Card className="section-border rounded-[28px] border-sangria/30 bg-sangria/10 p-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-sangria">
              Catalog options could not be loaded
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-midnightbrown">
              {loadProblems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-6 text-midnightbrown/80">
              Product submission needs at least one active brand and category.
              Fix the catalog data in Supabase, then reload this page.
            </p>
          </Card>
        )}
        <ProductUploadForm
          brands={brandOptions}
          categories={categoryOptions}
          action={createSellerProduct}
        />
      </div>
    </SellerDashboardShell>
  );
}
