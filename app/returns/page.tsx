import Link from "next/link";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PolicySection } from "@/components/legal/policy-section";
import { buttonVariants } from "@/components/ui/button";

// Public returns page (launch-war D1-A). Server component, no demo state.
//
// The real return workflow lives on the buyer's own order detail page
// (DELIVERED orders only) and in /account/returns — both wired to the 0005
// return_requests backend. This page explains the process truthfully and
// routes into that workflow. The old demo-role-gated ReturnRequestWorkspace
// (browser-local request state) was removed from this route.

export const metadata = {
  title: "Returns — SKXNZ",
  description: "How returns work at SKXNZ and where to request one.",
};

export default function ReturnsPage() {
  return (
    <LegalPageShell
      eyebrow="Returns"
      title="Returns, reviewed by people."
      description="Returns at SKXNZ are requested from the order itself after delivery. Every request is reviewed individually — nothing is auto-approved and nothing is promised that operations cannot keep."
      notice="The complete published return policy — windows, conditions, and charges — is being finalized ahead of public launch. Until then, every return is handled case by case through review."
    >
      <PolicySection title="How a return works today">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Open the delivered order in Your Orders.</li>
          <li>
            Select the items and quantities you want to return, add your
            reason, and submit the request.
          </li>
          <li>
            SKXNZ reviews the request. You can follow its status any time in
            My Returns in your account.
          </li>
          <li>
            If a return is approved, pickup and refund steps are arranged and
            confirmed to you — they are never scheduled automatically at
            submission.
          </li>
        </ol>
      </PolicySection>

      <PolicySection title="What you can expect">
        <ul className="list-disc space-y-2 pl-5">
          <li>Returns can be requested only for orders that have been delivered.</li>
          <li>Each item can be returned up to the quantity you purchased, once.</li>
          <li>A submitted request means a review — not an approved refund.</li>
          <li>
            Refunds are only issued after a return is approved and processed;
            no refund timing is promised before that confirmation.
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="Where to go">
        <p>
          Request a return from the order itself, or check the status of one
          you already submitted. Both need you to be signed in to the account
          that placed the order.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/orders" className={buttonVariants({ variant: "primary", size: "lg" })}>
            Your Orders
          </Link>
          <Link
            href="/account/returns"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            My Returns
          </Link>
          <Link href="/support" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            Contact Support
          </Link>
        </div>
      </PolicySection>
    </LegalPageShell>
  );
}
