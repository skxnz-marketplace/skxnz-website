import Link from "next/link";

import { CommunityModerationTable } from "@/components/admin/community-moderation-table";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { adminSidebarLinks } from "@/lib/data/site-content";

export default function AdminCommunityPage() {
  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin community moderation"
      helperText="Community moderation is demo-only until public posting, reporting, storage, and audit logs are production-ready."
    >
      <DashboardShell
        eyebrow="Community Moderation"
        title="Review Signal Community reports without claiming live moderation."
        description="This route prepares the moderation queue for reported posts, local reports, hide/dismiss demo actions, and future admin review."
        actions={
          <>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Dashboard
            </Link>
            <Link
              href="/community"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Signal Community
            </Link>
          </>
        }
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/community"
      >
        <CommunityModerationTable />
      </DashboardShell>
    </DemoRoleGate>
  );
}
