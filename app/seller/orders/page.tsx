import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/roles";
import { formatInrFromPaise } from "@/lib/money";
import { getSellerOrderLines } from "@/lib/orders/read-seller-orders";

// Seller order queue (D4-6). Server component: reads ONLY order lines whose
// product belongs to the authenticated seller, and only on post-payment
// orders (D4-2 RLS). Sellers cannot read the orders table, so no buyer
// name, contact, address, or order totals appear here — line snapshots only.
// No courier, ETA, pickup, or tracking copy: none of that exists.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Seller Orders — SKXNZ",
  description: "Order lines for your SKXNZ products.",
};

function formatLineDate(iso: string): string {
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
  const result = await getSellerOrderLines();

  return (
    <SellerDashboardShell
      eyebrow="Seller orders"
      title="Order lines for your products."
      description="Only real order lines for your own products appear here, and only after an order is past payment. Draft carts are never shown. Payment capture, dispatch automation, and delivery tracking are not connected yet."
    >
      {!result.backendReady ? (
        <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
          <p className="text-sm font-semibold text-midnightbrown">
            Order backend is not connected yet.
          </p>
          <p className="mt-2 text-sm leading-7 text-stone">
            The order database has not been switched on for this environment,
            so there are no order lines to read. Nothing has been lost — no
            orders exist yet.
          </p>
        </Card>
      ) : result.lines.length === 0 ? (
        <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
          <p className="text-sm font-semibold text-midnightbrown">
            No seller orders yet.
          </p>
          <p className="mt-2 text-sm leading-7 text-stone">
            Order lines appear here once buyers place real paid orders for
            your products. SKXNZ does not show demo or placeholder orders.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {result.lines.map((line) => (
            <Card
              key={line.id}
              className="section-border rounded-[24px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
                    Order {line.orderId.slice(0, 8).toUpperCase()} · Post-payment
                  </p>
                  {line.brandSnapshot ? (
                    <p className="mt-2 text-[0.64rem] uppercase tracking-[0.16em] text-stone">
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
                      formatLineDate(line.createdAt),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
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
            </Card>
          ))}
        </div>
      )}
    </SellerDashboardShell>
  );
}
