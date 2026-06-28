import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PolicyNotice } from "@/components/legal/policy-notice";
import { PolicySection } from "@/components/legal/policy-section";

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Terms Draft"
      title="Terms for review."
      description="These draft terms describe SKXNZ MVP behavior in clear language. They must be reviewed by qualified legal counsel before public launch."
    >
      <PolicySection title="MVP use">
        <p>
          SKXNZ is currently a private MVP foundation. Demo checkout, local cart,
          wishlist, seller dashboards, admin pages, Signal Community Beta, and AI
          Assistant Beta are internal testing surfaces unless activated later.
        </p>
      </PolicySection>

      <PolicySection title="Marketplace content">
        <p>
          Demo catalog products, images, availability, pricing, seller records, and
          order states may be seed data. They should not be treated as live seller
          inventory or public product commitments.
        </p>
      </PolicySection>

      <PolicySection title="Buyer, seller, and community conduct">
        <p>
          Users should not submit illegal content, counterfeit goods, brand
          impersonation, harassment, stolen images, or misleading product claims.
          Seller and community workflows remain beta/internal until review systems are
          ready.
        </p>
      </PolicySection>

      <PolicySection title="Payments, orders, and fulfillment">
        <p>
          Live payments, delivery tracking, refunds, seller payouts, and production
          order processing are not enabled in this MVP state. Demo checkout is for
          internal testing only.
        </p>
      </PolicySection>

      <PolicyNotice tone="warning">
        Draft terms for internal review before public launch. This is not final legal
        advice or a legally approved public policy.
      </PolicyNotice>
    </LegalPageShell>
  );
}
