import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminReturnActions } from "@/components/admin/admin-return-actions";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/roles";
import { adminSidebarLinks } from "@/lib/data/site-content";
import { getAdminReturnRequest } from "@/lib/returns/read-admin-return-requests";

// Admin return detail (D1-B, rebuilt D4-A). Real request + items with
// order-line snapshots, validated transitions (REQUESTED -> IN_REVIEW |
// REJECTED, IN_REVIEW -> APPROVED | REJECTED), audit note into
// order_events. No refund execution — no provider exists.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Return Detail — SKXNZ",
  description: "Internal return request review.",
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Requested",
  IN_REVIEW: "In review",
  APPROVED: "Approved — refund not executed",
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

export default async function AdminReturnDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"], "/admin/returns");
  const { id } = await params;
  const result = await getAdminReturnRequest(id);
  if (!result.found) notFound();

  const request = result.request;

  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin return detail"
      helperText="Admin return detail is role-protected and shows only real return data."
    >
      <DashboardShell
        eyebrow={`Return ${request.id.slice(0, 8).toUpperCase()}`}
        title="Return request review."
        description="Approve or reject after review. Approval records the decision only — refund execution and pickup logistics are not connected."
        actions={
          <Link
            href="/admin/returns"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Returns Queue
          </Link>
        }
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/returns"
      >
        <div className="space-y-4">
          <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
                  Order {request.orderId.slice(0, 8).toUpperCase()} · Buyer{" "}
                  {request.buyerId.slice(0, 8).toUpperCase()}
                </p>
                <p className="mt-2 text-lg font-semibold text-midnightbrown">
                  {STATUS_LABEL[request.status] ?? request.status}
                </p>
                <p className="mt-1 text-sm leading-7 text-stone">
                  Reason: {request.reason}
                </p>
                {request.note ? (
                  <p className="mt-1 text-xs leading-6 text-stone">
                    Buyer note: {request.note}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-stone">
                  Requested {formatDate(request.createdAt)}
                </p>
              </div>
              <Link
                href={`/admin/orders/${request.orderId}`}
                className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sangria underline-offset-2 hover:underline"
              >
                Open order
              </Link>
            </div>
          </Card>

          <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
              Items in this return
            </p>
            <div className="mt-2 divide-y divide-[rgba(58,8,24,0.08)]">
              {result.items.length === 0 ? (
                <p className="py-3 text-sm leading-7 text-stone">
                  No items recorded on this request.
                </p>
              ) : (
                result.items.map((item) => (
                  <div key={item.id} className="py-3">
                    <p className="text-sm font-semibold text-midnightbrown">
                      {item.titleSnapshot ?? "Order line"}
                    </p>
                    <p className="mt-1 text-xs text-stone">
                      {[
                        item.selectedSize ? `Size ${item.selectedSize}` : null,
                        item.selectedColor,
                        `Returning ${item.quantity}`,
                        item.purchasedQuantity !== null
                          ? `of ${item.purchasedQuantity} purchased`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {item.reason ? (
                      <p className="mt-1 text-xs leading-5 text-stone">
                        Item reason: {item.reason}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6">
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
              Review actions
            </p>
            <p className="mt-2 text-xs leading-6 text-stone">
              Approving records the decision and writes an audit event on the
              order. It does not move money and does not schedule a pickup —
              neither system is connected.
            </p>
            <div className="mt-3">
              <AdminReturnActions
                requestId={request.id}
                currentStatus={request.status}
              />
            </div>
          </Card>
        </div>
      </DashboardShell>
    </DemoRoleGate>
  );
}
