import Link from "next/link";
import { notFound } from "next/navigation";

import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";
import { SellerLineActions } from "@/components/seller/seller-line-actions";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/roles";
import { formatInrFromPaise } from "@/lib/money";
import {
  describeSellerFulfilment,
  getSellerOrderById,
} from "@/lib/orders/read-seller-orders";

// D3-A seller order detail. Server component. Shows ONLY the seller's
// own lines on this order — cross-seller lines and buyer identity /
// address / totals are never fetched here (RLS blocks reads on
// public.orders for sellers by design). A missing / unrelated order id
// resolves to notFound() with no existence leak.

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SellerOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  await requireRole(["SELLER", "ADMIN"], `/seller/orders/${id}`);

  const result = await getSellerOrderById(id);

  if (!result.backendReady) {
    return (
      <SellerDashboardShell
        eyebrow="Seller order"
        title="Order detail"
        description="The commerce database is not connected in this environment yet."
      >
        <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
          <p className="text-sm font-semibold text-midnightbrown">
            Order backend is not connected yet.
          </p>
          <p className="mt-2 text-sm leading-7 text-stone">
            The order database has not been switched on for this environment,
            so this order detail cannot be loaded.
          </p>
        </Card>
      </SellerDashboardShell>
    );
  }

  if (!result.order) {
    // Cross-seller / cross-order / non-existent id — same response for all.
    notFound();
  }

  const order = result.order;
  const shortId = order.orderId.slice(0, 8).toUpperCase();

  return (
    <SellerDashboardShell
      eyebrow={`Order ${shortId}`}
      title="Fulfil your lines on this order."
      description="This view shows only your own lines on this order. Other sellers' lines, the buyer's identity, address, and payment details are never shown here — you fulfil what you own, the marketplace runs the rest."
      actions={
        <Link
          href="/seller/orders"
          className="inline-flex items-center justify-center rounded-full border border-[rgba(58,8,24,0.16)] bg-[var(--skxnz-bg)] px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-midnightbrown transition hover:border-sangria hover:text-sangria"
        >
          Back to orders
        </Link>
      }
    >
      <Card className="section-border mb-4 rounded-[24px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-sangria">
              Order reference
            </p>
            <p className="mt-1 text-sm font-semibold text-midnightbrown">
              {shortId}
            </p>
            <p className="mt-1 text-xs text-stone">
              First line seen {formatDateTime(order.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-sangria">
              Your lines total
            </p>
            <p className="mt-1 text-sm font-semibold text-midnightbrown">
              {formatInrFromPaise(order.sellerSubtotalPaise)}
            </p>
            <p className="mt-1 text-[0.6rem] uppercase tracking-[0.16em] text-stone">
              {order.lines.length} line
              {order.lines.length === 1 ? "" : "s"} · {order.quantityTotal}{" "}
              unit{order.quantityTotal === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-stone">
          Delivery address and buyer contact are handled by SKXNZ ops — they
          are not visible to sellers in this view. Payment, refunds, courier
          assignment, and tracking are not part of the seller workflow.
        </p>
      </Card>

      {!result.fulfilmentReady ? (
        <Card className="section-border mb-4 rounded-[22px] border-[rgba(58,8,24,0.14)] bg-[var(--skxnz-surface)] p-4">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sangria">
            Read-only view
          </p>
          <p className="mt-2 text-sm leading-6 text-stone">
            Line-level fulfilment actions are not enabled in this environment
            yet. You can review your lines below; accept / pack / hand-to-
            delivery buttons appear after the seller fulfilment database
            migration is applied.
          </p>
        </Card>
      ) : null}

      <div className="space-y-3">
        {order.lines.map((line) => {
          const status = describeSellerFulfilment(line.fulfilmentStatus);
          return (
            <Card
              key={line.id}
              className="section-border rounded-[24px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {line.brandSnapshot ? (
                    <p className="text-[0.6rem] uppercase tracking-[0.18em] text-stone">
                      {line.brandSnapshot}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm font-semibold text-midnightbrown">
                    {line.titleSnapshot}
                  </p>
                  <p className="mt-1 text-xs text-stone">
                    {[
                      line.selectedSize ? `Size ${line.selectedSize}` : null,
                      line.selectedColor ?? null,
                      `Qty ${line.quantity}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-3 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-midnightbrown">
                    {status.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-stone">
                    {status.note}
                  </p>
                  {result.returnVisibilityReady && line.activeReturn ? (
                    <p className="mt-3 rounded-lg border border-[rgba(58,8,24,0.14)] bg-[var(--skxnz-bg)] p-2 text-xs font-semibold leading-5 text-midnightbrown">
                      Active return: {line.activeReturn.status.replaceAll("_", " ").toLowerCase()} · requested quantity {line.activeReturn.quantity}
                    </p>
                  ) : null}
                  {line.fulfilmentNote ? (
                    <p className="mt-2 rounded-lg border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg)] p-2 text-xs leading-5 text-stone">
                      Note: {line.fulfilmentNote}
                    </p>
                  ) : null}
                  {line.fulfilmentUpdatedAt ? (
                    <p className="mt-1 text-[0.6rem] uppercase tracking-[0.14em] text-stone">
                      Last update {formatDateTime(line.fulfilmentUpdatedAt)}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-midnightbrown">
                    {formatInrFromPaise(line.lineTotalPaise)}
                  </p>
                  <p className="mt-1 text-xs text-stone">
                    {formatInrFromPaise(line.unitPricePaise)} each
                  </p>
                </div>
              </div>

              {result.fulfilmentReady ? (
                <SellerLineActions
                  orderItemId={line.id}
                  currentStatus={line.fulfilmentStatus}
                  existingNote={line.fulfilmentNote}
                />
              ) : null}
            </Card>
          );
        })}
      </div>
    </SellerDashboardShell>
  );
}
