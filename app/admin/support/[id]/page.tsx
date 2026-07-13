import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminSupportPanel } from "@/components/admin/admin-support-panel";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/roles";
import { adminSidebarLinks } from "@/lib/data/site-content";
import { getAdminSupportTicket } from "@/lib/support/read-admin-support-tickets";

// Admin support ticket detail (D1-B, rebuilt D4-A). Real thread + validated
// admin reply / status actions. Reply attribution is server-controlled.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Support Ticket — SKXNZ",
  description: "Internal support ticket thread.",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_REVIEW: "In review",
  WAITING_FOR_CUSTOMER: "Waiting for customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const SENDER_LABEL: Record<string, string> = {
  BUYER: "Buyer",
  SUPPORT: "SKXNZ Support",
  ADMIN: "SKXNZ Admin",
  SYSTEM: "System",
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

export default async function AdminSupportDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"], "/admin/support");
  const { id } = await params;
  const result = await getAdminSupportTicket(id);
  if (!result.found) notFound();

  const ticket = result.ticket;

  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin support ticket"
      helperText="Admin support ticket detail is role-protected."
    >
      <DashboardShell
        eyebrow={`Ticket ${ticket.id.slice(0, 8).toUpperCase()}`}
        title={ticket.subject}
        description="Real buyer thread. Replies here are visible to the buyer. No email or push notification is sent — none is connected."
        actions={
          <Link
            href="/admin/support"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Support Queue
          </Link>
        }
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/support"
      >
        <div className="space-y-4">
          <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
                  {formatEnum(ticket.category)} · {formatEnum(ticket.priority)}{" "}
                  priority · Buyer {ticket.buyerId.slice(0, 8).toUpperCase()}
                </p>
                <p className="mt-2 text-lg font-semibold text-midnightbrown">
                  {STATUS_LABEL[ticket.status] ?? ticket.status}
                </p>
                <p className="mt-1 text-xs text-stone">
                  Opened {formatDate(ticket.createdAt)} · Last activity{" "}
                  {formatDate(ticket.updatedAt)}
                </p>
              </div>
              {ticket.orderId ? (
                <Link
                  href={`/admin/orders/${ticket.orderId}`}
                  className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sangria underline-offset-2 hover:underline"
                >
                  Open linked order
                </Link>
              ) : null}
            </div>
          </Card>

          <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
              Thread
            </p>
            <div className="mt-2 space-y-3">
              {result.messages.length === 0 ? (
                <p className="text-sm leading-7 text-stone">
                  No messages recorded on this ticket.
                </p>
              ) : (
                result.messages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-[18px] border border-[rgba(58,8,24,0.1)] bg-[var(--skxnz-bg)] p-4"
                  >
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-sangria">
                      {SENDER_LABEL[message.senderRole] ?? message.senderRole} ·{" "}
                      {formatDate(message.createdAt)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-midnightbrown">
                      {message.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
              Admin actions
            </p>
            <div className="mt-3">
              <AdminSupportPanel
                ticketId={ticket.id}
                currentStatus={ticket.status}
              />
            </div>
          </Card>
        </div>
      </DashboardShell>
    </DemoRoleGate>
  );
}
