import Link from "next/link";

import { AdminProductReviewPanel } from "@/components/admin/admin-product-review-panel";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { adminSidebarLinks } from "@/lib/data/site-content";

export default function AdminProductsPage() {
  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin product approvals"
      helperText="The admin product queue is protected in demo mode so moderation language and review states stay private during MVP testing."
    >
      <DashboardShell
        eyebrow="Product Approval"
        title="Moderate product submissions before they reach buyers."
        description="This admin route now drives the core SKXNZ mock review loop: seller submission, approval or rejection, and buyer shop visibility."
        actions={
          <>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Dashboard
            </Link>
            <Link
              href="/seller/products"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Seller Product Workspace
            </Link>
          </>
        }
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/products"
      >
        <AdminProductReviewPanel />
      </DashboardShell>
    </DemoRoleGate>
  );
}
