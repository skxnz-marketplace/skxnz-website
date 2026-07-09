import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountShell } from "@/components/account/account-shell";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/roles";
import { getBuyerSupportTicketThread } from "@/lib/support/read-support-tickets";
import type { SupportTicketStatus } from "@/lib/support/support-requests";

// Buyer support-ticket thread (D5-4A). Server component: reads ONE buyer-owned
// ticket + its messages via the session-scoped Supabase client. RLS + the
// explicit buyer_id filter mean another buyer's ticket id returns zero rows ->
// notFound(), with no existence leak. Buyer identity is never taken from the URL.

export const dynamic = "force-dynamic";

const statusLabels: Record<SupportTicketStatus, string> = {
  OPEN: "Open",
  WAITING_FOR_CUSTOMER: "Waiting for you",
  IN_REVIEW: "In review",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

// Ticket statuses a buyer may still reply to (mirrors the D4-5 action + RLS).
const REPLYABLE: SupportTicketStatus[] = ["OPEN", "WAITING_FOR_CUSTOMER", "IN_REVIEW"];

const senderLabels: Record<string, string> = {
  BUYER: "You",
  SUPPORT: "SKXNZ Support",
  ADMIN: "SKXNZ Support",
  SYSTEM: "System",
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function SupportTicketThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("/account/support");
  const { id } = await params;

  const result = await getBuyerSupportTicketThread(id);

  if (!result.backendReady) {
    return (
      <AccountShell
        eyebrow="Support"
        title="Support is not connected yet."
        description="The commerce database has not been applied for this environment, so there is no ticket to read at this address."
      >
        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
          <Link href="/account/support" className={buttonVariants({ variant: "primary" })}>
            Back To Support
          </Link>
        </Card>
      </AccountShell>
    );
  }

  if (!result.found || !result.thread) {
    notFound();
  }

  const ticket = result.thread;
  const canReply = REPLYABLE.includes(ticket.status);

  return (
    <AccountShell
      eyebrow="Support ticket"
      title={ticket.subject}
      description="A human reviews every ticket. There is no automated resolution — replies are added to this thread for SKXNZ support to review."
    >
      <div className="space-y-6">
        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Ticket {ticket.id.slice(0, 8).toUpperCase()}
            </p>
            <span className="rounded-full border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.08)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-sangria">
              {statusLabels[ticket.status]}
            </span>
          </div>
          <p className="mt-3 text-xs text-stone">
            {ticket.category}
            {ticket.orderId
              ? ` · Order ${ticket.orderId.slice(0, 8).toUpperCase()}`
              : ""}
            {" · "}
            {formatDateTime(ticket.createdAt)}
          </p>
          {ticket.orderId ? (
            <Link
              href={`/orders/${ticket.orderId}`}
              className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-4`}
            >
              View Linked Order
            </Link>
          ) : null}
        </Card>

        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Conversation
          </p>

          {ticket.messages.length === 0 ? (
            <p className="mt-3 text-sm leading-7 text-stone">
              No messages on this ticket yet.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {ticket.messages.map((entry) => {
                const isBuyer = entry.senderRole === "BUYER";
                return (
                  <div
                    key={entry.id}
                    className={`min-w-0 rounded-[24px] border p-4 ${
                      isBuyer
                        ? "border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)]"
                        : "border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.05)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sangria">
                        {senderLabels[entry.senderRole] ?? entry.senderRole}
                      </p>
                      <p className="text-[0.68rem] text-stone">
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-midnightbrown">
                      {entry.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {canReply ? (
            <TicketReplyForm ticketId={ticket.id} />
          ) : (
            <p className="mt-6 rounded-[20px] border border-[rgba(58,8,24,0.14)] bg-[rgba(58,8,24,0.04)] p-4 text-xs leading-6 text-midnightbrown">
              This ticket is {statusLabels[ticket.status].toLowerCase()} and can no
              longer receive replies. Open a new support ticket if you still need
              help.
            </p>
          )}
        </Card>

        <Link
          href="/account/support"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          All Tickets
        </Link>
      </div>
    </AccountShell>
  );
}
