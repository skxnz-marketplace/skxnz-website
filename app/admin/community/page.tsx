import Link from "next/link";

import { CommunityModerationTable } from "@/components/admin/community-moderation-table";
import { CommunityPosterGrantsPanel } from "@/components/admin/community-poster-grants-panel";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { adminSidebarLinks } from "@/lib/data/site-content";
import { getCommunityPosterGrants, getCommunityReportsForModeration } from "@/lib/community/admin-read-community";

export default async function AdminCommunityPage() {
  const [reportsResult, grants] = await Promise.all([
    getCommunityReportsForModeration(),
    getCommunityPosterGrants(),
  ]);

  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin community moderation"
      helperText="This area requires the admin demo role to preview. Real access is enforced server-side by RLS regardless of this local role switch."
    >
      <DashboardShell
        eyebrow="Community Moderation"
        title="Review reported Signal Community posts."
        description="Real reports, real moderation actions — hide/delete here updates what buyers see immediately."
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
        <div className="space-y-6">
          {!reportsResult.backendReady ? (
            <p className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-7 text-silver">
              Community is not connected yet — the database migration hasn&apos;t
              been applied.
            </p>
          ) : (
            <>
              <CommunityPosterGrantsPanel grants={grants} />
              <CommunityModerationTable reports={reportsResult.reports} />
            </>
          )}
        </div>
      </DashboardShell>
    </DemoRoleGate>
  );
}
