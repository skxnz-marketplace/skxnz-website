import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderReturnPanel } from "@/components/orders/order-return-panel";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatInrFromPaise } from "@/lib/money";
import {
  describeOrderStatus,
  getBuyerOrderById,
} from "@/lib/orders/read-buyer-orders";
import { getOrderReturnSummary } from "@/lib/returns/read-return-requests";

// Buyer order detail (D4-4). Server component: reads ONE buyer-owned order
// via the session-scoped Supabase client. RLS + the explicit buyer_id filter
// mean another buyer's order id returns zero rows -> notFound(), with no
// existence leak. buyer identity is never taken from the URL.
//
// No payment UI, no tracking UI, no delivery estimates. DRAFT and
// PAYMENT_PENDING are labeled unpaid.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order Detail — SKXNZ",
  description: "Detail for one SKXNZ order in your account.",
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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getBuyerOrderById(id);

  if (!result.backendReady) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-8 text-center">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Buyer Orders
          </p>
          <h1 className="mx-auto mt-4 max-w-[18ch] break-words font-display text-4xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
            Order backend is not connected yet.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone">
            The order database has not been switched on for this environment,
            so there is no order to read at this address.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/orders" className={buttonVariants({ variant: "primary" })}>
              Back To Orders
            </Link>
            <Link href="/shop" className={buttonVariants({ variant: "secondary" })}>
              Back To Shop
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!result.order) {
    notFound();
  }

  const order = result.order;
  const status = describeOrderStatus(order.status);
  const isUnpaid = order.status === "DRAFT" || order.status === "PAYMENT_PENDING";
  // Existing return requests for this order (only matters once DELIVERED;
  // cheap no-op reads otherwise since none can exist).
  const returnSummary =
    order.status === "DELIVERED"
      ? await getOrderReturnSummary(order.id)
      : { requests: [], claimedQuantities: {} };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="space-y-6">
        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
                Order {order.id.slice(0, 8).toUpperCase()}
              </p>
              <h1 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown sm:text-4xl">
                {status.label}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone">
                {status.note}
              </p>
              <p className="mt-2 text-xs text-stone">
                Created {formatOrderDate(order.createdAt)}
              </p>
            </div>
            <Link
              href="/orders"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              All Orders
            </Link>
          </div>

          {isUnpaid ? (
            <div className="mt-5 rounded-[20px] border border-[rgba(58,8,24,0.14)] bg-[rgba(58,8,24,0.04)] p-4">
              <p className="text-xs leading-6 text-midnightbrown">
                No payment has been taken for this order and nothing will ship
                until checkout is completed. There is no tracking, delivery
                date, or payment reference to show because none exist.
              </p>
            </div>
          ) : null}
        </Card>

        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Items
          </p>
          <div className="mt-4 divide-y divide-[rgba(58,8,24,0.08)]">
            {order.items.length === 0 ? (
              <p className="py-4 text-sm leading-7 text-stone">
                This order has no line items recorded.
              </p>
            ) : (
              order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-4 py-4"
                >
                  <div className="flex items-start gap-4">
                    {item.imageSnapshot ? (
                      // Snapshot URL stored at order time; plain img keeps this
                      // resilient if the catalog image is later removed.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageSnapshot}
                        alt={item.titleSnapshot}
                        className="h-16 w-16 rounded-[14px] border border-[rgba(58,8,24,0.1)] object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-[14px] border border-[rgba(58,8,24,0.1)] bg-[rgba(58,8,24,0.05)]" />
                    )}
                    <div>
                      {item.brandSnapshot ? (
                        <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-sangria">
                          {item.brandSnapshot}
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm font-semibold text-midnightbrown">
                        {item.titleSnapshot}
                      </p>
                      <p className="mt-1 text-xs text-stone">
                        {[
                          item.selectedSize ? `Size ${item.selectedSize}` : null,
                          item.selectedColor ?? null,
                          `Qty ${item.quantity}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-midnightbrown">
                      {formatInrFromPaise(item.lineTotalPaise)}
                    </p>
                    <p className="mt-1 text-xs text-stone">
                      {formatInrFromPaise(item.unitPricePaise)} each
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-[rgba(58,8,24,0.12)] pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-stone">Subtotal</span>
              <span className="font-semibold text-midnightbrown">
                {formatInrFromPaise(order.subtotalPaise)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone">Delivery</span>
              <span className="text-stone">
                {order.shippingPaise !== null
                  ? formatInrFromPaise(order.shippingPaise)
                  : "Calculated at live checkout"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone">Taxes</span>
              <span className="text-stone">
                {order.taxPaise !== null
                  ? formatInrFromPaise(order.taxPaise)
                  : "Calculated at live checkout"}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[rgba(58,8,24,0.08)] pt-2">
              <span className="font-semibold text-midnightbrown">
                {order.totalPaise !== null ? "Total" : "Estimated payable"}
              </span>
              <span className="font-semibold text-midnightbrown">
                {formatInrFromPaise(order.totalPaise ?? order.subtotalPaise)}
              </span>
            </div>
            {order.totalPaise === null ? (
              <p className="text-[0.7rem] leading-5 text-stone">
                Estimate before delivery and taxes. The final amount is fixed at
                live checkout — nothing has been charged.
              </p>
            ) : null}
          </div>
        </Card>

        {order.shippingAddress ? (
          <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Shipping Address
            </p>
            <p className="mt-3 text-sm leading-7 text-midnightbrown">
              {[
                order.shippingAddress.line1,
                order.shippingAddress.line2,
                [order.shippingAddress.city, order.shippingAddress.state]
                  .filter(Boolean)
                  .join(", "),
                [order.shippingAddress.pincode, order.shippingAddress.country]
                  .filter(Boolean)
                  .join(" · "),
              ]
                .filter(Boolean)
                .map((line, index) => (
                  <span key={index} className="block">
                    {line}
                  </span>
                ))}
            </p>
            {order.deliveryNote ? (
              <p className="mt-3 text-xs leading-6 text-stone">
                Delivery note: {order.deliveryNote}
              </p>
            ) : null}
          </Card>
        ) : null}

        <OrderReturnPanel
          orderId={order.id}
          status={order.status}
          items={order.items}
          existingReturns={returnSummary.requests}
          claimedQuantities={returnSummary.claimedQuantities}
        />

        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Need help with this order?
          </p>
          <p className="mt-3 text-sm leading-7 text-stone">
            Open a support ticket about this order. A human reviews every ticket.
          </p>
          <Link
            href={`/account/support?order=${order.id}`}
            className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-4`}
          >
            Contact Support About This Order
          </Link>
        </Card>
      </div>
    </div>
  );
}
