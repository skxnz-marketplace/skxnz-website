"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { addSupportTicketMessage } from "@/lib/support/add-support-ticket-message";

// Buyer reply on a support-ticket thread (D5-4A). Wired to the REAL D4-5 action
// addSupportTicketMessage (session-auth, RLS, ticket-must-be-active). The action
// re-verifies ownership + reply eligibility server-side; this UI only renders on
// an active ticket. No fake staff reply, no fake resolution.

const fieldClassName =
  "mt-2 w-full min-w-0 rounded-[20px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-3 text-sm text-midnightbrown outline-none transition focus:border-[rgba(34,211,238,0.34)] focus:ring-4 focus:ring-[rgba(34,211,238,0.08)]";

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setError(null);

    if (!message.trim()) {
      setError("Add a reply message.");
      return;
    }

    startTransition(async () => {
      const result = await addSupportTicketMessage({ ticketId, message });

      if (result.ok) {
        setMessage("");
        setSent(true);
        router.refresh();
        return;
      }
      setSent(false);
      setError(result.message);
    });
  }

  return (
    <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
      <label className="block min-w-0">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
          Add a reply
        </span>
        <textarea
          rows={4}
          value={message}
          maxLength={4000}
          onChange={(event) => {
            setMessage(event.target.value);
            if (sent) setSent(false);
          }}
          placeholder="Reply to SKXNZ support. Do not include payment or card details."
          className={`${fieldClassName} rounded-[24px]`}
        />
      </label>

      {sent ? (
        <p className="rounded-[20px] border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.06)] px-4 py-3 text-sm text-midnightbrown">
          Message added. SKXNZ support will review this — there is no automated
          resolution.
        </p>
      ) : null}

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
        {isPending ? "Sending…" : "Send Reply"}
      </button>
    </form>
  );
}
