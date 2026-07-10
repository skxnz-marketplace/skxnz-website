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
import type {
  OrderReturnRequestSummary,
} from "@/lib/returns/read-return-requests";
import type { ReturnRequestStatus } from "@/lib/returns/return-requests";

// Buyer return-request surface on order detail (D5-3, hardened D1-A). Wired to
// the REAL D4-5 action createReturnRequest (session-auth, RLS, DELIVERED-only
// eligibility). The action re-verifies ownership, eligibility, and
// already-claimed quantities server-side; this UI only enables the form when
// the order is DELIVERED, caps quantities at what is still claimable, and
// shows any existing request's status. No fake refund/pickup/courier claim.

type SelectedState = Record<string, { checked: boolean; quantity: number }>;

const returnStatusLabels: Record<ReturnRequestStatus, string> = {
  REQUESTED: "Submitted for review",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  REJECTED: "Not approved",
  PICKUP_PENDING: "Pickup being arranged",
  RECEIVED: "Item received",
  REFUND_PENDING: "Refund in progress",
  REFUNDED: "Refunded",
  CLOSED: "Closed",
};

function formatReturnDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
  existingReturns = [],
  claimedQuantities = {},
}: {
  orderId: string;
  status: BuyerOrderStatus;
  items: BuyerOrderItem[];
  existingReturns?: OrderReturnRequestSummary[];
  claimedQuantities?: Record<string, number>;
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

  // Quantity still claimable per line, after earlier non-rejected requests.
  // The server action re-checks this on submit; here it only shapes the UI.
  const remainingByItemId = useMemo(() => {
    const remaining = new Map<string, number>();
    for (const item of items) {
      const claimed = claimedQuantities[item.id] ?? 0;
      remaining.set(item.id, Math.max(0, item.quantity - claimed));
    }
    return remaining;
  }, [items, claimedQuantities]);

  const returnableItems = useMemo(
    () => items.filter((item) => (remainingByItemId.get(item.id) ?? 0) > 0),
    [items, remainingByItemId],
  );

  const chosen = useMemo(
    () => returnableItems.filter((item) => selected[item.id]?.checked),
    [returnableItems, selected],
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

  const existingReturnsBlock =
    existingReturns.length > 0 ? (
      <div className="mt-5 rounded-[20px] border border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-bg-soft)] p-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-stone">
          Returns already requested for this order
        </p>
        <ul className="mt-2 space-y-1">
          {existingReturns.map((request) => (
            <li key={request.id} className="text-xs leading-6 text-midnightbrown">
              {returnStatusLabels[request.status] ?? request.status} — reference{" "}
              {request.id.slice(0, 8).toUpperCase()}
              {formatReturnDate(request.createdAt)
                ? `, ${formatReturnDate(request.createdAt)}`
                : ""}
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  if (returnableItems.length === 0) {
    return (
      <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
        <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
          Returns
        </p>
        <h2 className="mt-3 font-display text-2xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
          A return is already in progress.
        </h2>
        <p className="mt-3 text-sm leading-7 text-stone">
          Every item in this order is covered by an existing return request.
          You can follow its status in My Returns.
        </p>
        {existingReturnsBlock}
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
          quantity: Math.min(
            selected[item.id]?.quantity ?? 1,
            remainingByItemId.get(item.id) ?? 1,
          ),
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

      {existingReturnsBlock}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3">
          {returnableItems.map((item) => {
            const state = selected[item.id] ?? { checked: false, quantity: 1 };
            const remaining = remainingByItemId.get(item.id) ?? item.quantity;
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
                    {[
                      item.selectedSize ? `Size ${item.selectedSize}` : null,
                      `Qty ${item.quantity}`,
                      remaining < item.quantity
                        ? `${remaining} still returnable`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {state.checked && remaining > 1 ? (
                    <span className="mt-2 flex items-center gap-2 text-xs text-stone">
                      Return qty
                      <select
                        value={Math.min(state.quantity, remaining)}
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
                        {Array.from({ length: remaining }, (_, index) => index + 1).map(
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
