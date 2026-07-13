import Link from "next/link";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/roles";
import { adminSidebarLinks } from "@/lib/data/site-content";
import { getAdminReturnRequests } from "@/lib/returns/read-admin-return-requests";

// Admin returns queue (D1-B, rebuilt D4-A). Real return_requests only, via
// admin RLS. Refunds and pickup systems are not connected — this queue only
// reviews and moves requests through REQUESTED / IN_REVIEW / APPROVED /
// REJECTED.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Returns — SKXNZ",
  description: "Internal return request review queue.",
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Requested",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PICKUP_PENDING: "Pickup pending",
  RECEIVED: "Received",
  REFUND_PENDING: "Refund pending",
  REFUNDED: "Refunded",
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

export default async function AdminReturnsPage() {
  await requireRole(["ADMIN"], "/admin/returns");
  const result = await getAdminReturnRequests();

  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin returns"
      helperText="Admin returns queue is role-protected and shows only real return requests."
    >
      <DashboardShell
        eyebrow="Returns Operations"
        title="Return requests."
        description="Review real buyer return requests. Refund execution and pickup logistics are not connected — approving a return here does not move money."
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/returns"
      >
        {!result.backendReady ? (
          <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
            <p className="text-sm font-semibold text-midnightbrown">
              Returns database is not connected yet.
            </p>
            <p className="mt-2 text-sm leading-7 text-stone">
              The commerce database has not been applied in this environment,
              so there are no return requests to read.
            </p>
          </Card>
        ) : result.requests.length === 0 ? (
          <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
            <p className="text-sm font-semibold text-midnightbrown">
              No return requests.
            </p>
            <p className="mt-2 text-sm leading-7 text-stone">
              Return requests appear here when buyers submit them on delivered
              orders. SKXNZ does not show placeholder requests.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {result.requests.map((request) => (
              <Link
                key={request.id}
                href={`/admin/returns/${request.id}`}
                className="block"
              >
                <Card className="section-border rounded-[24px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5 transition hover:border-sangria">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
                        Return {request.id.slice(0, 8).toUpperCase()} · Order{" "}
                        {request.orderId.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-midnightbrown">
                        {request.reason}
                      </p>
                      <p className="mt-1 text-xs text-stone">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgba(58,8,24,0.16)] bg-[var(--skxnz-bg)] px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-midnightbrown">
                      {STATUS_LABEL[request.status] ?? request.status}
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
