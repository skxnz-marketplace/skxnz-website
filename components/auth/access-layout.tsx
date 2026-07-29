import type { ReactNode } from "react";

// Premium two-panel access shell. Left: an obsidian editorial brand panel with
// the wordmark, tagline, and TRUTHFUL account benefits. Right: the form.
// On mobile the brand panel collapses to a slim header so the form leads.
//
// Original composition — a full-bleed obsidian split with a single silver hair-
// line seam and a restrained cyan glint. Not a centered SaaS card, and not a
// clone of any commerce reference.

const BENEFITS = [
  "Save pieces and follow the labels you like",
  "A faster checkout for when payments open",
  "Order history and updates in one place",
];

export function AccessLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-var(--skxnz-header-offset,0px))] w-full bg-[var(--skxnz-obsidian)] text-white">
      <div className="mx-auto grid min-h-full max-w-6xl grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel */}
        <aside className="relative hidden overflow-hidden border-r border-white/10 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(120% 90% at 15% 10%, rgba(120,180,255,0.10), transparent 55%), radial-gradient(90% 80% at 90% 100%, rgba(180,120,255,0.10), transparent 55%)",
            }}
          />
          <div className="relative">
            <p className="font-display text-3xl uppercase tracking-[0.14em]">SKXNZ</p>
            <p className="mt-2 text-[0.72rem] uppercase tracking-[0.4em] text-white/50">
              Wear the signal.
            </p>
          </div>

          <div className="relative max-w-sm">
            <h2 className="font-display text-2xl uppercase leading-tight tracking-[0.03em] text-white/90">
              Your account,
              <br />
              your edit.
            </h2>
            <ul className="mt-6 space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[0.86rem] leading-6 text-white/65">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--skxnz-ai-aqua)]"
                  />
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[0.72rem] leading-5 text-white/40">
              SKXNZ is in private preview — payments, delivery and refunds are not
              yet live. Accounts and discovery are.
            </p>
          </div>
        </aside>

        {/* Form panel */}
        <main className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12 xl:px-16">
          {/* Mobile brand strip */}
          <div className="mb-8 lg:hidden">
            <p className="font-display text-2xl uppercase tracking-[0.14em]">SKXNZ</p>
            <p className="mt-1 text-[0.66rem] uppercase tracking-[0.36em] text-white/45">
              Wear the signal.
            </p>
          </div>
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default AccessLayout;
