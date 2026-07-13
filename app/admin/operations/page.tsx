import Link from "next/link";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/roles";
import { adminSidebarLinks } from "@/lib/data/site-content";
import { getAdminOperationsSummary } from "@/lib/orders/read-admin-operations";

// Admin operations overview (D4-A). Every number on this page comes from a
// real authenticated count query behind admin RLS — nothing is fabricated.
// No revenue figures are shown: totals are NULL until live checkout computes
// them, so no safe revenue derivation exists yet.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Operations — SKXNZ",
  description: "Live operational summary for orders, returns, and support.",
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

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default async function AdminOperationsPage() {
  await requireRole(["ADMIN"], "/admin/operations");
  const summary = await getAdminOperationsSummary();

  const tiles = [
    {
      label: "Orders needing attention",
      note: "Paid or fulfilling",
      value: summary.ordersNeedingAttention,
      href: "/admin/orders",
      cta: "Open orders",
    },
    {
      label: "Active returns",
      note: "Requested or in review",
      value: summary.activeReturns,
      href: "/admin/returns",
      cta: "Open returns",
    },
    {
      label: "Open support tickets",
      note: "Open, in review, or waiting",
      value: summary.openTickets,
      href: "/admin/support",
      cta: "Open support",
    },
    {
      label: "Seller lines awaiting action",
      note: summary.fulfilmentReady
        ? "Pending seller acceptance"
        : "Line fulfilment tracking not enabled in this environment",
      value: summary.pendingSellerLines,
      href: "/admin/orders",
      cta: "Open orders",
    },
  ];

  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin operations"
      helperText="Admin operations overview is role-protected and shows only real counts."
    >
      <DashboardShell
        eyebrow="Operations"
        title="Commerce operations overview."
        description="Live counts from the commerce database. Payment capture, refunds, courier assignment, and delivery tracking are not connected — these queues cover what actually exists."
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/operations"
      >
        {!summary.backendReady ? (
          <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
            <p className="text-sm font-semibold text-midnightbrown">
              Commerce database is not connected yet.
            </p>
            <p className="mt-2 text-sm leading-7 text-stone">
              There are no operational queues to read in this environment.
              Nothing has been lost — no orders exist yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {tiles.map((tile) => (
                <Card
                  key={tile.label}
                  className="section-border rounded-[24px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5"
                >
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sangria">
                    {tile.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-semibold text-midnightbrown">
                    {tile.value === null ? "—" : tile.value}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-stone">{tile.note}</p>
                  <Link
                    href={tile.href}
                    className="mt-3 inline-block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sangria underline-offset-2 hover:underline"
                  >
                    {tile.cta}
                  </Link>
                </Card>
              ))}
            </div>

            <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
                  Recent operational events
                </p>
                <p className="text-xs text-stone">
                  {summary.ordersTotal} order
                  {summary.ordersTotal === 1 ? "" : "s"} total
                </p>
              </div>
              {summary.recentEvents.length === 0 ? (
                <p className="mt-2 text-sm leading-7 text-stone">
                  No operational events recorded yet. Events appear when
                  orders, returns, or fulfilment states change.
                </p>
              ) : (
                <div className="mt-2 divide-y divide-[rgba(58,8,24,0.08)]">
                  {summary.recentEvents.map((event) => (
                    <div key={event.id} className="py-3">
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-stone">
                        {formatEnum(event.eventType)} ·{" "}
                        {formatDateTime(event.createdAt)} ·{" "}
                        <Link
                          href={`/admin/orders/${event.orderId}`}
                          className="text-sangria underline-offset-2 hover:underline"
                        >
                          Order {event.orderId.slice(0, 8).toUpperCase()}
                        </Link>
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
        )}
      </DashboardShell>
    </DemoRoleGate>
  );
}
