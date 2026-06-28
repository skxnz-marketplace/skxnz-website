import Link from "next/link";

import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { adminSidebarLinks } from "@/lib/data/site-content";

export default function AdminUsersPage() {
  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin users"
      helperText="User administration is demo-only until production authentication and role-based access control are connected."
    >
      <DashboardShell
        eyebrow="Users"
        title="Review demo users without exposing private account controls."
        description="This admin section shows buyer, seller, and admin demo profiles for workflow planning. It does not manage real passwords or production user records."
        actions={
          <>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Dashboard
            </Link>
            <Link
              href="/account"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Buyer Account Demo
            </Link>
          </>
        }
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/users"
      >
        <AdminUsersTable />
      </DashboardShell>
    </DemoRoleGate>
  );
}
