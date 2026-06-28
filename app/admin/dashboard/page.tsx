import Link from "next/link";

import { AdminOverviewPanel } from "@/components/admin/admin-overview-panel";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { adminSidebarLinks } from "@/lib/data/site-content";

export default function AdminDashboardPage() {
  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin dashboard"
      helperText="Admin access stays behind a demo role gate for now. Production role-based access must be added before public launch."
    >
      <DashboardShell
        eyebrow="Admin Beta"
        title="Internal back office foundation for SKXNZ operations."
        description="Manage demo products, seller applications, orders, users, community reports, support tickets, content controls, and analytics placeholders without connecting production systems."
        actions={
          <>
            <Link
              href="/admin/products"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Product Queue
            </Link>
            <Link
              href="/admin/community"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Community Reports
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
        activeHref="/admin"
      >
        <AdminOverviewPanel />
      </DashboardShell>
    </DemoRoleGate>
  );
}
