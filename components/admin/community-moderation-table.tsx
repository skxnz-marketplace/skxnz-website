"use client";

import { useState, useTransition } from "react";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DataTable } from "@/components/sections/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminResolveCommunityReport, type ModerationAction } from "@/lib/community/admin-community-actions";
import type { AdminCommunityReport } from "@/lib/community/admin-read-community";

type CommunityModerationTableProps = {
  reports: AdminCommunityReport[];
};

function badgeTone(status: string): "warning" | "danger" | "success" | "info" {
  if (status === "resolved") return "success";
  if (status === "dismissed") return "info";
  return "warning";
}

export function CommunityModerationTable({ reports }: CommunityModerationTableProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const resolve = (report: AdminCommunityReport, action: ModerationAction) => {
    setPendingReportId(report.id);
    startTransition(async () => {
      const result = await adminResolveCommunityReport({
        reportId: report.id,
        postId: report.postId,
        action,
      });
      setMessage(result.ok ? "" : result.message);
      setPendingReportId(null);
    });
  };

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-[18px] border border-[rgba(217,70,239,0.28)] bg-[rgba(217,70,239,0.10)] px-4 py-3 text-sm text-white">
          {message}
        </p>
      ) : null}

      <DataTable
        eyebrow="Community Moderation"
        title="Reported posts"
        description="Hide takes the post out of the public feed. Delete marks it removed permanently. Both are real, immediate actions."
        columns={["Reported user", "Post", "Reason", "Status", "Reported", "Actions"]}
        rows={reports.map((report) => ({
          id: report.id,
          cells: [
            report.postAuthor,
            report.postCaption.slice(0, 60) || "(no caption)",
            report.reason,
            <AdminStatusBadge
              key={`${report.id}-status`}
              label={report.status}
              tone={badgeTone(report.status)}
            />,
            new Date(report.createdAt).toLocaleString(),
            <div key={`${report.id}-actions`} className="flex min-w-[18rem] flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isPending && pendingReportId === report.id}
                onClick={() => resolve(report, "hide")}
              >
                Hide post
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isPending && pendingReportId === report.id}
                onClick={() => resolve(report, "dismiss")}
              >
                Dismiss
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isPending && pendingReportId === report.id}
                onClick={() => resolve(report, "delete")}
              >
                Delete post
              </Button>
            </div>,
          ],
        }))}
      />

      {reports.length === 0 ? (
        <Card className="section-border rounded-[32px] p-6 sm:p-8">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
            Moderation Queue
          </p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
            No reports right now.
          </h2>
        </Card>
      ) : null}
    </div>
  );
}
