"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateSellerLineFulfilment } from "@/lib/orders/seller-update-line-fulfilment";
// From the server-free module: read-seller-orders.ts also imports
// lib/supabase/server.ts, which cannot be bundled into a client component.
import {
  NEXT_SELLER_FULFILMENT,
  describeSellerFulfilment,
  type SellerLineFulfilmentStatus,
} from "@/lib/orders/seller-fulfilment";

type Props = {
  orderItemId: string;
  currentStatus: SellerLineFulfilmentStatus;
  existingNote: string | null;
};

export function SellerLineActions({
  orderItemId,
  currentStatus,
  existingNote,
}: Props) {
  const router = useRouter();
  const [note, setNote] = useState<string>(existingNote ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextStep = NEXT_SELLER_FULFILMENT[currentStatus];

  const runAction = (params: Parameters<typeof updateSellerLineFulfilment>[0]) => {
    if (isPending) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateSellerLineFulfilment(params);
      if (result.ok) {
        setMessage(
          params.action === "ADVANCE"
            ? `Line moved to ${describeSellerFulfilment(result.status).label}.`
            : "Note saved.",
        );
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <div className="mt-4 border-t border-[rgba(58,8,24,0.12)] pt-4">
      <div className="flex flex-wrap items-center gap-2">
        {nextStep ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              runAction({
                orderItemId,
                action: "ADVANCE",
                nextStatus: nextStep,
                note: note.trim() ? note.trim() : null,
              })
            }
            className="inline-flex items-center justify-center rounded-full border border-transparent bg-sangria px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-midnightbrown"
          >
            {isPending
              ? "Working…"
              : `Mark ${describeSellerFulfilment(nextStep).label}`}
          </button>
        ) : (
          <p className="text-[0.62rem] uppercase tracking-[0.18em] text-stone">
            Handed to delivery — no further seller action.
          </p>
        )}
        <button
          type="button"
          disabled={isPending || note.trim().length === 0}
          onClick={() =>
            runAction({
              orderItemId,
              action: "ADD_NOTE",
              note: note.trim(),
            })
          }
          className="inline-flex items-center justify-center rounded-full border border-[rgba(58,8,24,0.16)] bg-[var(--skxnz-bg)] px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-midnightbrown transition disabled:cursor-not-allowed disabled:opacity-60 hover:border-sangria hover:text-sangria"
        >
          Save note only
        </button>
      </div>

      <label className="mt-3 block">
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-midnightbrown">
          Seller note (optional, max 500)
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 500))}
          rows={2}
          placeholder="E.g. Packed with size M as ordered."
          maxLength={500}
          aria-describedby={`${orderItemId}-note-help`}
          className="mt-1 w-full rounded-lg border border-[rgba(58,8,24,0.16)] bg-[var(--skxnz-bg)] p-2 text-sm text-midnightbrown outline-none transition focus:border-sangria"
          disabled={isPending}
        />
        <span id={`${orderItemId}-note-help`} className="mt-1 block text-xs text-stone">
          Notes are visible to SKXNZ operations, not a buyer support thread.
        </span>
      </label>

      {message ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-2 text-xs font-semibold text-midnightbrown"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-2 text-xs font-semibold text-sangria"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
