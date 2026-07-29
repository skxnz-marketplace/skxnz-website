import type { Metadata } from "next";
import Link from "next/link";

import { CookiePreferencesLink } from "@/components/consent/cookie-preferences-link";

export const metadata: Metadata = { title: "Cookie Policy" };

// TRUTHFUL cookie information page. It describes only what SKXNZ actually uses
// today and states plainly that no analytics or marketing tools are connected.
// It deliberately does NOT state a legal entity, registered office, grievance
// officer, retention periods, third-party vendors, or jurisdiction — those are
// founder-supplied legal facts and are tracked as a blocker, not invented here.

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="text-[0.7rem] uppercase tracking-[0.24em] text-stone">Cookie Policy</p>
      <h1 className="mt-3 font-display text-3xl uppercase tracking-[0.03em] text-midnightbrown sm:text-4xl">
        Cookies &amp; your choices
      </h1>
      <p className="mt-4 text-sm leading-7 text-midnightbrown/80">
        This page explains the cookies and similar storage SKXNZ uses, and how you
        control the optional ones. You can change your choices any time from{" "}
        <CookiePreferencesLink className="underline underline-offset-2 hover:text-sangria" />{" "}
        or the link in the footer.
      </p>

      <section className="mt-8 space-y-6 text-sm leading-7 text-midnightbrown/80">
        <div>
          <h2 className="font-semibold text-midnightbrown">Strictly necessary</h2>
          <p className="mt-1">
            Required for the site to work: your sign-in session, cart, checkout
            draft, and security. These are first-party and cannot be switched off,
            because the site can&apos;t function without them.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-midnightbrown">Preferences</h2>
          <p className="mt-1">
            Optional. Remembers choices such as recently viewed items and display
            settings. Off unless you turn it on.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-midnightbrown">Analytics</h2>
          <p className="mt-1">
            Optional, and <strong>not currently connected</strong>. No analytics
            tool is installed on SKXNZ today. This control exists so that if one is
            added later, it will only run after you allow it.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-midnightbrown">Marketing</h2>
          <p className="mt-1">
            Optional, and <strong>not currently connected</strong>. No marketing or
            advertising tool is installed on SKXNZ today. This control exists for
            the same reason as Analytics.
          </p>
        </div>
      </section>

      <div className="mt-8 rounded-2xl border border-black/10 bg-white/50 p-5 text-sm leading-7 text-midnightbrown/80">
        Your choice is stored in a single first-party cookie that holds only a
        version number, a timestamp, and on/off flags for each category — no
        personal data. You can withdraw or change it whenever you like.
      </div>

      <p className="mt-8 text-sm text-midnightbrown/70">
        See also our{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-sangria">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-sangria">
          Terms
        </Link>
        .
      </p>
    </div>
  );
}
