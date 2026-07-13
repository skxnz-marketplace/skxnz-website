import Link from "next/link";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/roles";
import { adminSidebarLinks } from "@/lib/data/site-content";
import { getAdminSupportTickets } from "@/lib/support/read-admin-support-tickets";

// Admin support queue (D1-B, rebuilt D4-A). Real support_tickets only, via
// admin RLS. Replies are buyer-visible; no internal-note channel exists in
// the schema, and none is faked.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Support — SKXNZ",
  description: "Internal buyer support queue.",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_REVIEW: "In review",
  WAITING_FOR_CUSTOMER: "Waiting for customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

function formatDate(iso: string): string {
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

export default async function AdminSupportPage() {
  await requireRole(["ADMIN"], "/admin/support");
  const result = await getAdminSupportTickets();

  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin support"
      helperText="Admin support queue is role-protected and shows only real buyer tickets."
    >
      <DashboardShell
        eyebrow="Support Operations"
        title="Buyer support queue."
        description="Real buyer tickets only. Replies are visible to the buyer in their account thread. No SLA automation or email notification is connected."
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/support"
      >
        {!result.backendReady ? (
          <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
            <p className="text-sm font-semibold text-midnightbrown">
              Support database is not connected yet.
            </p>
            <p className="mt-2 text-sm leading-7 text-stone">
              The commerce database has not been applied in this environment,
              so there are no tickets to read.
            </p>
          </Card>
        ) : result.tickets.length === 0 ? (
          <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
            <p className="text-sm font-semibold text-midnightbrown">
              No support tickets.
            </p>
            <p className="mt-2 text-sm leading-7 text-stone">
              Tickets appear here when buyers open them from their account.
              SKXNZ does not show placeholder tickets.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {result.tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/support/${ticket.id}`}
                className="block"
              >
                <Card className="section-border rounded-[24px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5 transition hover:border-sangria">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-midnightbrown">
                        {ticket.subject}
                      </p>
                      <p className="mt-1 text-xs text-stone">
                        {[
                          formatEnum(ticket.category),
                          formatEnum(ticket.priority),
                          ticket.orderId
                            ? `Order ${ticket.orderId.slice(0, 8).toUpperCase()}`
                            : null,
                          `Updated ${formatDate(ticket.updatedAt)}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgba(58,8,24,0.16)] bg-[var(--skxnz-bg)] px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-midnightbrown">
                      {STATUS_LABEL[ticket.status] ?? ticket.status}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </DashboardShell>
    </DemoRoleGate>
  );
}
