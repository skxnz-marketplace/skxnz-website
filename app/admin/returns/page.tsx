import Link from "next/link";

import { AdminReturnsPanel } from "@/components/admin/admin-returns-panel";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { adminSidebarLinks } from "@/lib/data/site-content";

export default function AdminReturnsPage() {
  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin returns"
      helperText="Return management is protected in demo mode so ops language can be reviewed before live reverse-logistics and refund systems exist."
    >
      <DashboardShell
        eyebrow="Returns Management"
        title="Review return cases without pretending refunds are live."
        description="This admin route keeps return status, refund placeholders, and review detail visible in one place while all reverse-logistics systems remain offline."
        actions={
          <>
            <Link
              href="/admin/orders"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Admin Orders
            </Link>
            <Link
              href="/admin/support"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Support
            </Link>
          </>
        }
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/returns"
      >
        <AdminReturnsPanel />
      </DashboardShell>
    </DemoRoleGate>
  );
}
