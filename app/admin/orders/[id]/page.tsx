import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminOrderStatusPanel } from "@/components/admin/admin-order-status-panel";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/roles";
import { adminSidebarLinks } from "@/lib/data/site-content";
import { formatInrFromPaise } from "@/lib/money";
import { describeOrderStatus } from "@/lib/orders/read-buyer-orders";
import { getAdminOrderById } from "@/lib/orders/read-admin-orders";

// Admin order detail (D4-6, extended D4-A). requireRole(["ADMIN"]) + admin
// RLS. Shows the real order, its items with seller ownership + line-level
// fulfilment state (0009 when applied), return requests, the order_events
// audit trail, and validated status transitions. No fake payment, courier,
// or tracking data; -> PAID / -> REFUNDED unreachable from the UI.

const FULFILMENT_LABEL: Record<string, string> = {
  PENDING: "Awaiting seller action",
  ACCEPTED: "Accepted — preparing",
  PACKED: "Packed",
  HANDED_TO_DELIVERY: "Handed to delivery",
};

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

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
                Order status actions
              </p>
              <p className="mt-2 text-xs leading-6 text-stone">
                Paid and Refunded can never be set here — they come only from
                a signature-verified payment webhook or a provider-confirmed
                refund. Every transition writes an audit event.
              </p>
              <div className="mt-3">
                <AdminOrderStatusPanel
                  orderId={result.order.id}
                  currentStatus={result.order.status}
                />
              </div>
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
                      <div className="min-w-0">
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
                        <p className="mt-1 text-xs text-stone">
                          Seller{" "}
                          {item.sellerId
                            ? item.sellerId.slice(0, 8).toUpperCase()
                            : "unassigned"}
                          {item.fulfilmentStatus
                            ? ` · ${FULFILMENT_LABEL[item.fulfilmentStatus] ?? formatEnum(item.fulfilmentStatus)}`
                            : " · Line fulfilment tracking not enabled in this environment"}
                        </p>
                        {item.fulfilmentNote ? (
                          <p className="mt-1 text-xs leading-5 text-stone">
                            Seller note: {item.fulfilmentNote}
                          </p>
                        ) : null}
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

            {result.order.returnRequests.length > 0 ? (
              <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
                  Return requests on this order
                </p>
                <div className="mt-2 divide-y divide-[rgba(58,8,24,0.08)]">
                  {result.order.returnRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-midnightbrown">
                          {formatEnum(request.status)} ·{" "}
                          {request.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="mt-1 text-xs text-stone">
                          {request.reason} · {formatDateTime(request.createdAt)}
                        </p>
                      </div>
                      <Link
                        href={`/admin/returns/${request.id}`}
                        className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sangria underline-offset-2 hover:underline"
                      >
                        Open return
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {result.order.lineEvents.length > 0 ? (
              <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
                  Seller fulfilment history (order_item_events)
                </p>
                <div className="mt-2 divide-y divide-[rgba(58,8,24,0.08)]">
                  {result.order.lineEvents.map((event) => (
                    <div key={event.id} className="py-3">
                      <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-stone">
                        {formatEnum(event.eventType)} ·{" "}
                        {formatDateTime(event.createdAt)}
                        {event.fromStatus && event.toStatus
                          ? ` · ${formatEnum(event.fromStatus)} → ${formatEnum(event.toStatus)}`
                          : null}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-midnightbrown">
                        {event.message}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-stone">
                  Seller line state is owned by the seller workflow — admin
                  visibility is read-only here. No silent admin override
                  exists.
                </p>
              </Card>
            ) : null}

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
