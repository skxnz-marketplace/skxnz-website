import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PolicyNotice } from "@/components/legal/policy-notice";
import { PolicySection } from "@/components/legal/policy-section";

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy Draft"
      title="Privacy notes for review."
      description="This draft explains what SKXNZ currently stores locally in MVP mode and what would require real privacy review before public launch."
    >
      <PolicySection title="Current MVP data">
        <p>
          Current cart, wishlist, demo checkout, saved addresses, seller applications,
          support tickets, community saves, and role selections can use browser-local
          storage for internal testing.
        </p>
      </PolicySection>

      <PolicySection title="Future account data">
        <p>
          Real authentication is not connected yet. Future account data may include
          profile details, addresses, wishlist records, orders, saved brands, style
          preferences, support tickets, and seller application details.
        </p>
      </PolicySection>

      <PolicySection title="AI assistant interactions">
        <p>
          AI Assistant Beta should use only SKXNZ marketplace context. Future AI logs,
          audits, consent rules, retention policies, and provider disclosures must be
          finalized before production AI usage.
        </p>
      </PolicySection>

      <PolicySection title="Sensitive data warning">
        <p>
          Do not store passwords manually, real payment card details, CVV codes,
          sensitive identity documents, private support evidence, or user-uploaded
          try-on photos in Google Sheets, Excel, or unsafe demo storage.
        </p>
      </PolicySection>

      <PolicyNotice>
        Draft privacy page for legal review. Production privacy policy, consent,
        retention, deletion, analytics, and vendor terms must be finalized before
        public launch.
      </PolicyNotice>
    </LegalPageShell>
  );
}
