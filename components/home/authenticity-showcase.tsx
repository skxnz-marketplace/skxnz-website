import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

const steps = [
  { n: "01", title: "Sourced", desc: "Every piece traced to an approved seller before it lists." },
  { n: "02", title: "Inspected", desc: "Cross-checked against the brand's construction and materials." },
  { n: "03", title: "Signed", desc: "A verification mark is attached to the product record." },
];

/** Real feature, real destination — links to the existing /authenticity page. */
export function AuthenticityShowcase() {
  return (
    <section aria-label="Authenticity" className="bg-[#F4F1EC] py-16 sm:py-24">
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#0E0E10] sm:aspect-[16/10] lg:aspect-[4/5]">
          <Image
            src="/assets/home/trending/pearl-signal-crop-jacket.jpeg"
            alt="Verified SKXNZ piece"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E10]/80 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-[#00E5FF]" />
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white">
              Verification Mark Attached
            </span>
          </div>
        </div>

        <div>
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.24em] text-[#2E1014]/60">
            The SKXNZ Standard
          </p>
          <h2 className="mt-4 font-grotesk text-[clamp(1.9rem,4vw,3rem)] font-bold uppercase leading-[0.98] tracking-[-0.02em] text-[#161616]">
            Every piece,
            <br />
            verified before it ships.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#161616]/65 sm:text-base">
            SKXNZ runs every catalogue listing through a three-step check before
            it reaches you. Here&apos;s exactly how it works.
          </p>

          <ol className="mt-9 space-y-6">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-5">
                <span className="font-grotesk text-2xl font-bold text-[#00000022] tabular-nums">
                  {s.n}
                </span>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.1em] text-[#161616]">
                    {s.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#161616]/60">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <Link
            href="/authenticity"
            className={`${buttonVariants({ variant: "primary", size: "lg" })} mt-9 inline-flex`}
          >
            See how we verify
          </Link>
        </div>
      </div>
    </section>
  );
}

export default AuthenticityShowcase;
