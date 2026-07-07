import Link from "next/link";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/roles";
import { adminSidebarLinks } from "@/lib/data/site-content";
import { formatInrFromPaise } from "@/lib/money";
import { describeOrderStatus } from "@/lib/orders/read-buyer-orders";
import { getAdminOrders } from "@/lib/orders/read-admin-orders";

// Admin order queue (D4-6). Server component behind requireRole(["ADMIN"])
// (role from public.users.role) + admin RLS on the query itself. Lists ALL
// real orders — no demo rows, no fake payment/courier data. Replaces the
// old mock AdminOrdersPanel on this route.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Orders — SKXNZ",
  description: "Internal order queue.",
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

export default async function AdminOrdersPage() {
  await requireRole(["ADMIN"], "/admin/orders");
  const result = await getAdminOrders();

  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin order management"
      helperText="Admin order visibility is role-protected. It lists only real internal orders — payments and delivery systems are not connected yet."
    >
      <DashboardShell
        eyebrow="Order Management"
        title="Real internal orders only."
        description="Every row below is a real order created by a buyer. Draft orders are marked unpaid. Payment capture and delivery are not connected, so no payment or courier data is shown unless it truly exists."
        actions={
          <>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/returns"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Returns
            </Link>
          </>
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
              so there are no orders to read. Nothing has been lost — no
              orders exist yet.
            </p>
          </Card>
        ) : result.orders.length === 0 ? (
          <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
            <p className="text-sm font-semibold text-midnightbrown">
              No orders yet.
            </p>
            <p className="mt-2 text-sm leading-7 text-stone">
              Orders appear here once buyers create them. SKXNZ does not show
              demo or placeholder orders.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {result.orders.map((order) => {
              const status = describeOrderStatus(order.status);
              return (
                <Card
                  key={order.id}
                  className="section-border rounded-[24px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
                        Order {order.id.slice(0, 8).toUpperCase()} · Buyer{" "}
                        {order.buyerId.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-midnightbrown">
                        {status.label}
                      </p>
                      <p className="mt-1 text-xs text-stone">
                        Created {formatOrderDate(order.createdAt)}
                        {order.itemCount > 0
                          ? ` · ${order.itemCount} item${order.itemCount === 1 ? "" : "s"}`
                          : ""}
                        {order.paymentProvider
                          ? ` · Payment: ${order.paymentProvider}`
                          : " · No payment record"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-midnightbrown">
                        {formatInrFromPaise(order.totalPaise ?? order.subtotalPaise)}
                      </p>
                      <p className="mt-1 text-xs text-stone">
                        {order.totalPaise !== null ? "Total" : "Subtotal only"}
                      </p>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-3 inline-flex`}
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </DashboardShell>
    </DemoRoleGate>
  );
}
