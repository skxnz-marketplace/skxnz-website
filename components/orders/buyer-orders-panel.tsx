"use client";

import Link from "next/link";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { DataTable } from "@/components/sections/data-table";
import { StatusBadge } from "@/components/sections/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/data/orders";

export function BuyerOrdersPanel() {
  const { buyerOrders } = useMarketplace();

  if (buyerOrders.length === 0) {
    return (
      <EmptyState
        title="No buyer orders in this MVP session."
        description="Orders are currently seeded mock data only. Real checkout and order creation are not connected yet."
        actionHref="/shop"
        actionLabel="Back To Shop"
      />
    );
  }

  return (
    <div className="space-y-6">
      <DataTable
        eyebrow="Buyer Orders"
        title="Order overview"
        description="Orders are MVP mock data. Real checkout, payment, delivery, and refunds are not live yet."
        columns={[
          "Order ID",
          "Product Name",
          "Seller Name",
          "Amount",
          "Order Status",
          "Payment Status",
          "Delivery Status",
          "Return Status",
          "View Details",
        ]}
        rows={buyerOrders.map((order) => ({
          id: order.id,
          cells: [
            order.id,
            order.productName,
            order.sellerName,
            formatCurrency(order.amount),
            <StatusBadge key={`${order.id}-order`} label={order.orderStatus} />,
            <StatusBadge key={`${order.id}-payment`} label={order.paymentStatus} />,
            <StatusBadge key={`${order.id}-delivery`} label={order.deliveryStatus} />,
            <StatusBadge key={`${order.id}-return`} label={order.returnStatus} />,
            <Link
              key={`${order.id}-link`}
              href={`/orders/${order.id}`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              View Details
            </Link>,
          ],
        }))}
      />

      <Card className="section-border rounded-[32px] p-6 text-sm leading-6 text-silver">
        Buyer order visibility is powered by local MVP state only. No live checkout,
        payment capture, delivery tracking, or refund processing is connected yet.
      </Card>
    </div>
  );
}
