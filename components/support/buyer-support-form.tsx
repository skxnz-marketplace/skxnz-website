"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSupportTicket } from "@/lib/support/create-support-ticket";
import {
  supportTicketCategories,
  type SupportTicketCategory,
} from "@/lib/support/support-requests";

// Buyer support intake wired to the REAL D4-5 action createSupportTicket
// (session-auth, RLS-owned support_tickets). No fake instant resolution — a
// created ticket is OPEN and honestly waits for SKXNZ review.

const categoryLabels: Record<SupportTicketCategory, string> = {
  ORDER: "Order",
  RETURN: "Return / refund",
  PAYMENT: "Payment",
  DELIVERY: "Delivery",
  PRODUCT: "Product",
  ACCOUNT: "Account",
  OTHER: "Other",
};

const fieldClassName =
  "mt-2 w-full min-w-0 rounded-[20px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-3 text-sm text-midnightbrown outline-none transition focus:border-[rgba(34,211,238,0.34)] focus:ring-4 focus:ring-[rgba(34,211,238,0.08)]";

export function BuyerSupportForm({
  defaultOrderId,
}: {
  defaultOrderId?: string | null;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<SupportTicketCategory>(
    defaultOrderId ? "ORDER" : "OTHER",
  );
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setError(null);

    startTransition(async () => {
      const result = await createSupportTicket({
        category,
        subject,
        message,
        orderId: defaultOrderId ?? null,
      });

      if (result.ok) {
        setSubmittedTicketId(result.ticketId);
        setSubject("");
        setMessage("");
        router.refresh();
        return;
      }
      setError(result.message);
    });
  }

  if (submittedTicketId) {
    return (
      <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
        <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
          Support ticket submitted
        </p>
        <h2 className="mt-3 font-display text-2xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
          SKXNZ support will review this.
        </h2>
        <p className="mt-3 text-sm leading-7 text-stone">
          Your ticket is open. There is no automated resolution — a human will
          review it. Ticket reference {submittedTicketId.slice(0, 8).toUpperCase()}.
        </p>
        <button
          type="button"
          onClick={() => setSubmittedTicketId(null)}
          className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-5`}
        >
          Open Another Ticket
        </button>
      </Card>
    );
  }

  return (
    <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        New support ticket
      </p>
      <h2 className="mt-3 font-display text-2xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
        Tell us what you need.
      </h2>
      {defaultOrderId ? (
        <p className="mt-2 text-xs leading-6 text-stone">
          Linked to order {defaultOrderId.slice(0, 8).toUpperCase()}.
        </p>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block min-w-0">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
            Category
          </span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as SupportTicketCategory)
            }
            className={fieldClassName}
          >
            {supportTicketCategories.map((value) => (
              <option key={value} value={value}>
                {categoryLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
            Subject
          </span>
          <input
            type="text"
            value={subject}
            maxLength={160}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Short summary"
            className={fieldClassName}
          />
        </label>

        <label className="block min-w-0">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
            Message
          </span>
          <textarea
            rows={6}
            value={message}
            maxLength={4000}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Describe the issue. Do not include payment or card details."
            className={`${fieldClassName} rounded-[24px]`}
          />
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded-[20px] border border-[rgba(217,70,239,0.24)] bg-[rgba(217,70,239,0.06)] px-4 py-3 text-sm text-midnightbrown"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className={`${buttonVariants({ variant: "primary", size: "lg" })} ${
            isPending ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {isPending ? "Submitting…" : "Submit Support Ticket"}
        </button>
      </form>
    </Card>
  );
}
