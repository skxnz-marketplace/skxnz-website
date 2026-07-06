import Link from "next/link";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { OrderReadinessPanel } from "@/components/orders/order-readiness-panel";
import { PageIntro } from "@/components/sections/page-intro";
import { buttonVariants } from "@/components/ui/button";

// NOTE: The seeded demo order table (BuyerOrdersPanel) is intentionally not
// rendered here. Buyers must never see mock orders presented as history.
// Order history returns to this page only once real, server-created orders
// exist after live payment is connected.

export default function OrdersPage() {
  return (
    <DemoRoleGate
      allowedRoles={["buyer"]}
      areaLabel="Buyer orders"
      helperText="Buyer order visibility is protected in demo mode so the order lifecycle can be reviewed without turning on real checkout, payment, or delivery systems."
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="space-y-6">
          <PageIntro
            eyebrow="Buyer Orders"
            title="Your orders, only when they are real."
            description="SKXNZ does not show placeholder or mock orders here. Order history will appear after live payment is connected and real orders exist."
            actions={
              <>
                <Link
                  href="/shop"
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  Back To Shop
                </Link>
                <Link
                  href="/support"
                  className={buttonVariants({ variant: "ghost", size: "lg" })}
                >
                  Support
                </Link>
              </>
            }
          />

          <OrderReadinessPanel />
        </div>
      </div>
    </DemoRoleGate>
  );
}
