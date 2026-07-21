import Link from "next/link";

import { SupportCard } from "@/components/support/support-card";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Public support landing (launch-war D1-A). Server component, no demo state.
//
// The real support workflow is the authenticated ticket system at
// /account/support (0005 support_tickets + support_ticket_messages, wired
// D5-3/D5-3B). This page explains what support covers and routes signed-in
// buyers into that workflow; middleware sends signed-out visitors to /login
// first. No browser-local tickets, no fake response-time promise, no demo
// form — the old MVP intake that wrote tickets to marketplace-provider
// client state was removed here.

export const metadata = {
  title: "Support",
  description: "How to get help with SKXNZ orders, returns, and your account.",
};

const supportAreas = [
  [
    "Orders",
    "Questions about an order you placed — its status, items, or delivery address. Open the order from Your Orders and use Contact Support there to link it automatically.",
  ],
  [
    "Returns",
    "Returns are requested from the order itself once it has been delivered. Submitted requests are reviewed by SKXNZ — see the Returns page for how the process works.",
  ],
  [
    "Payments",
    "Payment questions about an order. Never share full card numbers, CVV, or one-time passwords with support — SKXNZ will not ask for them.",
  ],
  [
    "Account",
    "Sign-in trouble, profile details, or saved addresses. Include the email your account uses so support can locate it.",
  ],
  [
    "Products",
    "Sizing, materials, or product-detail questions before or after a purchase.",
  ],
  [
    "Sellers",
    "Questions about selling on SKXNZ. Seller onboarding is currently limited and being expanded ahead of launch.",
  ],
] as const;

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section className="rounded-[36px] border border-[var(--skxnz-border)] bg-[linear-gradient(135deg,var(--skxnz-maroon-deep),var(--skxnz-maroon),var(--skxnz-obsidian))] p-6 text-pearlcream shadow-[0_28px_70px_rgba(26,3,11,0.22)] sm:p-8">
        <p className="section-kicker text-[0.68rem] font-bold uppercase tracking-[0.24em] text-pearlcream/70">
          Support
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl uppercase leading-[0.95] tracking-[0.04em] text-pearlcream sm:text-5xl">
          Real people. Real tickets.
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-pearlcream/78 sm:text-base">
          Support at SKXNZ runs through tickets in your account. Every ticket
          is read and answered by a person — there is no bot resolution and no
          inflated response promise.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/account/support"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            Open A Support Ticket
          </Link>
          <Link
            href="/faq"
            className={`${buttonVariants({ variant: "ghost", size: "lg" })} text-pearlcream`}
          >
            Read FAQ
          </Link>
        </div>
        <p className="mt-4 text-xs leading-6 text-pearlcream/60">
          You will be asked to sign in first — tickets are tied to your SKXNZ
          account so your conversation is private to you.
        </p>
      </section>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {supportAreas.map(([title, description]) => (
          <SupportCard key={title} title={title} description={description} />
        ))}
      </div>

      <Card className="section-border mt-8 rounded-[36px] bg-white p-6 sm:p-8">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-teal">
          About an existing order?
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-midnightbrown/75">
          The fastest route is from the order itself: open it in Your Orders
          and choose Contact Support About This Order. The ticket is then
          linked to that order automatically, so you do not need to copy any
          reference numbers.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/orders" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            Your Orders
          </Link>
          <Link href="/returns" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            How Returns Work
          </Link>
        </div>
      </Card>
    </main>
  );
}
