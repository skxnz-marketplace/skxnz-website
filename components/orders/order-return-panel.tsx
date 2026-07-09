"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createReturnRequest } from "@/lib/returns/create-return-request";
import type {
  BuyerOrderItem,
  BuyerOrderStatus,
} from "@/lib/orders/read-buyer-orders";

// Buyer return-request surface on order detail (D5-3). Wired to the REAL D4-5
// action createReturnRequest (session-auth, RLS, DELIVERED-only eligibility).
// The action itself re-verifies ownership + eligibility server-side; this UI
// only enables the form when the order is DELIVERED and otherwise shows an
// honest disabled state. No fake refund/pickup/courier claim anywhere.

type SelectedState = Record<string, { checked: boolean; quantity: number }>;

const fieldClassName =
  "mt-2 w-full min-w-0 rounded-[20px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] px-4 py-3 text-sm text-midnightbrown outline-none transition focus:border-[rgba(34,211,238,0.34)] focus:ring-4 focus:ring-[rgba(34,211,238,0.08)]";

function statusReason(status: BuyerOrderStatus): string {
  if (status === "DRAFT" || status === "PAYMENT_PENDING") {
    return "This order is not paid yet, so there is nothing to return.";
  }
  if (status === "CANCELLED") {
    return "This order was cancelled.";
  }
  if (status === "REFUNDED") {
    return "This order has already been refunded.";
  }
  // PAID / FULFILLING / SHIPPED
  return "Returns can be requested only after an order is delivered. This order has not been delivered yet.";
}

export function OrderReturnPanel({
  orderId,
  status,
  items,
}: {
  orderId: string;
  status: BuyerOrderStatus;
  items: BuyerOrderItem[];
}) {
  const router = useRouter();
  const eligible = status === "DELIVERED";

  const [selected, setSelected] = useState<SelectedState>(() =>
    Object.fromEntries(
      items.map((item) => [item.id, { checked: false, quantity: 1 }]),
    ),
  );
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const chosen = useMemo(
    () => items.filter((item) => selected[item.id]?.checked),
    [items, selected],
  );

  if (!eligible) {
    return (
      <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
        <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
          Returns
        </p>
        <h2 className="mt-3 font-display text-2xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
          Return not available yet.
        </h2>
        <p className="mt-3 text-sm leading-7 text-stone">{statusReason(status)}</p>
      </Card>
    );
  }

  if (submittedId) {
    return (
      <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
        <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
          Return request submitted for review
        </p>
        <p className="mt-3 text-sm leading-7 text-stone">
          SKXNZ will review your request. No refund has been approved and no
          pickup has been scheduled — those steps are not automated. Reference{" "}
          {submittedId.slice(0, 8).toUpperCase()}.
        </p>
      </Card>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setError(null);

    if (chosen.length === 0) {
      setError("Select at least one item to return.");
      return;
    }
    if (!reason.trim()) {
      setError("Add a return reason.");
      return;
    }

    startTransition(async () => {
      const result = await createReturnRequest({
        orderId,
        reason,
        note: note.trim() || null,
        items: chosen.map((item) => ({
          orderItemId: item.id,
          quantity: selected[item.id]?.quantity ?? 1,
          reason: null,
        })),
      });

      if (result.ok) {
        setSubmittedId(result.returnRequestId);
        router.refresh();
        return;
      }
      setError(result.message);
    });
  }

  return (
    <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        Request a return
      </p>
      <h2 className="mt-3 font-display text-2xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
        Return delivered items.
      </h2>
      <p className="mt-2 text-sm leading-7 text-stone">
        Select the items you want to return and tell us why. This creates a
        review request only — no refund or pickup is scheduled automatically.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3">
          {items.map((item) => {
            const state = selected[item.id] ?? { checked: false, quantity: 1 };
            return (
              <label
                key={item.id}
                className="flex min-w-0 items-start gap-3 rounded-[20px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] p-4"
              >
                <input
                  type="checkbox"
                  checked={state.checked}
                  onChange={(event) =>
                    setSelected((current) => ({
                      ...current,
                      [item.id]: { ...state, checked: event.target.checked },
                    }))
                  }
                  className="mt-1 h-4 w-4 accent-[var(--skxnz-maroon)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-midnightbrown">
                    {item.titleSnapshot}
                  </span>
                  <span className="mt-1 block text-xs text-stone">
                    {[item.selectedSize ? `Size ${item.selectedSize}` : null, `Qty ${item.quantity}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {state.checked && item.quantity > 1 ? (
                    <span className="mt-2 flex items-center gap-2 text-xs text-stone">
                      Return qty
                      <select
                        value={state.quantity}
                        onChange={(event) =>
                          setSelected((current) => ({
                            ...current,
                            [item.id]: {
                              ...state,
                              quantity: Number(event.target.value),
                            },
                          }))
                        }
                        className="rounded-[12px] border border-[rgba(58,8,24,0.12)] bg-white px-2 py-1"
                      >
                        {Array.from({ length: item.quantity }, (_, index) => index + 1).map(
                          (value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ),
                        )}
                      </select>
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>

        <label className="block min-w-0">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
            Return reason
          </span>
          <input
            type="text"
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Wrong size, damaged on arrival"
            className={fieldClassName}
          />
        </label>

        <label className="block min-w-0">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
            Note (optional)
          </span>
          <textarea
            rows={3}
            value={note}
            maxLength={2000}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Anything else SKXNZ should know."
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
          {isPending ? "Submitting…" : "Submit Return Request"}
        </button>
      </form>
    </Card>
  );
}
