import Link from "next/link";

import { ContentControlPanel } from "@/components/admin/content-control-panel";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { adminSidebarLinks } from "@/lib/data/site-content";

export default function AdminContentPage() {
  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin content control"
      helperText="Content controls are internal demo tools until a safe CMS, permissions, and audit logs are connected."
    >
      <DashboardShell
        eyebrow="Content Control"
        title="Review homepage and discovery content safely."
        description="This page prepares admin visibility for hero slides, brand toolbar entries, category tiles, and featured collections without building a full CMS yet."
        actions={
          <>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              View Homepage
            </Link>
          </>
        }
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/content"
      >
        <ContentControlPanel />
      </DashboardShell>
    </DemoRoleGate>
  );
}
