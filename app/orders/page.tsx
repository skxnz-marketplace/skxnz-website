import Link from "next/link";

import { OrderReadinessPanel } from "@/components/orders/order-readiness-panel";
import { PageIntro } from "@/components/sections/page-intro";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatInrFromPaise } from "@/lib/money";
import {
  describeOrderStatus,
  getBuyerOrders,
} from "@/lib/orders/read-buyer-orders";

// Buyer order history (D4-4). Server component: reads the authenticated
// buyer's OWN orders via the session-scoped Supabase client (RLS enforced).
// Route protection is the real server-side middleware gate (/orders requires
// a signed-in user), not the old client-only demo gate.
//
// Honesty rules: only real DB orders are listed. No demo rows, no fake
// statuses. DRAFT/PAYMENT_PENDING are labeled unpaid. If the commerce
// migration is not applied yet, an explicit backend-not-ready state renders.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your Orders — SKXNZ",
  description: "Order history for your SKXNZ account.",
};

function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function OrdersPage() {
  const result = await getBuyerOrders();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="space-y-6">
        <PageIntro
          eyebrow="Buyer Orders"
          title="Your orders, only when they are real."
          description="SKXNZ lists only orders that exist in your account. Draft orders are clearly marked unpaid — nothing here claims payment or delivery that has not happened."
          actions={
            <>
              <Link
                href="/shop"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Back To Shop
              </Link>
              <Link
                href="/support"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                Support
              </Link>
            </>
          }
        />

        {!result.backendReady ? (
          <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-8">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Order history
            </p>
            <h2 className="mt-3 max-w-[20ch] font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
              Order backend is not connected yet.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone">
              The order database has not been switched on for this environment,
              so there is no order history to read. No orders have been lost —
              none exist yet.
            </p>
          </Card>
        ) : result.orders.length === 0 ? (
          <OrderReadinessPanel />
        ) : (
          <div className="space-y-4">
            {result.orders.map((order) => {
              const status = describeOrderStatus(order.status);
              return (
                <Card
                  key={order.id}
                  className="section-border rounded-[28px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-sangria">
                        Order {order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-midnightbrown">
                        {status.label}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-stone">
                        {status.note}
                      </p>
                      <p className="mt-2 text-xs text-stone">
                        Placed {formatOrderDate(order.createdAt)}
                        {order.itemCount > 0
                          ? ` · ${order.itemCount} item${order.itemCount === 1 ? "" : "s"}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.66rem] uppercase tracking-[0.2em] text-stone">
                        {order.totalPaise !== null ? "Total" : "Subtotal"}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-midnightbrown">
                        {formatInrFromPaise(order.totalPaise ?? order.subtotalPaise)}
                      </p>
                      {order.totalPaise === null ? (
                        <p className="mt-1 max-w-[22ch] text-[0.7rem] leading-5 text-stone">
                          Delivery and taxes are added at live checkout.
                        </p>
                      ) : null}
                      <Link
                        href={`/orders/${order.id}`}
                        className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-3 inline-flex`}
                      >
                        View Order
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
