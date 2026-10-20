import Link from "next/link";

const capabilities = [
  "Style guidance from what's actually in the catalogue",
  "Recommendations from current catalogue listings",
  "AI Stylist is currently unavailable",
];

/** Real feature teaser — links to /ai (the Prism screen) and /ai/stylist. */
export function AiSignalPanel() {
  return (
    <section aria-label="SKXNZ AI" className="relative overflow-hidden bg-[#0E0E10] py-16 sm:py-24">
      {/* Ambient prism-echo glow — restrained, not a copy of the WebGL scene */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-1/4 top-0 h-[140%] w-1/2 opacity-[0.22] blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, #00E5FF, transparent), radial-gradient(closest-side at 70% 30%, #7C3AED, transparent)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-1/4 bottom-0 h-[120%] w-1/2 opacity-[0.18] blur-3xl"
        style={{
          background: "radial-gradient(closest-side, #E11D8F, transparent)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-6 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:px-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF]" />
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#00E5FF]">
              SKXNZ AI
            </span>
          </div>

          <h2 className="mt-5 font-grotesk text-[clamp(2rem,4.5vw,3.4rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em] text-[#F4F1EC]">
            Style, answered
            <br />
            in real time.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#F4F1EC]/60 sm:text-base">
            The assistant lives inside SKXNZ — ask it for a look, a fit
            comparison, or where to start.
          </p>

          <ul className="mt-8 space-y-3">
            {capabilities.map((c) => (
              <li key={c} className="flex items-start gap-3 text-sm leading-6 text-[#F4F1EC]/75">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#00E5FF]" />
                {c}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/ai/stylist"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#F4F1EC] px-7 text-[0.9rem] font-semibold uppercase tracking-[0.075em] text-[#0E0E10] transition duration-300 hover:bg-white sm:h-[52px] sm:px-8"
            >
              AI Stylist Status
            </Link>
            <Link
              href="/ai"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-6 text-sm font-bold uppercase tracking-[0.08em] text-[#00E5FF] transition hover:bg-[#00E5FF]/18 sm:h-[52px] sm:px-8"
            >
              See the Signal
            </Link>
          </div>
        </div>

        {/* Mock conversation card — decorative, not a live chat */}
        <div
          aria-hidden="true"
          className="relative mx-auto w-full max-w-[420px] rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.5)] backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#00E5FF] to-[#7C3AED] text-xs font-bold text-black">
              AI
            </span>
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/50">
              Illustrative conversation
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-white/10 px-4 py-2.5 text-sm text-white/85">
              Something for a night out, under 3,500
            </div>
            <div className="mr-auto max-w-[85%] rounded-2xl rounded-tl-sm bg-[#00E5FF]/12 px-4 py-2.5 text-sm text-white/90">
              I can check the current catalogue for options within your budget.
              Availability depends on the listings returned.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AiSignalPanel;
