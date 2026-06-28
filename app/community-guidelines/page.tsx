import Link from "next/link";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PolicyNotice } from "@/components/legal/policy-notice";
import { PolicySection } from "@/components/legal/policy-section";
import { buttonVariants } from "@/components/ui/button";

export default function CommunityGuidelinesPage() {
  return (
    <LegalPageShell
      eyebrow="Community Guidelines Draft"
      title="Post the fit. Respect the signal."
      description="Draft guidelines for Signal Community Beta before public posting, moderation, reporting, and takedown operations are fully ready."
    >
      <PolicySection title="Allowed direction">
        <p>
          Signal Community is intended for respectful style posts, SKXNZ product tags,
          futurewear inspiration, saved looks, and marketplace discovery.
        </p>
      </PolicySection>

      <PolicySection title="Not allowed">
        <ul className="list-disc space-y-2 pl-5">
          <li>Hate, harassment, threats, or explicit content.</li>
          <li>Illegal items or unsafe product promotion.</li>
          <li>Fake seller, creator, or official brand claims.</li>
          <li>Brand impersonation or copied copyrighted images.</li>
          <li>Counterfeit goods, misleading listings, or stolen product photos.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Reports and moderation">
        <p>
          Report flows are being prepared for spam, inappropriate content, fake product
          claims, harassment, copyright concerns, and other safety issues. Admin review
          and moderation tooling must be complete before public community launch.
        </p>
      </PolicySection>

      <PolicyNotice tone="warning">
        Signal Community is in beta. Demo posts and report actions do not mean public
        posting, verified creators, or completed moderation operations are live.
      </PolicyNotice>

      <Link href="/community" className={buttonVariants({ variant: "secondary", size: "lg" })}>
        Signal Community Beta
      </Link>
    </LegalPageShell>
  );
}
