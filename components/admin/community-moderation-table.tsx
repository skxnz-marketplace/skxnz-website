"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DataTable } from "@/components/sections/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getCommunityReports,
  seedCommunityPosts,
} from "@/lib/data/community";
import {
  seedAdminCommunityReports,
  type DemoAdminCommunityReport,
} from "@/lib/data/admin";

type ModerationAction = "Hidden Demo" | "Dismissed Demo" | "Delete UI Demo";

export function CommunityModerationTable() {
  const [localReports, setLocalReports] = useState<DemoAdminCommunityReport[]>([]);
  const [actionOverrides, setActionOverrides] = useState<Record<string, ModerationAction>>({});

  useEffect(() => {
    setLocalReports(
      getCommunityReports().map((report) => {
        const post = seedCommunityPosts.find((item) => item.id === report.postId);

        return {
          id: report.id,
          postId: report.postId,
          username: post?.username ?? "local.demo",
          reason: report.reason,
          status: "New Demo",
          createdAt: report.createdAt,
          note: report.note || "Local report from Signal Community MVP.",
        };
      }),
    );
  }, []);

  const reports = useMemo(
    () =>
      [...localReports, ...seedAdminCommunityReports].map((report) => ({
        ...report,
        status: actionOverrides[report.id] ?? report.status,
      })),
    [actionOverrides, localReports],
  );

  const selectedReport = reports[0];

  const setAction = (reportId: string, action: ModerationAction) => {
    setActionOverrides((current) => ({
      ...current,
      [reportId]: action,
    }));
  };

  return (
    <div className="space-y-6">
      <DataTable
        eyebrow="Community Moderation"
        title="Reported posts"
        description="Moderation actions are local UI demos only. Real takedown, audit logs, and public post changes are not connected."
        columns={[
          "Report ID",
          "Post ID",
          "User",
          "Reason",
          "Status",
          "Created",
          "Actions",
        ]}
        rows={reports.map((report) => ({
          id: report.id,
          cells: [
            report.id,
            report.postId,
            report.username,
            report.reason,
            <AdminStatusBadge
              key={`${report.id}-status`}
              label={report.status}
              tone={
                report.status === "Hidden Demo"
                  ? "warning"
                  : report.status === "Delete UI Demo"
                    ? "danger"
                    : report.status === "Dismissed Demo"
                      ? "success"
                      : "info"
              }
            />,
            report.createdAt,
            <div key={`${report.id}-actions`} className="flex min-w-[18rem] flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setAction(report.id, "Hidden Demo")}
              >
                Hide Demo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAction(report.id, "Dismissed Demo")}
              >
                Dismiss Demo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAction(report.id, "Delete UI Demo")}
              >
                Delete UI Demo
              </Button>
            </div>,
          ],
        }))}
      />

      <Card className="section-border rounded-[32px] p-6 sm:p-8">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
          Moderation Foundation
        </p>
        <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
          Production moderation is still required.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-silver">
          Hide, dismiss, and delete controls above are demo UI actions only. They
          do not permanently delete posts, notify users, or create production audit
          logs yet.
        </p>
        {selectedReport ? (
          <div className="mt-5 rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-7 text-silver">
            <span className="text-pearl">Latest report note:</span>{" "}
            {selectedReport.note}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
