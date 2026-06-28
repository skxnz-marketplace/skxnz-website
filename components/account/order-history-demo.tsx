"use client";

import { useEffect, useState } from "react";

import { DemoOrderCard } from "@/components/account/demo-order-card";
import {
  demoCheckoutOrderStorageKey,
  type DemoCheckoutOrder,
} from "@/components/checkout/demo-checkout-data";
import { Card } from "@/components/ui/card";
import {
  getAccountOrderHistory,
  upsertDemoCheckoutOrder,
} from "@/lib/data/orders";
import type { DemoOrder } from "@/lib/types/skxnz-data";

export function OrderHistoryDemo() {
  const [orders, setOrders] = useState<DemoOrder[]>([]);

  useEffect(() => {
    try {
      const rawCheckoutOrder = window.localStorage.getItem(
        demoCheckoutOrderStorageKey,
      );

      if (rawCheckoutOrder) {
        upsertDemoCheckoutOrder(
          JSON.parse(rawCheckoutOrder) as DemoCheckoutOrder,
        );
      }
    } catch {
      // Keep account order history readable even if a local checkout record is malformed.
    }

    setOrders(getAccountOrderHistory());
  }, []);

  return (
    <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
      <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
        Order history demo
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
        Internal order visibility
      </h2>
      <p className="mt-3 text-sm leading-7 text-stone">
        Real order history is not connected to account persistence yet. This
        area combines seeded demo orders with local internal checkout records.
      </p>

      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <DemoOrderCard key={order.id} order={order} />
        ))}
      </div>

      <p className="mt-5 rounded-[24px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-4 text-sm leading-6 text-midnightbrown">
        Demo orders are internal checkout records only. No live payment,
        delivery tracking, seller dispatch, or production order fulfillment is
        connected.
      </p>
    </Card>
  );
}
