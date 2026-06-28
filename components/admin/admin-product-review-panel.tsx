"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { StatusBadge } from "@/components/sections/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatProductPrice, type Product } from "@/lib/data/products";

type ReviewSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  products: Product[];
  onApprove: (productId: string) => void;
  onReject: (productId: string) => void;
  featuredProductIds: string[];
  limitedProductIds: string[];
  onToggleFeatured: (productId: string) => void;
  onToggleLimited: (productId: string) => void;
};

function ReviewSection({
  eyebrow,
  title,
  description,
  products,
  onApprove,
  onReject,
  featuredProductIds,
  limitedProductIds,
  onToggleFeatured,
  onToggleLimited,
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
        <p className="mt-3 max-w-3xl text-wrap-safe break-words text-sm leading-7 text-silver">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] divide-y divide-white/10">
          <thead>
            <tr className="text-left">
              {["Product", "Seller", "Category", "Price", "Status", "Demo Signals", "Submitted", "Actions"].map(
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
                    {product.fabric} · {product.fit}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  {product.seller}
                </td>
                <td className="px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  {product.category}
                </td>
                <td className="px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  <p>{formatProductPrice(product.salePrice ?? product.price)}</p>
                  {product.salePrice ? (
                    <p className="mt-1 line-through text-silver/70">
                      {formatProductPrice(product.price)}
                    </p>
                  ) : null}
                </td>
                <td className="px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  <StatusBadge label={product.status} />
                </td>
                <td className="px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  <div className="flex min-w-[12rem] flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleFeatured(product.id)}
                      className={buttonVariants({
                        variant: featuredProductIds.includes(product.id)
                          ? "secondary"
                          : "ghost",
                        size: "sm",
                      })}
                    >
                      Featured Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleLimited(product.id)}
                      className={buttonVariants({
                        variant: limitedProductIds.includes(product.id)
                          ? "secondary"
                          : "ghost",
                        size: "sm",
                      })}
                    >
                      Limited Demo
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  {product.submittedAt}
                </td>
                <td className="max-w-[18rem] px-6 py-4 text-sm leading-6 text-silver sm:px-8">
                  <div className="flex min-w-[240px] max-w-[18rem] flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onApprove(product.id)}
                      className={buttonVariants({ variant: "primary", size: "sm" })}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => onReject(product.id)}
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                    >
                      Reject
                    </button>
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

export function AdminProductReviewPanel() {
  const {
    approvedProducts,
    pendingReviewProducts,
    rejectedProducts,
    draftProducts,
    updateProductStatus,
  } = useMarketplace();
  const initialFeaturedIds = useMemo(
    () =>
      approvedProducts
        .filter((product) =>
          [...product.tags, ...product.collections]
            .join(" ")
            .toLowerCase()
            .includes("featured"),
        )
        .map((product) => product.id),
    [approvedProducts],
  );
  const initialLimitedIds = useMemo(
    () =>
      approvedProducts
        .filter((product) =>
          [...product.tags, ...product.collections]
            .join(" ")
            .toLowerCase()
            .includes("limited"),
        )
        .map((product) => product.id),
    [approvedProducts],
  );
  const [featuredProductIds, setFeaturedProductIds] = useState(initialFeaturedIds);
  const [limitedProductIds, setLimitedProductIds] = useState(initialLimitedIds);

  function toggleId(productId: string, currentIds: string[]) {
    return currentIds.includes(productId)
      ? currentIds.filter((currentId) => currentId !== productId)
      : [productId, ...currentIds];
  }

  return (
    <div className="space-y-6">
      <Card className="section-border rounded-[32px] border-sangria/20 bg-sangria/10 p-6 text-sm leading-7 text-silver break-words">
        MVP placeholder — real database approval not connected yet. Featured and
        limited edition toggles below are UI/demo controls only and do not update
        production catalog flags.
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Pending Review", value: pendingReviewProducts.length.toString().padStart(2, "0") },
          { label: "Approved Preview", value: approvedProducts.length.toString().padStart(2, "0") },
          { label: "Rejected Review", value: rejectedProducts.length.toString().padStart(2, "0") },
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
        products={pendingReviewProducts}
        onApprove={(productId) => updateProductStatus(productId, "Approved Preview")}
        onReject={(productId) => updateProductStatus(productId, "Rejected Review")}
        featuredProductIds={featuredProductIds}
        limitedProductIds={limitedProductIds}
        onToggleFeatured={(productId) =>
          setFeaturedProductIds((currentIds) => toggleId(productId, currentIds))
        }
        onToggleLimited={(productId) =>
          setLimitedProductIds((currentIds) => toggleId(productId, currentIds))
        }
      />

      <ReviewSection
        eyebrow="Approved Queue"
        title="Approved products"
        description="Only approved products appear in the buyer shop and cart flow."
        products={approvedProducts}
        onApprove={(productId) => updateProductStatus(productId, "Approved Preview")}
        onReject={(productId) => updateProductStatus(productId, "Rejected Review")}
        featuredProductIds={featuredProductIds}
        limitedProductIds={limitedProductIds}
        onToggleFeatured={(productId) =>
          setFeaturedProductIds((currentIds) => toggleId(productId, currentIds))
        }
        onToggleLimited={(productId) =>
          setLimitedProductIds((currentIds) => toggleId(productId, currentIds))
        }
      />

      <ReviewSection
        eyebrow="Rejected Queue"
        title="Rejected products"
        description="Rejected items remain visible for copy review and future seller revisions."
        products={rejectedProducts}
        onApprove={(productId) => updateProductStatus(productId, "Approved Preview")}
        onReject={(productId) => updateProductStatus(productId, "Rejected Review")}
        featuredProductIds={featuredProductIds}
        limitedProductIds={limitedProductIds}
        onToggleFeatured={(productId) =>
          setFeaturedProductIds((currentIds) => toggleId(productId, currentIds))
        }
        onToggleLimited={(productId) =>
          setLimitedProductIds((currentIds) => toggleId(productId, currentIds))
        }
      />

      {draftProducts.length > 0 ? (
        <ReviewSection
          eyebrow="Draft Placeholder"
          title="Draft placeholder products"
          description="These seed drafts are not buyer-visible yet and still sit outside the main review queue."
          products={draftProducts}
          onApprove={(productId) => updateProductStatus(productId, "Approved Preview")}
          onReject={(productId) => updateProductStatus(productId, "Rejected Review")}
          featuredProductIds={featuredProductIds}
          limitedProductIds={limitedProductIds}
          onToggleFeatured={(productId) =>
            setFeaturedProductIds((currentIds) => toggleId(productId, currentIds))
          }
          onToggleLimited={(productId) =>
            setLimitedProductIds((currentIds) => toggleId(productId, currentIds))
          }
        />
      ) : null}
    </div>
  );
}
