"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { DataTable } from "@/components/sections/data-table";
import { StatusBadge } from "@/components/sections/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { demoBuyerName } from "@/lib/data/orders";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[20px] px-4 py-3 text-sm";

const textareaClassName =
  "field-shell w-full min-w-0 max-w-full break-words rounded-[24px] px-4 py-3 text-sm";

export function ReturnRequestWorkspace() {
  const searchParams = useSearchParams();
  const { buyerOrders, returnRequests, createReturnRequest } = useMarketplace();
  const buyerReturnRequests = returnRequests.filter(
    (request) => request.buyerName === demoBuyerName,
  );

  const initialForm = {
    orderId: searchParams.get("orderId") ?? buyerOrders[0]?.id ?? "",
    productName:
      searchParams.get("productName") ?? buyerOrders[0]?.productName ?? "",
    reason: "Size mismatch after first try-on",
    issueType: "Size and fit",
    photoProofLink: "https://placeholder.skxnz.local/returns/new-proof.jpg",
    message: "",
  };

  const [form, setForm] = useState(initialForm);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextRequest = createReturnRequest({
      orderId: form.orderId.trim(),
      productName: form.productName.trim(),
      reason: form.reason.trim(),
      issueType: form.issueType.trim(),
      photoProofLink: form.photoProofLink.trim(),
      message: form.message.trim(),
    });

    if (!nextRequest) {
      setErrorMessage(
        "The selected order could not be found in local MVP state. Choose a seeded buyer order ID and try again.",
      );
      setSuccessMessage(null);
      return;
    }

    setSuccessMessage(
      "Return request created in MVP mode. Real return pickup and refund processing are not connected yet.",
    );
    setErrorMessage(null);
    setForm({
      ...initialForm,
      orderId: nextRequest.orderId,
      productName: nextRequest.productName,
    });
  }

  return (
    <div className="space-y-6">
      <Card className="section-border rounded-[36px] p-6 sm:p-8">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Order ID
              </span>
              <input
                list="buyer-order-options"
                value={form.orderId}
                onChange={(event) => updateField("orderId", event.target.value)}
                placeholder="SKX-1008"
                className={fieldClassName}
                required
              />
              <datalist id="buyer-order-options">
                {buyerOrders.map((order) => (
                  <option key={order.id} value={order.id} />
                ))}
              </datalist>
            </label>
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Product name
              </span>
              <input
                type="text"
                value={form.productName}
                onChange={(event) => updateField("productName", event.target.value)}
                placeholder="Signal Flow Tee"
                className={fieldClassName}
                required
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Reason for return
              </span>
              <input
                type="text"
                value={form.reason}
                onChange={(event) => updateField("reason", event.target.value)}
                placeholder="Size mismatch after first try-on"
                className={fieldClassName}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
                Issue type
              </span>
              <input
                type="text"
                value={form.issueType}
                onChange={(event) => updateField("issueType", event.target.value)}
                placeholder="Size and fit"
                className={fieldClassName}
                required
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Photo proof link placeholder
            </span>
            <input
              type="url"
              value={form.photoProofLink}
              onChange={(event) =>
                updateField("photoProofLink", event.target.value)
              }
              placeholder="https://placeholder.skxnz.local/returns/proof.jpg"
              className={fieldClassName}
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-silver">
              Message
            </span>
            <textarea
              rows={5}
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder="Share the sizing, quality, or order issue so the mock return flow is clear."
              className={textareaClassName}
              required
            />
          </label>

          {successMessage ? (
            <div className="rounded-[24px] border border-teal/20 bg-teal/10 p-4 text-sm leading-6 text-pearl break-words">
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-silver break-words">
              {errorMessage}
            </div>
          ) : null}

          <div className="rounded-[24px] border border-sangria/20 bg-sangria/10 p-4 text-sm leading-6 text-silver break-words">
            Return requests are local MVP records only. Real pickup scheduling,
            delivery API sync, and refund processing are not connected yet.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Create Return Request
            </Button>
            <Link
              href="/orders"
              className={`${buttonVariants({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}
            >
              Review Orders
            </Link>
          </div>
        </form>
      </Card>

      {buyerReturnRequests.length > 0 ? (
        <DataTable
          eyebrow="Buyer Returns"
          title="Return requests"
          description="These return rows are buyer-visible MVP mock data only."
          columns={[
            "Return ID",
            "Order ID",
            "Product",
            "Reason",
            "Return Status",
            "Refund Status",
            "View Order",
          ]}
          rows={buyerReturnRequests.map((request) => ({
            id: request.id,
            cells: [
              request.id,
              request.orderId,
              request.productName,
              request.reason,
              <StatusBadge key={`${request.id}-return`} label={request.returnStatus} />,
              <StatusBadge key={`${request.id}-refund`} label={request.refundStatus} />,
              <Link
                key={`${request.id}-view`}
                href={`/orders/${request.orderId}`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                View Order
              </Link>,
            ],
          }))}
        />
      ) : (
        <EmptyState
          title="No return requests yet."
          description="Return cases will appear here after they are created in local MVP state."
        />
      )}
    </div>
  );
}
