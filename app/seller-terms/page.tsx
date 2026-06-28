import Link from "next/link";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PolicyNotice } from "@/components/legal/policy-notice";
import { PolicySection } from "@/components/legal/policy-section";
import { buttonVariants } from "@/components/ui/button";

export default function SellerTermsPage() {
  return (
    <LegalPageShell
      eyebrow="Seller Terms Draft"
      title="Seller responsibilities for review."
      description="Draft seller terms for SKXNZ application, product listing standards, review workflows, and future marketplace operations."
    >
      <PolicySection title="Application review">
        <p>
          Seller onboarding is currently in review/beta. Applying does not guarantee
          approval, dashboard access, product publishing, payouts, or public selling.
        </p>
      </PolicySection>

      <PolicySection title="Product standards">
        <p>
          Sellers should provide accurate product names, categories, pricing, sizes,
          colors, inventory, images, and descriptions. Counterfeit goods, fake brand
          claims, copied assets, illegal goods, and misleading listings are not
          acceptable.
        </p>
      </PolicySection>

      <PolicySection title="Verification and documents">
        <p>
          SKXNZ may request business, GST, brand authorization, or authenticity
          documentation later through a secure process. Sensitive documents should not
          be submitted through placeholder/demo upload fields.
        </p>
      </PolicySection>

      <PolicySection title="Returns, support, and operations">
        <p>
          Seller responsibilities for shipping, returns, refunds, support, product
          quality, and order handling must be finalized before production seller
          operations go live.
        </p>
      </PolicySection>

      <PolicyNotice>
        Seller Dashboard Beta and seller product upload flows are internal/demo
        foundations. They do not publish live products to buyers unless a later phase
        explicitly connects review and publishing logic.
      </PolicyNotice>

      <Link href="/sell" className={buttonVariants({ variant: "secondary", size: "lg" })}>
        Apply to Sell
      </Link>
    </LegalPageShell>
  );
}
