import Link from "next/link";

import { aiSteps } from "@/lib/home-data";

export function AiStylistBanner() {
  return (
    <section aria-label="AI Stylist" className="bg-[#0E0E10] py-0 pb-12">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <div className="relative overflow-hidden rounded-2xl border border-[#00E5FF]/10 bg-[#111116] px-8 py-10 sm:px-12 sm:py-14">
          {/* Cyan glow */}
          <div className="pointer-events-none absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-[#00E5FF] opacity-[0.04] blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: text */}
            <div className="max-w-lg">
              <div className="mb-3 inline-flex items-center gap-2">
                <span className="rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#00E5FF]">
                  BETA
                </span>
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#F4F1EC]/40">
                  AI Stylist
                </span>
              </div>
              <h2 className="font-grotesk text-2xl font-bold uppercase leading-tight tracking-[-0.01em] text-[#F4F1EC] sm:text-3xl">
                Your personal style companion
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#F4F1EC]/55">
                Outfit ideas and recommendations based on your budget, occasion, and style.
              </p>

              {/* Steps */}
              <div className="mt-6 flex flex-wrap gap-4">
                {aiSteps.map((step) => (
                  <div key={step.step} className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#00E5FF]/25 bg-[#00E5FF]/8 text-[0.6rem] font-bold text-[#00E5FF]">
                      {step.step}
                    </span>
                    <span className="text-[0.76rem] font-semibold text-[#F4F1EC]/70">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: CTA */}
            <div className="shrink-0">
              <Link
                href="/ai-stylist"
                className="inline-flex h-12 items-center gap-2.5 rounded-full bg-[#00E5FF] px-8 text-sm font-bold uppercase tracking-[0.08em] text-[#0E0E10] transition hover:bg-[#33ecff]"
              >
                Try AI Stylist
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
