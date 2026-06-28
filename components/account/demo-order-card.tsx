"use client";

import { useState } from "react";

import { OrderDetailDemo } from "@/components/account/order-detail-demo";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatProductPrice } from "@/lib/data/products";
import type { DemoOrder } from "@/lib/types/skxnz-data";

export function DemoOrderCard({ order }: { order: DemoOrder }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="section-border overflow-hidden rounded-[32px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-0">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.08)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-sangria">
              {order.status}
            </span>
            <span className="rounded-full border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-stone">
              {order.source === "demo-checkout"
                ? "Internal checkout record"
                : "Seeded demo order"}
            </span>
          </div>

          <h3 className="mt-4 break-words text-xl font-black text-midnightbrown">
            {order.id}
          </h3>
          <p className="mt-2 text-sm leading-6 text-stone">
            {new Date(order.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <SummaryPill label="Items" value={order.items.length.toString()} />
            <SummaryPill label="Total" value={formatProductPrice(order.total)} />
            <SummaryPill label="Payment" value={order.paymentLabel} />
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between border-t border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-5 sm:p-6 lg:border-l lg:border-t-0">
          <p className="text-sm leading-6 text-stone">
            Demo order only. No live fulfillment, payment capture, or delivery
            tracking is connected.
          </p>
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className={buttonVariants({
              variant: isOpen ? "secondary" : "primary",
              size: "md",
              className: "mt-5 w-full",
            })}
          >
            {isOpen ? "Hide Details" : "View Details"}
          </button>
        </div>
      </div>

      {isOpen ? <OrderDetailDemo order={order} /> : null}
    </Card>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[20px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] px-4 py-3">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-stone">
        {label}
      </p>
      <p className="mt-1 line-clamp-1 break-words font-black text-midnightbrown">
        {value}
      </p>
    </div>
  );
}
