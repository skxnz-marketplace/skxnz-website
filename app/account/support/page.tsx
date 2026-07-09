import { AccountShell } from "@/components/account/account-shell";
import { BuyerSupportForm } from "@/components/support/buyer-support-form";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/roles";
import { isOrderIdShape } from "@/lib/orders/read-buyer-orders";
import { getBuyerSupportTickets } from "@/lib/support/read-support-tickets";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  WAITING_FOR_CUSTOMER: "Waiting for you",
  IN_REVIEW: "In review",
  RESOLVED: "Resolved",
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

export default async function AccountSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  await requireUser("/account/support");
  const { order } = await searchParams;
  const defaultOrderId = order && isOrderIdShape(order) ? order : null;

  const { backendReady, tickets } = await getBuyerSupportTickets();

  return (
    <AccountShell
      eyebrow="Support"
      title="Contact SKXNZ support."
      description="Open a support ticket about an order, product, account, or anything else. A human reviews every ticket — there is no automated resolution."
    >
      <div className="space-y-6">
        <BuyerSupportForm defaultOrderId={defaultOrderId} />

        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Your tickets
          </p>

          {!backendReady ? (
            <p className="mt-3 text-sm leading-7 text-stone">
              Support is not connected yet. Nothing was lost — no tickets exist.
              This connects when the commerce database is applied.
            </p>
          ) : tickets.length === 0 ? (
            <p className="mt-3 text-sm leading-7 text-stone">
              You have not opened any support tickets yet.
            </p>
          ) : (
            <div className="mt-5 grid gap-3">
              {tickets.map((ticket) => (
                <article
                  key={ticket.id}
                  className="min-w-0 rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-black text-midnightbrown">
                      {ticket.subject}
                    </p>
                    <span className="rounded-full border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.08)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-sangria">
                      {statusLabels[ticket.status] ?? ticket.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-stone">
                    {ticket.category}
                    {ticket.orderId
                      ? ` · Order ${ticket.orderId.slice(0, 8).toUpperCase()}`
                      : ""}
                    {" · "}
                    {formatDate(ticket.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AccountShell>
  );
}
