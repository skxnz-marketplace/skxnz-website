"use client";

import { useMemo } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createCartSyncPreview, createCartSyncStatus } from "@/lib/data/cart-sync";

export function CartSyncStatusPanel() {
  const { cartItems } = useMarketplace();
  const syncStatus = useMemo(() => createCartSyncStatus(cartItems), [cartItems]);
  const syncPreview = useMemo(() => createCartSyncPreview(cartItems), [cartItems]);

  return (
    <div className="space-y-6">
      <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
        <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
          Cart sync prep
        </p>
        <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
          Guest cart bridge.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone">
          Cart sync is prepared for future account persistence. Today, the SKXNZ
          cart remains local to this browser and no cloud cart sync is live.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Local cart rows"
            value={syncStatus.localCartItemCount.toString()}
          />
          <MetricCard
            label="Total quantity"
            value={syncStatus.localCartQuantity.toString()}
          />
          <MetricCard
            label="Merge groups"
            value={syncPreview.mergeableItems.toString()}
          />
        </div>

        <div className="mt-6 rounded-[28px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-5 text-sm leading-7 text-midnightbrown">
          <p className="font-black uppercase tracking-[0.14em]">
            {syncStatus.mode.replaceAll("-", " ")}
          </p>
          <p className="mt-2">{syncStatus.message}</p>
          <p className="mt-2 text-stone">{syncStatus.nextStep}</p>
        </div>
      </Card>

      <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
        <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
          Future sync rules
        </p>
        <div className="mt-5 grid gap-4">
          {syncPreview.notes.map((note) => (
            <div
              key={note}
              className="rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-4 text-sm leading-7 text-stone"
            >
              {note}
            </div>
          ))}
        </div>
        <a
          href="/cart"
          className={buttonVariants({
            variant: "primary",
            size: "lg",
            className: "mt-6",
          })}
        >
          Review Local Cart
        </a>
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[24px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-5">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-stone">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-sangria">{value}</p>
    </div>
  );
}
