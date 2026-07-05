import Link from "next/link";
import type { ReactNode } from "react";

import { updateProductModerationStatus } from "@/app/admin/products/actions";
import { StatusBadge } from "@/components/sections/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProductStatus, ProductWithRelations } from "@/lib/catalog/types";
import { formatCurrency } from "@/lib/data/orders";

const REVIEW_STATUSES = ["PENDING_REVIEW", "ACTIVE", "REJECTED", "ARCHIVED"] satisfies ProductStatus[];

type ReviewSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  products: ProductWithRelations[];
};

function getStock(product: ProductWithRelations) {
  return product.variants.reduce(
    (total, variant) => total + variant.stock_quantity,
    0,
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function ModerationButton({
  productId,
  status,
  children,
  variant,
  disabled,
}: {
  productId: string;
  status: "ACTIVE" | "REJECTED" | "ARCHIVED";
  children: ReactNode;
  variant: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}) {
  return (
    <form action={updateProductModerationStatus}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        disabled={disabled}
        className={buttonVariants({
          variant,
          size: "sm",
          className: disabled ? "pointer-events-none opacity-50" : undefined,
        })}
      >
        {children}
      </button>
    </form>
  );
}

function ReviewSection({
  eyebrow,
  title,
  description,
  products,
}: ReviewSectionProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        title={`${title} is empty.`}
        description={description}
      />
    );
  }

  return (
    <Card className="section-border rounded-[36px] p-0">
      <div className="border-b border-white/10 p-6 sm:p-8">
        <Badge>{eyebrow}</Badge>
        <h2 className="mt-5 text-wrap-safe break-words font-display text-2xl uppercase leading-tight tracking-[0.12em] text-pearl">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-wrap-safe break-words text-sm leading-7 text-silver">
          {description}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] divide-y divide-white/10">
          <thead>
            <tr className="text-left">
              {["Product", "Seller", "Category", "Price", "Stock", "Status", "Updated", "Actions"].map(
                (column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap px-6 py-4 text-[0.68rem] uppercase tracking-[0.22em] text-silver sm:px-8"
                  >
                    {column}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {products.map((product) => (
              <tr
                key={product.id}
                className="align-top transition hover:bg-white/[0.03]"
              >
                <td className="max-w-[18rem] px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  <p className="line-clamp-2 min-w-0 break-words font-display text-base uppercase leading-tight tracking-[0.12em] text-pearl">
                    {product.name}
                  </p>
                  <p className="mt-2 line-clamp-2 min-w-0 max-w-sm break-words text-sm leading-6 text-silver">
                    {product.subtitle ?? product.description ?? "No product summary yet."}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  {product.seller_id ?? "No seller id"}
                </td>
                <td className="px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  {product.category?.name ?? "Unassigned"}
                </td>
                <td className="px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  <p>{formatCurrency(product.price_inr)}</p>
                  {product.compare_at_price_inr ? (
                    <p className="mt-1 line-through text-silver/70">
                      {formatCurrency(product.compare_at_price_inr)}
                    </p>
                  ) : null}
                </td>
                <td className="px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  {getStock(product)}
                </td>
                <td className="px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  <StatusBadge label={product.status} />
                </td>
                <td className="px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  {formatDate(product.updated_at)}
                </td>
                <td className="max-w-[18rem] px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  <div className="flex min-w-[240px] max-w-[18rem] flex-wrap gap-2">
                    <ModerationButton
                      productId={product.id}
                      status="ACTIVE"
                      variant="primary"
                      disabled={product.status === "ACTIVE"}
                    >
                      Approve
                    </ModerationButton>
                    <ModerationButton
                      productId={product.id}
                      status="REJECTED"
                      variant="secondary"
                      disabled={product.status === "REJECTED"}
                    >
                      Reject
                    </ModerationButton>
                    <ModerationButton
                      productId={product.id}
                      status="ARCHIVED"
                      variant="ghost"
                      disabled={product.status === "ARCHIVED"}
                    >
                      Archive
                    </ModerationButton>
                    <Link
                      href={`/product/${product.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      View Details
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

type AdminProductReviewPanelProps = {
  products: ProductWithRelations[];
};

export function AdminProductReviewPanel({ products }: AdminProductReviewPanelProps) {
  const productsByStatus = new Map<ProductStatus, ProductWithRelations[]>(
    REVIEW_STATUSES.map((status) => [
      status,
      products.filter((product) => product.status === status),
    ]),
  );
  const pendingProducts = productsByStatus.get("PENDING_REVIEW") ?? [];
  const activeProducts = productsByStatus.get("ACTIVE") ?? [];
  const rejectedProducts = productsByStatus.get("REJECTED") ?? [];
  const archivedProducts = productsByStatus.get("ARCHIVED") ?? [];

  return (
    <div className="space-y-6">
      <Card className="section-border rounded-[32px] border-teal/20 bg-teal/10 p-6 text-sm leading-7 text-silver break-words">
        Live Supabase approval flow. Admin decisions here update product status
        server-side; buyers only see rows after status becomes ACTIVE.
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Pending Review", value: pendingProducts.length.toString().padStart(2, "0") },
          { label: "Active", value: activeProducts.length.toString().padStart(2, "0") },
          { label: "Rejected Review", value: rejectedProducts.length.toString().padStart(2, "0") },
          { label: "Archived", value: archivedProducts.length.toString().padStart(2, "0") },
        ].map((item) => (
          <Card key={item.label} className="section-border rounded-[28px] p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
              {item.label}
            </p>
            <p className="mt-4 break-words font-display text-3xl uppercase leading-tight tracking-[0.12em] text-pearl">
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <ReviewSection
        eyebrow="Pending Queue"
        title="Pending products"
        description="Seller submissions land here first so admin review can decide whether they become buyer-visible."
        products={pendingProducts}
      />

      <ReviewSection
        eyebrow="Active Catalog"
        title="Active products"
        description="ACTIVE products are the only seller-created products that can appear in buyer catalogue queries."
        products={activeProducts}
      />

      <ReviewSection
        eyebrow="Rejected Queue"
        title="Rejected products"
        description="Rejected items remain visible for copy review and future seller revisions."
        products={rejectedProducts}
      />

      <ReviewSection
        eyebrow="Archived Catalog"
        title="Archived products"
        description="Archived items are hidden from buyers but retained for admin history."
        products={archivedProducts}
      />
    </div>
  );
}
