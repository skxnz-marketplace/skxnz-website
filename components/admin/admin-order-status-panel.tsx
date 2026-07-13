"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { adminUpdateOrderStatus } from "@/lib/orders/admin-update-order-status";
import {
  ADMIN_ORDER_STATUS_LABEL,
  ADMIN_ORDER_TRANSITIONS,
} from "@/lib/orders/admin-order-transitions";
import type { BuyerOrderStatus } from "@/lib/orders/read-buyer-orders";

type Props = {
  orderId: string;
  currentStatus: BuyerOrderStatus;
};

// Admin order transition panel (D4-A). Only offers transitions the server
// action will accept; -> PAID and -> REFUNDED are unreachable by design
// (payment webhook / provider-confirmed refund only). CANCELLED is treated
// as irreversible and gets an explicit confirm step.

export function AdminOrderStatusPanel({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState<BuyerOrderStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextStatuses = ADMIN_ORDER_TRANSITIONS[currentStatus] ?? [];

  const run = (nextStatus: BuyerOrderStatus) => {
    if (isPending) return;
    setMessage(null);
    setError(null);
    setConfirming(null);
    startTransition(async () => {
      const result = await adminUpdateOrderStatus({
        orderId,
        nextStatus,
        note: note.trim() ? note.trim() : null,
      });
      if (result.ok) {
        setNote("");
        setMessage(`Order moved to ${ADMIN_ORDER_STATUS_LABEL[result.status]}.`);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  if (nextStatuses.length === 0) {
    return (
      <p className="text-xs uppercase tracking-[0.16em] text-stone">
        {ADMIN_ORDER_STATUS_LABEL[currentStatus]} is terminal — no admin
        transition available. Payment and refund states are set only by real
        provider flows.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {nextStatuses.map((nextStatus) => {
          const destructive = nextStatus === "CANCELLED";
          if (destructive && confirming !== nextStatus) {
            return (
              <button
                key={nextStatus}
                type="button"
                disabled={isPending}
                onClick={() => setConfirming(nextStatus)}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(58,8,24,0.24)] bg-[var(--skxnz-bg)] px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sangria transition disabled:cursor-not-allowed disabled:opacity-60 hover:border-sangria"
              >
                Cancel order…
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
                  ? "Confirm cancel"
                  : `Mark ${ADMIN_ORDER_STATUS_LABEL[nextStatus]}`}
            </button>
          );
        })}
        {confirming ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirming(null)}
            className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-stone underline-offset-2 hover:underline"
          >
            Keep as is
          </button>
        ) : null}
      </div>

      <label className="mt-3 block">
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-midnightbrown">
          Audit note (optional, max 500)
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
