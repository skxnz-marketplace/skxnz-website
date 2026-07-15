import Link from "next/link";

import { AccountShell } from "@/components/account/account-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/roles";
import { getBuyerReturnRequests } from "@/lib/returns/read-return-requests";
import type { ReturnRequestStatus } from "@/lib/returns/return-requests";

// Buyer return-request list (D5-4A). Server component: lists ONLY the session
// buyer's own return_requests via RLS + defensive buyer_id filter. Read-only —
// no return is approved here, no pickup scheduled, no refund issued. Honest
// status copy only.

export const dynamic = "force-dynamic";

// Buyer-facing labels. Every non-terminal state stays honest that nothing is
// confirmed yet; approved/refunded etc. are only ever set by real ops/provider
// action server-side.
const statusLabels: Record<ReturnRequestStatus, string> = {
  REQUESTED: "Submitted for review",
  IN_REVIEW: "In review",
  APPROVED: "Approved — awaiting next step",
  REJECTED: "Not approved",
  PICKUP_PENDING: "Pickup being arranged",
  RECEIVED: "Item received",
  REFUND_PENDING: "Refund being processed",
  REFUNDED: "Refunded",
  CLOSED: "Closed",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AccountReturnsPage() {
  await requireUser("/account/returns");

  const { backendReady, returns } = await getBuyerReturnRequests();

  return (
    <AccountShell
      eyebrow="Returns"
      title="Your return requests."
      description="Return requests you have submitted from your delivered orders. A human reviews every request — no pickup or refund has been confirmed until SKXNZ updates the status here."
    >
      <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
        <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
          Return requests
        </p>

        {!backendReady ? (
          <p className="mt-3 text-sm leading-7 text-stone">
            Returns are not connected yet. Nothing was lost — no return requests
            exist. This connects when the commerce database is applied.
          </p>
        ) : returns.length === 0 ? (
          <div className="mt-3 space-y-4">
            <p className="text-sm leading-7 text-stone">
              You have not submitted any return requests yet. Returns can be
              requested from a delivered order.
            </p>
            <Link
              href="/orders"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              View Your Orders
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {returns.map((entry) => (
              <article
                key={entry.id}
                className="min-w-0 rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-midnightbrown">
                    Order {entry.orderId.slice(0, 8).toUpperCase()}
                  </p>
                  <span className="rounded-full border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.08)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-sangria">
                    {statusLabels[entry.status]}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-midnightbrown">
                  {entry.reason}
                </p>
                <p className="mt-2 text-xs text-stone">
                  Return {entry.id.slice(0, 8).toUpperCase()}
                  {` · ${entry.itemCount} ${entry.itemCount === 1 ? "item" : "items"}`}
                  {` · ${formatDate(entry.createdAt)}`}
                </p>
                <Link
                  href={`/orders/${entry.orderId}`}
                  aria-label={`View order ${entry.orderId.slice(0, 8).toUpperCase()}`}
                  className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-3`}
                >
                  View Order
                </Link>
              </article>
            ))}
          </div>
        )}
      </Card>
    </AccountShell>
  );
}
