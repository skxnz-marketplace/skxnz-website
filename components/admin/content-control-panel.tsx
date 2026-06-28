"use client";

import { useState } from "react";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DataTable } from "@/components/sections/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  demoAdminContentItems,
  type DemoAdminContentItem,
} from "@/lib/data/admin";

type ContentStatus = DemoAdminContentItem["status"];

export function ContentControlPanel() {
  const [contentItems, setContentItems] = useState(demoAdminContentItems);

  const updateStatus = (itemId: string, status: ContentStatus) => {
    setContentItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status,
              updatedAt: "Local demo update",
              note: `${item.note} Status changed in admin UI demo only.`,
            }
          : item,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <DataTable
        eyebrow="Content Control"
        title="Homepage and discovery content"
        description="Content controls are demo-only. This does not connect a CMS, publish changes publicly, or alter sheet source data."
        columns={["Area", "Title", "Status", "Owner", "Updated", "Actions"]}
        rows={contentItems.map((item) => ({
          id: item.id,
          cells: [
            item.area,
            item.title,
            <AdminStatusBadge
              key={`${item.id}-status`}
              label={item.status}
              tone={item.status === "Active Demo" ? "success" : "warning"}
            />,
            item.owner,
            item.updatedAt,
            <div key={`${item.id}-actions`} className="flex min-w-[14rem] flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => updateStatus(item.id, "Active Demo")}
              >
                Activate Demo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => updateStatus(item.id, "Needs Review")}
              >
                Needs Review
              </Button>
            </div>,
          ],
        }))}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {contentItems.slice(0, 4).map((item) => (
          <Card key={item.id} className="section-border rounded-[28px] p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
              {item.area}
            </p>
            <h2 className="mt-3 line-clamp-2 font-display text-xl uppercase tracking-[0.12em] text-pearl">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-silver">{item.note}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
