import Link from "next/link";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PolicyNotice } from "@/components/legal/policy-notice";
import { PolicySection } from "@/components/legal/policy-section";
import { buttonVariants } from "@/components/ui/button";

export default function ShippingPage() {
  return (
    <LegalPageShell
      eyebrow="Shipping Draft"
      title="Shipping policy being prepared."
      description="Shipping timelines, courier partners, delivery charges, seller dispatch rules, and service locations must be finalized before SKXNZ accepts public orders."
    >
      <PolicySection title="Current status">
        <p>
          Delivery tracking is not live in MVP. Any delivery windows shown in demo
          products or checkout are placeholders for internal testing.
        </p>
      </PolicySection>

      <PolicySection title="What must be finalized">
        <ul className="list-disc space-y-2 pl-5">
          <li>Courier partners and supported locations.</li>
          <li>Shipping charges and thresholds.</li>
          <li>Seller dispatch standards and cutoff times.</li>
          <li>Delivery tracking, failed delivery, and cancellation handling.</li>
        </ul>
      </PolicySection>

      <PolicyNotice tone="warning">
        SKXNZ does not promise same-day delivery, guaranteed delivery dates, or final
        shipping rates in this draft.
      </PolicyNotice>

      <div className="flex flex-wrap gap-3">
        <Link href="/returns" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          Returns Draft
        </Link>
        <Link href="/support" className={buttonVariants({ variant: "ghost", size: "lg" })}>
          Support
        </Link>
      </div>
    </LegalPageShell>
  );
}
