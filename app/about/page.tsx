import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PolicyNotice } from "@/components/legal/policy-notice";
import { PolicySection } from "@/components/legal/policy-section";
import { TrustBadges } from "@/components/trust/trust-badges";
import { siteConfig } from "@/lib/site";

const principles = [
  {
    title: "Fashion discovery",
    description:
      "SKXNZ is being built around product-first discovery, futurewear categories, brand pages, and clean marketplace navigation.",
  },
  {
    title: "Seller review foundation",
    description:
      "Seller applications, product upload review, and admin queues are prepared as beta foundations before public seller operations go live.",
  },
  {
    title: "AI-assisted shopping",
    description:
      "The SKXNZ AI Assistant Beta can use current demo catalog data. AI try-on and AI product video tools remain future work.",
  },
];

export default function AboutPage() {
  return (
    <LegalPageShell
      eyebrow="About SKXNZ"
      title="WEAR THE SIGNAL."
      description={`SKXNZ is an AI-powered futurewear marketplace by ${siteConfig.parentCompany}, built around curated shopping, seller review foundations, AI-assisted product discovery, and a future Signal Community layer.`}
      notice="SKXNZ is still a private MVP foundation. Marketplace operations, payments, delivery, seller verification, and public community posting must be completed before public launch."
    >
      <TrustBadges />

      <PolicySection title="What SKXNZ is building">
        <p>
          SKXNZ focuses on fashion discovery for futurewear, street-led products,
          accessories, fragrance concepts, and limited drop storytelling. The brand
          direction is premium, clean, and product-first.
        </p>
        <p>
          Current catalog items and operational surfaces are demo/internal unless a
          later phase connects live inventory, sellers, payments, fulfillment, and
          support systems.
        </p>
      </PolicySection>

      <div className="grid gap-5 md:grid-cols-3">
        {principles.map((principle) => (
          <PolicySection key={principle.title} title={principle.title} eyebrow="Principle">
            <p>{principle.description}</p>
          </PolicySection>
        ))}
      </div>

      <PolicyNotice>
        SKXNZ does not claim official brand partnerships, certified authenticity,
        live seller verification, live payment processing, or guaranteed delivery in
        this MVP state.
      </PolicyNotice>
    </LegalPageShell>
  );
}
