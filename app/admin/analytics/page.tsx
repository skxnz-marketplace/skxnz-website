import Link from "next/link";

import { AdminAnalyticsPanel } from "@/components/admin/admin-analytics-panel";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { adminSidebarLinks } from "@/lib/data/site-content";

export default function AdminAnalyticsPage() {
  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin analytics"
      helperText="Analytics are demo placeholders only. No production event tracking or revenue reporting is connected."
    >
      <DashboardShell
        eyebrow="Analytics"
        title="Review demo metrics without claiming real revenue."
        description="This route prepares visits, product views, search queries, community engagement, seller application, and revenue demo cards for future analytics wiring."
        actions={
          <>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/content"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Content Control
            </Link>
          </>
        }
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/analytics"
      >
        <AdminAnalyticsPanel />
      </DashboardShell>
    </DemoRoleGate>
  );
}
