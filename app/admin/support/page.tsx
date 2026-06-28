"use client";

import Link from "next/link";
import { useState } from "react";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import {
  useMarketplace,
  type SupportTicketRecord,
} from "@/components/marketplace/marketplace-provider";
import { DataTable } from "@/components/sections/data-table";
import { StatusBadge } from "@/components/sections/status-badge";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminSidebarLinks } from "@/lib/data/site-content";

export default function AdminSupportPage() {
  const { supportTickets } = useMarketplace();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketRecord | null>(
    supportTickets[0] ?? null,
  );
  const [respondedTicketIds, setRespondedTicketIds] = useState<string[]>([]);

  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin support queue"
      helperText="Support operations are still placeholder-only, but the admin queue stays behind the demo role gate so workflow reviews remain internal."
    >
      <DashboardShell
        eyebrow="Support Tickets"
        title="Keep buyer and seller issues visible during private testing."
        description="Support stays simple in the first MVP, but the queue structure now reads browser-local ticket intake from the buyer support route."
        actions={
          <>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Dashboard
            </Link>
            <Link
              href="/support"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Support Surface
            </Link>
          </>
        }
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/support"
      >
        <DataTable
          eyebrow="Support"
          title="Support ticket table"
          description="The admin support queue is still mock-only, but it now reflects browser-local support tickets created through the buyer support flow."
          columns={[
            "Ticket ID",
            "User Type",
            "Name",
            "Issue Type",
            "Priority",
            "Status",
            "Created Date",
            "View Details",
            "Respond Demo",
          ]}
          rows={supportTickets.map((ticket) => ({
            id: ticket.id,
            cells: [
              ticket.id,
              ticket.userType,
              ticket.name,
              ticket.issueType,
              <Badge key={`${ticket.id}-priority`}>{ticket.priority}</Badge>,
              <StatusBadge key={`${ticket.id}-status`} label={ticket.status} />,
              ticket.createdAt,
              <button
                key={`${ticket.id}-details`}
                type="button"
                onClick={() => setSelectedTicket(ticket)}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                View Details
              </button>,
              <button
                key={`${ticket.id}-respond`}
                type="button"
                onClick={() =>
                  setRespondedTicketIds((currentIds) =>
                    currentIds.includes(ticket.id)
                      ? currentIds
                      : [ticket.id, ...currentIds],
                  )
                }
                className={buttonVariants({
                  variant: respondedTicketIds.includes(ticket.id)
                    ? "secondary"
                    : "ghost",
                  size: "sm",
                })}
              >
                {respondedTicketIds.includes(ticket.id)
                  ? "Response Demo Logged"
                  : "Respond Demo"}
              </button>,
            ],
          }))}
        />

        {selectedTicket ? (
          <Card className="section-border rounded-[32px] p-6 sm:p-8">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
              View Details Placeholder
            </p>
            <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
              {selectedTicket.id}
            </h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-6 text-silver">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-teal">
                  Requester
                </p>
                <p className="mt-2">{selectedTicket.name}</p>
                <p className="mt-2">{selectedTicket.contact}</p>
              </div>
              <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-6 text-silver">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-teal">
                  Ticket Meta
                </p>
                <p className="mt-2">User type: {selectedTicket.userType}</p>
                <p className="mt-2">Issue type: {selectedTicket.issueType}</p>
                <p className="mt-2">Order ID: {selectedTicket.orderId || "Not provided"}</p>
              </div>
            </div>
            <div className="mt-4 rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-6 text-silver">
              {selectedTicket.message}
            </div>
          </Card>
        ) : null}

        <Card className="section-border rounded-[32px] p-6 text-sm leading-6 text-silver">
          Real support email routing, real database persistence, and real authentication
          are not connected in this MVP. Respond Demo only updates local UI state.
        </Card>
      </DashboardShell>
    </DemoRoleGate>
  );
}
