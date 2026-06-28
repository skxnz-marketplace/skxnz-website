import Link from "next/link";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PolicyNotice } from "@/components/legal/policy-notice";
import { PolicySection } from "@/components/legal/policy-section";
import { ContactFormDemo } from "@/components/support/contact-form-demo";
import { SupportCard } from "@/components/support/support-card";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

const contactChannels = [
  ["Support", siteConfig.supportEmail],
  ["Seller Applications", siteConfig.sellerEmail],
  ["Instagram", siteConfig.socialHandle],
  ["Domain", siteConfig.domain],
];

export default function ContactPage() {
  return (
    <LegalPageShell
      eyebrow="Contact"
      title="Connect with SKXNZ."
      description="Use this draft contact surface for support questions, seller interest, Signal Community reports, and private beta launch preparation."
      notice="Contact flows are MVP/demo foundations. Real inbox routing, SLA commitments, and support tooling must be finalized before public launch."
    >
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {contactChannels.map(([title, description]) => (
            <SupportCard key={title} title={title} description={description} />
          ))}
        </div>

        <PolicySection title="Contact form demo" eyebrow="Support foundation">
          <ContactFormDemo />
        </PolicySection>
      </div>

      <PolicyNotice>
        For seller interest, use the seller application flow. For community reports,
        use the Signal Community report flow where available. Do not submit sensitive
        documents through this demo contact form.
      </PolicyNotice>

      <div className="flex flex-wrap gap-3">
        <Link href="/sell" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          Sell on SKXNZ
        </Link>
        <Link href="/support" className={buttonVariants({ variant: "ghost", size: "lg" })}>
          Support
        </Link>
      </div>
    </LegalPageShell>
  );
}
