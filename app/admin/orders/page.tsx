import Link from "next/link";

import { AdminOrdersPanel } from "@/components/admin/admin-orders-panel";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { adminSidebarLinks } from "@/lib/data/site-content";

export default function AdminOrdersPage() {
  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin order management"
      helperText="Admin order visibility is still mock-only and gated in demo mode while checkout, payments, and fulfillment systems remain offline."
    >
      <DashboardShell
        eyebrow="Order Management"
        title="Track order states without enabling real checkout."
        description="This admin route now keeps payment, order, delivery, and return states visible in one operations surface while live systems remain offline."
        actions={
          <>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/returns"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Returns
            </Link>
          </>
        }
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/orders"
      >
        <AdminOrdersPanel />
      </DashboardShell>
    </DemoRoleGate>
  );
}
