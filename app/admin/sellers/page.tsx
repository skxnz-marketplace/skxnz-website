import Link from "next/link";

import { AdminSellerReviewPanel } from "@/components/admin/admin-seller-review-panel";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { adminSidebarLinks } from "@/lib/data/site-content";

export default function AdminSellersPage() {
  return (
    <DemoRoleGate
      allowedRoles={["admin"]}
      areaLabel="Admin seller approvals"
      helperText="Seller approval review is protected in demo mode so marketplace moderation can stay internal while the private MVP is being refined."
    >
      <DashboardShell
        eyebrow="Seller Approval"
        title="Review seller applications in a clean moderation queue."
        description="This route now shows the full seller onboarding review loop in browser-local MVP state, from application submission to approval, rejection, or follow-up."
        actions={
          <>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Dashboard
            </Link>
            <Link
              href="/sell"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Seller Apply Page
            </Link>
          </>
        }
        sidebarTitle="Admin Workspace"
        sidebarLinks={adminSidebarLinks}
        activeHref="/admin/sellers"
      >
        <AdminSellerReviewPanel />
      </DashboardShell>
    </DemoRoleGate>
  );
}
