import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PolicyNotice } from "@/components/legal/policy-notice";
import { FaqAccordion } from "@/components/support/faq-accordion";

export const metadata = {
  title: "FAQ",
};

const faqItems = [
  {
    question: "What is SKXNZ?",
    answer:
      "SKXNZ is an AI-powered futurewear marketplace by Vivaan Poddar Companies. Today you can browse the catalogue, review a cart, create unpaid draft orders, and use the AI Assistant Beta for styling questions.",
  },
  {
    question: "Is SKXNZ fully live yet?",
    answer:
      "Not yet. SKXNZ is in a private preview. You can browse and prepare orders, but live payment, delivery, and refunds are switched on only at public launch.",
  },
  {
    question: "How do I buy?",
    answer:
      "Browse products, review your cart, and create a real unpaid draft order at checkout. No payment is taken and nothing ships until live payment is connected — your draft is saved to your account.",
  },
  {
    question: "How do I sell?",
    answer:
      "You can submit a seller application now. Submitting an application starts a review — it does not mean approval or immediate live selling access.",
  },
  {
    question: "How does the wishlist work?",
    answer:
      "Your wishlist is saved on the device you are using for now. Syncing it to your account across devices is planned.",
  },
  {
    question: "What is Signal Community?",
    answer:
      "Signal Community Beta is an early preview of the SKXNZ style community — posts, tagged products, and reporting tools. Public posting opens once moderation and safety systems are ready.",
  },
  {
    question: "What is AI Assistant Beta?",
    answer:
      "The SKXNZ AI Assistant Beta answers shopping and styling questions using the current SKXNZ catalogue only. It does not promise guaranteed fit, offer live try-on, or suggest products that are not in the catalogue.",
  },
  {
    question: "Are AI try-on or video tools live?",
    answer:
      "No. AI try-on and AI product video generation are planned future features and are not available yet.",
  },
  {
    question: "Are returns and shipping policies final?",
    answer:
      "Not yet. Return windows, shipping charges, delivery timelines, courier partners, and refund rules are finalized before public launch. Until then, every return request is reviewed individually.",
  },
];

export default function FaqPage() {
  return (
    <LegalPageShell
      eyebrow="FAQ"
      title="Questions, answered honestly."
      description="What SKXNZ can do today and what is still being connected ahead of public launch."
      notice="These answers describe the current private preview and are updated as features go live."
    >
      <FaqAccordion items={faqItems} />
      <PolicyNotice>
        During the private preview, no page takes live payment and nothing is
        shipped. If something looks like a payment or delivery step, it is a
        preparation step only until SKXNZ announces those systems are live.
      </PolicyNotice>
    </LegalPageShell>
  );
}
