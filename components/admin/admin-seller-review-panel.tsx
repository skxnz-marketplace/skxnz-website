"use client";

import { useMemo, useState } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { StatusBadge } from "@/components/sections/status-badge";
import { AdminApprovalTable } from "@/components/tables/admin-approval-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function formatBooleanLabel(value: boolean) {
  return value ? "Yes" : "No";
}

function resolveSellerType(productCategory: string) {
  const normalizedCategory = productCategory.toLowerCase();

  if (normalizedCategory.includes("streetwear")) {
    return "Streetwear seller";
  }

  if (normalizedCategory.includes("luxury")) {
    return "Luxury seller";
  }

  if (normalizedCategory.includes("graphic") || normalizedCategory.includes("basics")) {
    return "Brand";
  }

  if (normalizedCategory.includes("accessories")) {
    return "Boutique";
  }

  return "Designer";
}

export function AdminSellerReviewPanel() {
  const { sellerApplications, updateSellerApplicationStatus } = useMarketplace();
  const [selectedSellerId, setSelectedSellerId] = useState(
    sellerApplications[0]?.id ?? "",
  );

  const selectedApplication = useMemo(
    () =>
      sellerApplications.find((application) => application.id === selectedSellerId) ??
      sellerApplications[0],
    [selectedSellerId, sellerApplications],
  );

  const statusCounts = useMemo(
    () => ({
      pending: sellerApplications.filter(
        (application) => application.status === "Pending Review",
      ).length,
      approved: sellerApplications.filter(
        (application) => application.status === "Approved",
      ).length,
      rejected: sellerApplications.filter(
        (application) => application.status === "Rejected",
      ).length,
      needsMoreInfo: sellerApplications.filter(
        (application) => application.status === "Needs More Info",
      ).length,
    }),
    [sellerApplications],
  );

  if (sellerApplications.length === 0) {
    return (
      <EmptyState
        title="No seller applications yet."
        description="Seller applications will appear here once the local MVP onboarding form is submitted."
        actionHref="/sell"
        actionLabel="Open Seller Application"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="section-border rounded-[32px] p-6 sm:p-8">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
          Seller Review Status
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <StatusBadge label={`${statusCounts.pending} Pending Review`} />
          <StatusBadge label={`${statusCounts.approved} Approved`} />
          <StatusBadge label={`${statusCounts.rejected} Rejected`} />
          <StatusBadge label={`${statusCounts.needsMoreInfo} Needs More Info`} />
        </div>
        <p className="mt-4 max-w-3xl text-wrap-safe break-words text-sm leading-7 text-silver">
          MVP placeholder — real database approval not connected yet. These seller
          review actions update browser-local state only, so the approval flow can be
          tested safely before live persistence or notifications are introduced.
        </p>
      </Card>

      <AdminApprovalTable
        eyebrow="Seller Queue"
        title="Seller application table"
        description="Review store fit, operating readiness, and onboarding risk in one place before moving any seller deeper into the SKXNZ MVP."
        columns={[
          "Seller ID",
          "Store Name",
          "Seller Type",
          "Owner Name",
          "City",
          "Product Category",
          "GST Status",
          "Can Ship Orders",
          "Product Count",
          "Application Status",
          "Risk / Review Note",
          "View Details",
          "Approve",
          "Reject",
          "Need Info",
        ]}
        rows={sellerApplications.map((application) => ({
          id: application.id,
          cells: [
            application.id,
            application.storeName,
            resolveSellerType(application.productCategory),
            application.ownerName,
            application.city,
            application.productCategory,
            formatBooleanLabel(application.gstAvailable),
            formatBooleanLabel(application.canShipOrders),
            application.productCount.toString(),
            <StatusBadge
              key={`${application.id}-status`}
              label={application.status}
            />,
            <span
              key={`${application.id}-note`}
              className="block max-w-[16rem] break-words"
            >
              {application.riskNote}
            </span>,
            <Button
              key={`${application.id}-view`}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSellerId(application.id)}
            >
              View Details
            </Button>,
            <Button
              key={`${application.id}-approve`}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                updateSellerApplicationStatus(application.id, "Approved")
              }
            >
              Approve
            </Button>,
            <Button
              key={`${application.id}-reject`}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                updateSellerApplicationStatus(application.id, "Rejected")
              }
            >
              Reject
            </Button>,
            <Button
              key={`${application.id}-needs-info`}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                updateSellerApplicationStatus(application.id, "Needs More Info")
              }
            >
              Need Info
            </Button>,
          ],
        }))}
      />

      {selectedApplication ? (
        <Card className="section-border rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
                Seller Detail Review
              </p>
              <h2 className="mt-3 text-wrap-safe break-words font-display text-2xl uppercase leading-tight tracking-[0.12em] text-pearl">
                {selectedApplication.storeName}
              </h2>
              <p className="mt-3 max-w-3xl text-wrap-safe break-words text-sm leading-7 text-silver">
                Store information, contact information, onboarding notes, and the
                admin review checklist stay visible here for safer MVP moderation.
              </p>
            </div>
            <StatusBadge label={selectedApplication.status} />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            <Card className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-silver">
                Store Information
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-silver">
                <p className="break-words">
                  <span className="text-pearl">Seller ID:</span>{" "}
                  {selectedApplication.id}
                </p>
                <p className="break-words">
                  <span className="text-pearl">Store name:</span>{" "}
                  {selectedApplication.storeName}
                </p>
                <p className="break-words">
                  <span className="text-pearl">City:</span>{" "}
                  {selectedApplication.city}
                </p>
                <p className="break-words">
                  <span className="text-pearl">Category:</span>{" "}
                  {selectedApplication.productCategory}
                </p>
                <p className="break-words">
                  <span className="text-pearl">Product count:</span>{" "}
                  {selectedApplication.productCount}
                </p>
                <p className="break-words">
                  <span className="text-pearl">Price range:</span>{" "}
                  {selectedApplication.priceRange}
                </p>
              </div>
            </Card>

            <Card className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-silver">
                Contact Information
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-silver">
                <p className="break-words">
                  <span className="text-pearl">Owner name:</span>{" "}
                  {selectedApplication.ownerName}
                </p>
                <p className="break-words">
                  <span className="text-pearl">Phone:</span>{" "}
                  {selectedApplication.phoneNumber}
                </p>
                <p className="break-words">
                  <span className="text-pearl">Email:</span>{" "}
                  {selectedApplication.email}
                </p>
                <p className="break-words">
                  <span className="text-pearl">Instagram:</span>{" "}
                  {selectedApplication.instagramPage}
                </p>
                <p className="break-words">
                  <span className="text-pearl">GST available:</span>{" "}
                  {formatBooleanLabel(selectedApplication.gstAvailable)}
                </p>
                <p className="break-words">
                  <span className="text-pearl">Can ship orders:</span>{" "}
                  {formatBooleanLabel(selectedApplication.canShipOrders)}
                </p>
              </div>
            </Card>

            <Card className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-silver">
                Review Notes
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-silver">
                <p className="break-words">
                  <span className="text-pearl">Submitted:</span>{" "}
                  {selectedApplication.submittedAt}
                </p>
                <p className="break-words">
                  <span className="text-pearl">Risk note:</span>{" "}
                  {selectedApplication.riskNote}
                </p>
                <p className="break-words">
                  <span className="text-pearl">Product photo link:</span>{" "}
                  <span className="inline-flex max-w-full rounded-full border border-white/[0.10] bg-white/[0.05] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                    Placeholder reference only
                  </span>
                </p>
                <p className="break-words">
                  <span className="text-pearl">Seller notes:</span>{" "}
                  {selectedApplication.notes}
                </p>
              </div>
            </Card>
          </div>

          <Card className="mt-6 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-silver">
              Admin Review Checklist
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {selectedApplication.reviewChecklist.map((item) => (
                <div
                  key={item.label}
                  className="min-w-0 rounded-[22px] border border-white/[0.08] bg-obsidian/60 p-4"
                >
                  <p className="break-words text-sm leading-6 text-pearl">{item.label}</p>
                  <div className="mt-3">
                    <StatusBadge
                      label={item.complete ? "Checked" : "Review Needed"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Card>
      ) : null}
    </div>
  );
}
