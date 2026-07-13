import Link from "next/link";

import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/roles";
import { formatInrFromPaise } from "@/lib/money";
import {
  describeSellerFulfilment,
  getSellerOrders,
} from "@/lib/orders/read-seller-orders";

// D3-A seller order queue. Server component. Reads ONLY orders the
// authenticated seller has lines in (post-payment only via RLS). The
// list is grouped one-row-per-order so the seller can open the detail
// and fulfil their own lines; the parent order row itself is not
// readable by sellers (no buyer identity leak).

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Seller Orders — SKXNZ",
  description: "Orders containing your SKXNZ products.",
};

function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function SellerOrdersPage() {
  await requireRole(["SELLER", "ADMIN"], "/seller/orders");
  const result = await getSellerOrders();

  return (
    <SellerDashboardShell
      eyebrow="Seller orders"
      title="Orders containing your products."
      description="Only paid orders with your own product lines appear here. Draft carts and other sellers' lines are never shown. Payment capture, refunds, courier assignment, and delivery tracking are not connected yet — you fulfil the lines you own; the marketplace runs the rest."
    >
      {!result.backendReady ? (
        <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
          <p className="text-sm font-semibold text-midnightbrown">
            Order backend is not connected yet.
          </p>
          <p className="mt-2 text-sm leading-7 text-stone">
            The order database has not been switched on for this environment,
            so there are no orders to show. Nothing has been lost — no orders
            exist yet.
          </p>
        </Card>
      ) : result.orders.length === 0 ? (
        <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
          <p className="text-sm font-semibold text-midnightbrown">
            No seller orders yet.
          </p>
          <p className="mt-2 text-sm leading-7 text-stone">
            Orders appear here once buyers place real paid orders containing
            your products. SKXNZ does not show demo or placeholder orders.
          </p>
        </Card>
      ) : (
        <>
          {!result.fulfilmentReady ? (
            <Card className="section-border mb-4 rounded-[22px] border-[rgba(58,8,24,0.14)] bg-[var(--skxnz-surface)] p-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sangria">
                Read-only view
              </p>
              <p className="mt-2 text-sm leading-6 text-stone">
                Line-level fulfilment actions are not enabled in this
                environment yet. You can review your orders here; accept /
                pack / hand-to-delivery buttons will appear after the seller
                fulfilment database migration is applied.
              </p>
            </Card>
          ) : null}

          <div className="space-y-3">
            {result.orders.map((order) => {
              const status = describeSellerFulfilment(
                order.aggregateFulfilmentStatus,
              );
              return (
                <Card
                  key={order.orderId}
                  className="section-border rounded-[24px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
                        Order {order.orderId.slice(0, 8).toUpperCase()} · Paid
                      </p>
                      <p className="mt-2 text-sm font-semibold text-midnightbrown">
                        {order.lineCount === 1
                          ? "1 line"
                          : `${order.lineCount} lines`}{" "}
                        · {order.quantityTotal} unit
                        {order.quantityTotal === 1 ? "" : "s"}
                      </p>
                      <p className="mt-1 text-xs text-stone">
                        {formatOrderDate(order.earliestCreatedAt)}
                        {order.earliestCreatedAt !== order.latestCreatedAt
                          ? ` · updated ${formatOrderDate(order.latestCreatedAt)}`
                          : null}
                      </p>
                      <p className="mt-3 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-midnightbrown">
                        {status.label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-stone">
                        {status.note}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-midnightbrown">
                        {formatInrFromPaise(order.sellerSubtotalPaise)}
                      </p>
                      <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-stone">
                        Your lines only
                      </p>
                      <Link
                        href={`/seller/orders/${order.orderId}`}
                        className="mt-3 inline-block rounded-full border border-[rgba(58,8,24,0.16)] bg-[var(--skxnz-bg)] px-4 py-2 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-midnightbrown transition hover:border-sangria hover:text-sangria"
                      >
                        Open order
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </SellerDashboardShell>
  );
}
