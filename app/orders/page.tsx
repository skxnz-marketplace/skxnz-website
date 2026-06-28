import Link from "next/link";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { BuyerOrdersPanel } from "@/components/orders/buyer-orders-panel";
import { PageIntro } from "@/components/sections/page-intro";
import { buttonVariants } from "@/components/ui/button";

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
            title="Track the SKXNZ order lifecycle without pretending it is live."
            description="This route shows the buyer-side order lifecycle with mock/local data only, including order, payment, delivery, and return visibility."
            actions={
              <>
                <Link
                  href="/returns"
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  Open Returns
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

          <BuyerOrdersPanel />
        </div>
      </div>
    </DemoRoleGate>
  );
}
