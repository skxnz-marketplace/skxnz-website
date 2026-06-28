import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PolicyNotice } from "@/components/legal/policy-notice";
import { FaqAccordion } from "@/components/support/faq-accordion";

const faqItems = [
  {
    question: "What is SKXNZ?",
    answer:
      "SKXNZ is an AI-powered futurewear marketplace by Vivaan Poddar Companies. The current website is an MVP foundation for catalog discovery, demo checkout, seller review workflows, admin operations, and AI Assistant Beta.",
  },
  {
    question: "Is SKXNZ live yet?",
    answer:
      "No. The app is still in private MVP/demo mode. Public launch should wait until legal pages, payments, shipping, seller review, support, and moderation systems are complete.",
  },
  {
    question: "How do I buy?",
    answer:
      "You can test product browsing, cart, and demo checkout flows. Live payment processing, real order fulfillment, and delivery tracking are not connected yet.",
  },
  {
    question: "How do I sell?",
    answer:
      "Use the seller application flow to test the onboarding foundation. Seller applications are beta/internal and do not mean approval or live selling access.",
  },
  {
    question: "How does wishlist work?",
    answer:
      "Wishlist is a browser-local MVP feature for now. Persistent account sync is planned for a future backend/auth phase.",
  },
  {
    question: "What is Signal Community?",
    answer:
      "Signal Community Beta is a futurewear style layer for demo posts, tagged products, and reports. Public posting should not go live until moderation and safety systems are ready.",
  },
  {
    question: "What is AI Assistant Beta?",
    answer:
      "The SKXNZ AI Assistant Beta uses current SKXNZ catalog data to answer shopping and styling questions. It should not claim guaranteed fit, live try-on, or products that are not in the catalog.",
  },
  {
    question: "Are AI try-on or video tools live?",
    answer:
      "No. AI try-on and AI product video generation are future systems. Current AI-related pages are MVP/demo foundations unless explicitly connected later.",
  },
  {
    question: "Are returns and shipping final?",
    answer:
      "No. Return windows, shipping charges, delivery timelines, courier partners, and refund rules are draft topics for review before public launch.",
  },
];

export default function FaqPage() {
  return (
    <LegalPageShell
      eyebrow="FAQ"
      title="Private beta questions."
      description="A readable FAQ for SKXNZ MVP users, sellers, testers, and operators before the public launch stack is finalized."
      notice="FAQ answers are draft operational guidance and should be reviewed before public launch."
    >
      <FaqAccordion items={faqItems} />
      <PolicyNotice>
        If a page appears to support checkout, seller dashboards, community posting, or
        AI tools, treat it as MVP/demo unless the relevant backend and operations are
        explicitly connected later.
      </PolicyNotice>
    </LegalPageShell>
  );
}
