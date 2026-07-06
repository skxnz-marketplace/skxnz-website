import Link from "next/link";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// NOTE: The mock order detail view (OrderDetailShell) is intentionally not
// rendered here. No real orders exist yet, so this route must not display a
// seeded order with statuses that look real. It returns once orders are
// created server-side after live payment is connected.

export default function OrderDetailPage() {
  return (
    <DemoRoleGate
      allowedRoles={["buyer"]}
      areaLabel="Buyer order detail"
      helperText="Order detail stays inside buyer demo mode so the lifecycle can be reviewed safely before real account access is connected."
    >
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-8 text-center">
          <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
            Buyer Orders
          </p>
          <h1 className="mx-auto mt-4 max-w-[16ch] break-words font-display text-4xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
            No order exists at this address.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone">
            Live payment is not connected yet, so no orders have been placed on
            SKXNZ. Order details will be available here once real orders exist.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/orders" className={buttonVariants({ variant: "primary" })}>
              Order Readiness
            </Link>
            <Link href="/shop" className={buttonVariants({ variant: "secondary" })}>
              Back To Shop
            </Link>
          </div>
        </Card>
      </div>
    </DemoRoleGate>
  );
}
