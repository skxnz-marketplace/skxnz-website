import Link from "next/link";

/** Closing CTA — links to /waitlist and /community, both real routes. */
export function SignalCta() {
  return (
    <section aria-label="Join SKXNZ" className="relative overflow-hidden bg-[#0E0E10] py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative mx-auto max-w-[900px] px-6 text-center sm:px-10">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.3em] text-[#F4F1EC]/45">
          Wear the Signal
        </p>
        <h2 className="mt-5 font-grotesk text-[clamp(2.2rem,7vw,4.5rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#F4F1EC]">
          Get in before
          <br />
          launch.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#F4F1EC]/55 sm:text-base">
          Early access opens the catalogue, checkout, and drops before anyone
          else sees them.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/waitlist"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#F4F1EC] px-7 text-[0.9rem] font-semibold uppercase tracking-[0.075em] text-[#0E0E10] transition duration-300 hover:bg-white sm:h-[52px] sm:w-auto sm:px-8"
          >
            Join early access
          </Link>
          <Link
            href="/community"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 text-sm font-bold uppercase tracking-[0.08em] text-white/75 transition hover:border-white/30 hover:text-white sm:h-[52px] sm:w-auto sm:px-8"
          >
            See the community
          </Link>
        </div>
      </div>
    </section>
  );
}

export default SignalCta;
