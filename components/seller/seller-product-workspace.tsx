"use client";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { ProductUploadForm } from "@/components/forms/product-upload-form";
import { ProductGrid } from "@/components/shared/product-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function SellerProductWorkspace() {
  const {
    approvedProducts,
    pendingReviewProducts,
    rejectedProducts,
    draftProducts,
  } = useMarketplace();

  return (
    <div className="space-y-6">
      <ProductUploadForm />

      <Card className="section-border rounded-[32px] p-6 sm:p-8">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
          Seller Flow Status
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Badge>{pendingReviewProducts.length} pending review</Badge>
          <Badge>{approvedProducts.length} approved preview</Badge>
          <Badge>{rejectedProducts.length} rejected</Badge>
          <Badge>{draftProducts.length} draft placeholder</Badge>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-silver">
          Seller submissions update the browser-local catalog only. The Phase 1 AI
          validator checks missing fields, taxonomy fit, duplicate risk, and publish
          readiness before the draft moves into admin review.
        </p>
      </Card>

      <Card className="section-border rounded-[32px] p-6 sm:p-8">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
          Pending Review
        </p>
        <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
          Products currently waiting for SKXNZ admin review.
        </h2>
        <div className="mt-6">
          <ProductGrid
            products={pendingReviewProducts}
            emptyTitle="No pending submissions right now."
            emptyDescription="Submit a new product above to push it into the mock admin review queue."
          />
        </div>
      </Card>

      <Card className="section-border rounded-[32px] p-6 sm:p-8">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
          Approved Preview
        </p>
        <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
          Buyer-visible products in the current marketplace preview.
        </h2>
        <div className="mt-6">
          <ProductGrid
            products={approvedProducts}
            emptyTitle="No approved products yet."
            emptyDescription="Approve products from the admin queue to make them visible in the buyer shop."
          />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="section-border rounded-[32px] p-6 sm:p-8">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
            Needs Revision
          </p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
            Rejected products stay visible here for language review.
          </h2>
          <div className="mt-6">
            <ProductGrid
              products={rejectedProducts}
              emptyTitle="No rejected products yet."
              emptyDescription="Rejected review states will appear here if the admin queue sends a product back."
            />
          </div>
        </Card>

        {draftProducts.length > 0 ? (
          <Card className="section-border rounded-[32px] p-6 sm:p-8">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
              Draft Placeholder
            </p>
            <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
              Seed drafts still outside the live review queue.
            </h2>
            <div className="mt-6">
              <ProductGrid
                products={draftProducts}
                emptyTitle="No draft placeholders left."
                emptyDescription="This area is reserved for pre-submission seller drafts."
              />
            </div>
          </Card>
        ) : (
          <EmptyState
            title="No draft placeholders right now."
            description="The seller workspace is currently focused on submitted and reviewed products."
          />
        )}
      </div>
    </div>
  );
}
