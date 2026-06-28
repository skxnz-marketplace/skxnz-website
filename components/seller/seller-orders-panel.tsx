"use client";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { DataTable } from "@/components/sections/data-table";
import { StatusBadge } from "@/components/sections/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/data/orders";

export function SellerOrdersPanel() {
  const { orders, advanceOrderStatus } = useMarketplace();

  return (
    <div className="space-y-6">
      <DataTable
        eyebrow="Seller Orders"
        title="Seller order table"
        description="Seller status updates are MVP placeholders until database workflow is connected."
        columns={[
          "Order ID",
          "Product",
          "Buyer City",
          "Amount",
          "Order Status",
          "Payment Status",
          "Dispatch Status",
          "Delivery Status",
          "Return Status",
          "Update Status",
        ]}
        rows={orders.map((order) => ({
          id: order.id,
          cells: [
            order.id,
            order.productName,
            order.buyerCity,
            formatCurrency(order.amount),
            <StatusBadge key={`${order.id}-order`} label={order.orderStatus} />,
            <StatusBadge key={`${order.id}-payment`} label={order.paymentStatus} />,
            <StatusBadge key={`${order.id}-dispatch`} label={order.dispatchStatus} />,
            <StatusBadge key={`${order.id}-delivery`} label={order.deliveryStatus} />,
            <StatusBadge key={`${order.id}-return`} label={order.returnStatus} />,
            <Button
              key={`${order.id}-advance`}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => advanceOrderStatus(order.id)}
            >
              Update Status
            </Button>,
          ],
        }))}
      />

      <Card className="section-border rounded-[32px] p-6 text-sm leading-6 text-silver">
        Seller status updates are MVP placeholders until database workflow is
        connected. No real payouts, carrier labels, or dispatch sync are live here.
      </Card>
    </div>
  );
}
