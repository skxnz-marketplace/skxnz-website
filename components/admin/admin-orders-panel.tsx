"use client";

import { useMemo, useState } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { StatusBadge } from "@/components/sections/status-badge";
import { DataTable } from "@/components/sections/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/data/orders";

export function AdminOrdersPanel() {
  const { orders, setAdminOrderActionState } = useMarketplace();
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? "");

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? orders[0],
    [orders, selectedOrderId],
  );

  return (
    <div className="space-y-6">
      <DataTable
        eyebrow="Admin Orders"
        title="Order management table"
        description="Refunds are not live in MVP."
        columns={[
          "Order ID",
          "Buyer",
          "Seller",
          "Product",
          "Amount",
          "Payment Status",
          "Order Status",
          "Delivery Status",
          "Return Status",
          "Admin Action Placeholder",
        ]}
        rows={orders.map((order) => ({
          id: order.id,
          cells: [
            order.id,
            order.buyerName,
            order.sellerName,
            order.productName,
            formatCurrency(order.amount),
            <StatusBadge key={`${order.id}-payment`} label={order.paymentStatus} />,
            <StatusBadge key={`${order.id}-order`} label={order.orderStatus} />,
            <StatusBadge key={`${order.id}-delivery`} label={order.deliveryStatus} />,
            <StatusBadge key={`${order.id}-return`} label={order.returnStatus} />,
            <div key={`${order.id}-actions`} className="flex min-w-[13rem] flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOrderId(order.id)}
              >
                View Order
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setAdminOrderActionState(order.id, "Reviewed")}
              >
                Mark Reviewed
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAdminOrderActionState(order.id, "Escalated")}
              >
                Escalate Issue
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAdminOrderActionState(order.id, "Refund Placeholder")}
              >
                Refund Placeholder
              </Button>
            </div>,
          ],
        }))}
      />

      {selectedOrder ? (
        <Card className="section-border rounded-[32px] p-6 sm:p-8">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
            Admin Order Detail
          </p>
          <div className="mt-5 grid gap-6 xl:grid-cols-3">
            <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-6 text-silver">
              <p className="text-pearl">Order ID: {selectedOrder.id}</p>
              <p className="mt-2">Buyer: {selectedOrder.buyerName}</p>
              <p className="mt-2">Seller: {selectedOrder.sellerName}</p>
              <p className="mt-2">Product: {selectedOrder.productName}</p>
            </div>
            <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-6 text-silver">
              <p className="text-pearl">Admin action state</p>
              <div className="mt-3">
                <StatusBadge label={selectedOrder.adminActionState} />
              </div>
              <p className="mt-3">Updated: {selectedOrder.updatedAt}</p>
            </div>
            <div className="rounded-[24px] border border-sangria/20 bg-sangria/10 p-5 text-sm leading-6 text-silver">
              Refunds are not live in MVP. Payment, delivery, and return decisions
              remain review placeholders only.
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
