import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PolicyNotice } from "@/components/legal/policy-notice";
import { PolicySection } from "@/components/legal/policy-section";

export default function AuthenticityPage() {
  return (
    <LegalPageShell
      eyebrow="Authenticity Draft"
      title="Seller and product review foundations."
      description="This page uses safe wording only. SKXNZ is preparing seller review and product listing review processes, but it does not claim guaranteed authenticity or official brand authorization."
    >
      <PolicySection title="What is planned">
        <p>
          SKXNZ plans seller application review, product listing review, admin
          moderation, product media checks, and seller quality standards before wider
          public launch.
        </p>
      </PolicySection>

      <PolicySection title="Development catalog note">
        <p>
          Products shown during development may be demo catalog items. Demo brand
          profiles and SKXNZ-safe placeholder brands do not imply official brand
          partnerships or authorization.
        </p>
      </PolicySection>

      <PolicySection title="What SKXNZ does not claim yet">
        <ul className="list-disc space-y-2 pl-5">
          <li>No official certification claim.</li>
          <li>No brand-authorized reseller claim.</li>
          <li>No guaranteed authenticity claim.</li>
          <li>No verification by luxury brands claim.</li>
        </ul>
      </PolicySection>

      <PolicyNotice tone="warning">
        Any future authenticity, seller verification, or brand authorization wording
        must be legally true, operationally implemented, and reviewed before launch.
      </PolicyNotice>
    </LegalPageShell>
  );
}
