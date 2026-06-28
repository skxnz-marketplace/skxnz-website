"use client";

import { useMemo, useState } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { DataTable } from "@/components/sections/data-table";
import { StatusBadge } from "@/components/sections/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AdminReturnsPanel() {
  const { returnRequests } = useMarketplace();
  const [selectedReturnId, setSelectedReturnId] = useState(
    returnRequests[0]?.id ?? "",
  );

  const selectedReturn = useMemo(
    () =>
      returnRequests.find((request) => request.id === selectedReturnId) ??
      returnRequests[0],
    [returnRequests, selectedReturnId],
  );

  if (returnRequests.length === 0) {
    return (
      <EmptyState
        title="No return requests yet."
        description="Return requests will appear here once they are created in local MVP state."
      />
    );
  }

  return (
    <div className="space-y-6">
      <DataTable
        eyebrow="Admin Returns"
        title="Return management table"
        description="Review placeholders only. Real pickup, refund processing, and warehouse flow are not connected."
        columns={[
          "Return ID",
          "Order ID",
          "Buyer",
          "Seller",
          "Product",
          "Reason",
          "Return Status",
          "Refund Status",
          "Review Placeholder",
        ]}
        rows={returnRequests.map((request) => ({
          id: request.id,
          cells: [
            request.id,
            request.orderId,
            request.buyerName,
            request.sellerName,
            request.productName,
            request.reason,
            <StatusBadge key={`${request.id}-return`} label={request.returnStatus} />,
            <StatusBadge key={`${request.id}-refund`} label={request.refundStatus} />,
            <Button
              key={`${request.id}-review`}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedReturnId(request.id)}
            >
              Review Placeholder
            </Button>,
          ],
        }))}
      />

      {selectedReturn ? (
        <Card className="section-border rounded-[32px] p-6 sm:p-8">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
            Return Review Detail
          </p>
          <div className="mt-5 grid gap-6 xl:grid-cols-3">
            <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-6 text-silver">
              <p className="text-pearl">Return ID: {selectedReturn.id}</p>
              <p className="mt-2">Order ID: {selectedReturn.orderId}</p>
              <p className="mt-2">Buyer: {selectedReturn.buyerName}</p>
              <p className="mt-2">Seller: {selectedReturn.sellerName}</p>
              <p className="mt-2">Product: {selectedReturn.productName}</p>
            </div>
            <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-6 text-silver">
              <p className="text-pearl">Issue details</p>
              <p className="mt-2">Reason: {selectedReturn.reason}</p>
              <p className="mt-2">Issue type: {selectedReturn.issueType}</p>
              <p className="mt-2">Created: {selectedReturn.createdAt}</p>
            </div>
            <div className="rounded-[24px] border border-sangria/20 bg-sangria/10 p-5 text-sm leading-6 text-silver">
              Review placeholder only. Real reverse logistics, approvals, and refunds
              are not connected in MVP mode.
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
