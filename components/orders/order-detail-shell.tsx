"use client";

import Link from "next/link";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { StatusBadge } from "@/components/sections/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createOrderTimeline, formatCurrency } from "@/lib/data/orders";

type OrderDetailShellProps = {
  orderId: string;
};

export function OrderDetailShell({ orderId }: OrderDetailShellProps) {
  const { getOrderById, getProductById } = useMarketplace();
  const order = getOrderById(orderId);

  if (!order) {
    return (
      <EmptyState
        title="Order not found in this MVP session."
        description="This order detail route reads only from browser-local mock data, so it can disappear if the local state changes."
        actionHref="/orders"
        actionLabel="Back To Orders"
      />
    );
  }

  const product = getProductById(order.productId);
  const timeline = createOrderTimeline(order);

  return (
    <div className="space-y-6">
      <Card className="section-border rounded-[36px] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
              Buyer Order Detail
            </p>
            <h1 className="mt-3 font-display text-3xl uppercase tracking-[0.14em] text-pearl">
              {order.id}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-silver">
              Order timeline, product information, seller information, delivery
              placeholder, payment placeholder, and return handling all remain safe
              MVP mock data in this route.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={order.orderStatus} />
            <StatusBadge label={order.paymentStatus} />
            <StatusBadge label={order.deliveryStatus} />
            <StatusBadge label={order.returnStatus} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/orders"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Back To Orders
          </Link>
          <Link
            href={`/returns?orderId=${order.id}&productName=${encodeURIComponent(order.productName)}`}
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            Return Request Placeholder
          </Link>
          <Link
            href={`/product/${order.productId}`}
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            View Product
          </Link>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="section-border rounded-[32px] p-6 sm:p-8">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
            Order Timeline
          </p>
          <div className="mt-6 space-y-4">
            {timeline.map((step) => (
              <div
                key={`${step.label}-${step.timestamp}`}
                className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display text-lg uppercase tracking-[0.12em] text-pearl">
                      {step.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-silver">
                      {step.detail}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <StatusBadge label={step.state} />
                    <span className="text-xs uppercase tracking-[0.22em] text-silver">
                      {step.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="section-border rounded-[32px] p-6">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
              Product Information
            </p>
            <div className="mt-4 rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="font-display text-2xl uppercase tracking-[0.12em] text-pearl">
                {order.productName}
              </p>
              <p className="mt-3 text-sm leading-6 text-silver">
                Seller: {order.sellerName}
              </p>
              <p className="mt-2 text-sm leading-6 text-silver">
                Amount: {formatCurrency(order.amount)}
              </p>
              {product ? (
                <>
                  <p className="mt-2 text-sm leading-6 text-silver">
                    Category: {product.category}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-silver">
                    Fabric: {product.fabric}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-silver">
                    Fit: {product.fit}
                  </p>
                </>
              ) : null}
            </div>
          </Card>

          <Card className="section-border rounded-[32px] p-6">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
              Delivery Placeholder
            </p>
            <div className="mt-4 rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-6 text-silver">
              <p className="text-pearl">Delivery status: {order.deliveryStatus}</p>
              <p className="mt-2">{order.deliveryNote}</p>
            </div>
          </Card>

          <Card className="section-border rounded-[32px] p-6">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
              Payment Placeholder
            </p>
            <div className="mt-4 rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-6 text-silver">
              <p className="text-pearl">Payment status: {order.paymentStatus}</p>
              <p className="mt-2">{order.paymentNote}</p>
            </div>
          </Card>

          <Card className="section-border rounded-[32px] p-6 text-sm leading-6 text-silver">
            Checkout, payment, and delivery are not live in MVP.
          </Card>
        </div>
      </div>
    </div>
  );
}
