import Link from "next/link";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PolicyNotice } from "@/components/legal/policy-notice";
import { PolicySection } from "@/components/legal/policy-section";
import { ReturnRequestWorkspace } from "@/components/returns/return-request-workspace";
import { buttonVariants } from "@/components/ui/button";

export default function ReturnsPage() {
  return (
    <LegalPageShell
      eyebrow="Returns Draft"
      title="Returns policy being prepared."
      description="This draft returns page explains the current MVP state. Real return windows, product conditions, pickup workflows, refund timing, and support ownership must be finalized before public launch."
      notice="Draft returns language for internal review. Do not treat this as a final public return policy."
    >
      <PolicySection title="Current MVP status">
        <p>
          SKXNZ has demo return-request screens for internal QA only. Real pickup,
          inspection, refund, and exchange operations are not live yet.
        </p>
        <p>
          Return eligibility, timelines, conditions, exceptions, and charges must be
          reviewed legally and operationally before SKXNZ accepts public orders.
        </p>
      </PolicySection>

      <PolicySection title="What is not promised yet">
        <ul className="list-disc space-y-2 pl-5">
          <li>No free returns promise is made in this draft.</li>
          <li>No instant refund promise is made in this draft.</li>
          <li>No courier pickup timeline is final in this draft.</li>
          <li>No product authenticity or brand authorization claim is implied.</li>
        </ul>
      </PolicySection>

      <PolicyNotice tone="warning">
        Demo checkout orders are internal test records only. They do not create real
        payment, delivery, return, or refund obligations.
      </PolicyNotice>

      <div className="flex flex-wrap gap-3">
        <Link href="/support" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          Contact Support
        </Link>
        <Link href="/shipping" className={buttonVariants({ variant: "ghost", size: "lg" })}>
          Shipping Draft
        </Link>
      </div>

      <DemoRoleGate
        allowedRoles={["buyer"]}
        areaLabel="Buyer returns"
        helperText="The workspace below stays in buyer demo mode so request language can be reviewed before real pickup and refund systems are connected."
      >
        <ReturnRequestWorkspace />
      </DemoRoleGate>
    </LegalPageShell>
  );
}
