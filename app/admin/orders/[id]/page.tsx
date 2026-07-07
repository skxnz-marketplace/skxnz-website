import Link from "next/link";
import { notFound } from "next/navigation";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/roles";
import { adminSidebarLinks } from "@/lib/data/site-content";
import { formatInrFromPaise } from "@/lib/money";
import { describeOrderStatus } from "@/lib/orders/read-buyer-orders";
import { getAdminOrderById } from "@/lib/orders/read-admin-orders";

// Admin order detail (D4-6). requireRole(["ADMIN"]) + admin RLS. Shows the
// real order, its items, and the order_events audit trail — only events that
// actually exist. No fake payment, courier, or tracking data.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Order Detail — SKXNZ",
  description: "Internal order detail and audit history.",
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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"], "/admin/orders");
  const { id } = await params;
  const result = await getAdminOrderById(id);

  if (result.backendReady && !result.order) {
    notFound();
  }

  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin order detail"
      helperText="Admin order detail is role-protected and shows only real internal order data."
    >
      <DashboardShell
        eyebrow="Order Management"
        title="Order detail."
        description="Real order data and internal audit history only."
        actions={
          <Link
            href="/admin/orders"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            All Orders
          </Link>
        }
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/orders"
      >
        {!result.backendReady ? (
          <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
            <p className="text-sm font-semibold text-midnightbrown">
              Order backend is not connected yet.
            </p>
            <p className="mt-2 text-sm leading-7 text-stone">
              The commerce database has not been applied in this environment,
              so there is no order to read at this address.
            </p>
          </Card>
        ) : result.order ? (
          <div className="space-y-4">
            <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
                Order {result.order.id.slice(0, 8).toUpperCase()} · Buyer{" "}
                {result.order.buyerId.slice(0, 8).toUpperCase()}
              </p>
              <p className="mt-2 text-lg font-semibold text-midnightbrown">
                {describeOrderStatus(result.order.status).label}
              </p>
              <p className="mt-1 text-sm leading-7 text-stone">
                {describeOrderStatus(result.order.status).note}
              </p>
              <p className="mt-2 text-xs text-stone">
                Created {formatDateTime(result.order.createdAt)}
                {result.order.paymentProvider
                  ? ` · Payment: ${result.order.paymentProvider} (${result.order.paymentReference ?? "no reference"})`
                  : " · No payment record — no provider is connected"}
              </p>
              {result.order.deliveryNote ? (
                <p className="mt-2 text-xs leading-6 text-stone">
                  Delivery note: {result.order.deliveryNote}
                </p>
              ) : null}
            </Card>

            <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
                Items
              </p>
              <div className="mt-2 divide-y divide-[rgba(58,8,24,0.08)]">
                {result.order.items.length === 0 ? (
                  <p className="py-3 text-sm leading-7 text-stone">
                    No line items recorded for this order.
                  </p>
                ) : (
                  result.order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-start justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-midnightbrown">
                          {item.titleSnapshot}
                        </p>
                        <p className="mt-1 text-xs text-stone">
                          {[
                            item.brandSnapshot,
                            item.selectedSize ? `Size ${item.selectedSize}` : null,
                            item.selectedColor,
                            `Qty ${item.quantity}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-midnightbrown">
                          {formatInrFromPaise(item.lineTotalPaise)}
                        </p>
                        <p className="mt-1 text-xs text-stone">
                          {formatInrFromPaise(item.unitPricePaise)} each
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 space-y-1 border-t border-[rgba(58,8,24,0.12)] pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-stone">Subtotal</span>
                  <span className="font-semibold text-midnightbrown">
                    {formatInrFromPaise(result.order.subtotalPaise)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone">Delivery / Taxes / Total</span>
                  <span className="text-stone">
                    {result.order.totalPaise !== null
                      ? formatInrFromPaise(result.order.totalPaise)
                      : "Not computed — no live checkout yet"}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
                Audit history (order_events)
              </p>
              {result.order.events.length === 0 ? (
                <p className="mt-2 text-sm leading-7 text-stone">
                  No events recorded for this order yet.
                </p>
              ) : (
                <div className="mt-2 divide-y divide-[rgba(58,8,24,0.08)]">
                  {result.order.events.map((event) => (
                    <div key={event.id} className="py-3">
                      <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-stone">
                        {event.eventType} · {formatDateTime(event.createdAt)}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-midnightbrown">
                        {event.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : null}
      </DashboardShell>
    </DemoRoleGate>
  );
}
