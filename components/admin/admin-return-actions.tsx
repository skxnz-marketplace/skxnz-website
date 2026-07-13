"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { adminUpdateReturnStatus } from "@/lib/returns/admin-update-return-status";

type Props = {
  requestId: string;
  currentStatus: string;
};

// Admin return transition panel (D4-A). Mirrors the server action's map:
//   REQUESTED -> IN_REVIEW | REJECTED
//   IN_REVIEW -> APPROVED  | REJECTED
// Refund / pickup / received states are NOT offered — no provider exists.
// REJECTED is irreversible here and requires an explicit confirm step.

const NEXT: Record<string, string[]> = {
  REQUESTED: ["IN_REVIEW", "REJECTED"],
  IN_REVIEW: ["APPROVED", "REJECTED"],
};

const LABEL: Record<string, string> = {
  IN_REVIEW: "Start review",
  APPROVED: "Approve return",
  REJECTED: "Reject return",
};

export function AdminReturnActions({ requestId, currentStatus }: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [confirmingReject, setConfirmingReject] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextStatuses = NEXT[currentStatus] ?? [];

  const run = (nextStatus: string) => {
    if (isPending) return;
    setMessage(null);
    setError(null);
    setConfirmingReject(false);
    startTransition(async () => {
      const result = await adminUpdateReturnStatus({
        requestId,
        nextStatus,
        note: note.trim() ? note.trim() : null,
      });
      if (result.ok) {
        setNote("");
        setMessage(`Return moved to ${nextStatus.replaceAll("_", " ").toLowerCase()}.`);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  if (nextStatuses.length === 0) {
    return (
      <p className="text-xs uppercase tracking-[0.16em] text-stone">
        No admin transition available from this state. Refund and pickup
        states are set only by real provider flows — none is connected.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {nextStatuses.map((nextStatus) => {
          const destructive = nextStatus === "REJECTED";
          if (destructive && !confirmingReject) {
            return (
              <button
                key={nextStatus}
                type="button"
                disabled={isPending}
                onClick={() => setConfirmingReject(true)}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(58,8,24,0.24)] bg-[var(--skxnz-bg)] px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sangria transition disabled:cursor-not-allowed disabled:opacity-60 hover:border-sangria"
              >
                Reject return…
              </button>
            );
          }
          return (
            <button
              key={nextStatus}
              type="button"
              disabled={isPending}
              onClick={() => run(nextStatus)}
              className={
                destructive
                  ? "inline-flex items-center justify-center rounded-full border border-transparent bg-sangria px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-midnightbrown"
                  : "inline-flex items-center justify-center rounded-full border border-transparent bg-midnightbrown px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-sangria"
              }
            >
              {isPending
                ? "Working…"
                : destructive
                  ? "Confirm reject"
                  : LABEL[nextStatus]}
            </button>
          );
        })}
        {confirmingReject ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirmingReject(false)}
            className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-stone underline-offset-2 hover:underline"
          >
            Keep as is
          </button>
        ) : null}
      </div>

      <label className="mt-3 block">
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-midnightbrown">
          Audit note (optional, max 500 — recorded in order history)
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 500))}
          rows={2}
          className="mt-1 w-full rounded-lg border border-[rgba(58,8,24,0.16)] bg-[var(--skxnz-bg)] p-2 text-sm text-midnightbrown outline-none transition focus:border-sangria"
          disabled={isPending}
        />
      </label>

      {message ? (
        <p role="status" aria-live="polite" className="mt-2 text-xs font-semibold text-midnightbrown">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-xs font-semibold text-sangria">
          {error}
        </p>
      ) : null}
    </div>
  );
}
