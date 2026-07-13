"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  adminAddSupportReply,
  adminUpdateSupportTicketStatus,
} from "@/lib/support/admin-support-actions";

type Props = {
  ticketId: string;
  currentStatus: string;
};

// Admin support panel (D4-A): reply as admin + validated status moves.
// Attribution is server-controlled — the action stamps sender_role ADMIN and
// sender_id from the verified session; nothing here can forge it.

const NEXT: Record<string, string[]> = {
  OPEN: ["IN_REVIEW", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"],
  IN_REVIEW: ["WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"],
  WAITING_FOR_CUSTOMER: ["IN_REVIEW", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

const LABEL: Record<string, string> = {
  IN_REVIEW: "In review",
  WAITING_FOR_CUSTOMER: "Waiting for customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export function AdminSupportPanel({ ticketId, currentStatus }: Props) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextStatuses = NEXT[currentStatus] ?? [];
  const closed = currentStatus === "CLOSED";

  const sendReply = () => {
    if (isPending || !reply.trim()) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await adminAddSupportReply({ ticketId, message: reply.trim() });
      if (result.ok) {
        setReply("");
        setMessage("Reply sent. It is visible to the buyer in their support thread.");
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  const moveStatus = (nextStatus: string) => {
    if (isPending) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await adminUpdateSupportTicketStatus({ ticketId, nextStatus });
      if (result.ok) {
        setMessage(`Ticket moved to ${LABEL[nextStatus] ?? nextStatus}.`);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      {closed ? (
        <p className="text-xs uppercase tracking-[0.16em] text-stone">
          This ticket is closed. Reopen paths are not supported — the buyer
          can open a new ticket.
        </p>
      ) : (
        <div>
          <label className="block">
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-midnightbrown">
              Reply to buyer (max 4000)
            </span>
            <textarea
              value={reply}
              onChange={(event) => setReply(event.target.value.slice(0, 4000))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-[rgba(58,8,24,0.16)] bg-[var(--skxnz-bg)] p-2 text-sm text-midnightbrown outline-none transition focus:border-sangria"
              disabled={isPending}
            />
          </label>
          <button
            type="button"
            disabled={isPending || !reply.trim()}
            onClick={sendReply}
            className="mt-2 inline-flex items-center justify-center rounded-full border border-transparent bg-midnightbrown px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-sangria"
          >
            {isPending ? "Working…" : "Send reply"}
          </button>
        </div>
      )}

      {nextStatuses.length > 0 ? (
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-midnightbrown">
            Move ticket status
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {nextStatuses.map((nextStatus) => (
              <button
                key={nextStatus}
                type="button"
                disabled={isPending}
                onClick={() => moveStatus(nextStatus)}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(58,8,24,0.16)] bg-[var(--skxnz-bg)] px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-midnightbrown transition disabled:cursor-not-allowed disabled:opacity-60 hover:border-sangria hover:text-sangria"
              >
                {LABEL[nextStatus] ?? nextStatus}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {message ? (
        <p role="status" aria-live="polite" className="text-xs font-semibold text-midnightbrown">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs font-semibold text-sangria">
          {error}
        </p>
      ) : null}
    </div>
  );
}
