import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const reviewSteps = [
  "Application received",
  "Internal review",
  "Documents requested later",
  "Dashboard Beta preview",
];

export function SellerApplicationHero() {
  return (
    <section className="overflow-hidden rounded-[30px] border border-[rgba(58,8,24,0.12)] bg-[linear-gradient(135deg,var(--skxnz-maroon-deep),var(--skxnz-maroon),var(--skxnz-obsidian))] text-[var(--skxnz-text-light)] shadow-[0_22px_60px_rgba(58,8,24,0.18)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_0.72fr]">
        <div className="min-w-0 p-5 sm:p-7 lg:p-8">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--skxnz-glint)]">
            Seller application beta
          </p>
          <h1 className="mt-4 max-w-[12ch] break-words font-display text-[2.2rem] font-semibold uppercase leading-[0.98] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
            Sell with the signal.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[rgba(255,254,250,0.78)]">
            Apply for internal review across fashion, streetwear, sneakers,
            accessories, perfume, and futurewear.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#seller-application-form"
              className={buttonVariants({
                variant: "secondary",
                size: "lg",
                className: "border-[rgba(255,254,250,0.22)] bg-[#FFFEFA] text-sangria",
              })}
            >
              Start Application
            </a>
            <Link
              href="/contact"
              className={buttonVariants({
                variant: "ghost",
                size: "lg",
                className:
                  "border-[rgba(255,254,250,0.16)] text-[var(--skxnz-text-light)] hover:bg-white/[0.08] hover:text-[var(--skxnz-text-light)]",
              })}
            >
              Contact SKXNZ
            </Link>
          </div>
        </div>

        <div className="min-w-0 border-t border-[rgba(255,254,250,0.10)] bg-white/[0.05] p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[rgba(255,254,250,0.68)]">
            Review flow
          </p>
          <div className="mt-4 grid gap-2">
            {reviewSteps.map((step, index) => (
              <Card
                key={step}
                className="border-[rgba(255,254,250,0.12)] bg-white/[0.07] p-3 text-[var(--skxnz-text-light)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(34,211,238,0.32)] bg-[rgba(34,211,238,0.10)] text-xs font-black text-[var(--skxnz-glint)]">
                    {index + 1}
                  </span>
                  <span className="line-clamp-2 text-xs font-bold uppercase tracking-[0.1em]">
                    {step}
                  </span>
                </div>
              </Card>
            ))}
          </div>
          <p className="mt-4 rounded-[20px] border border-[rgba(255,254,250,0.12)] bg-white/[0.06] p-3 text-xs leading-5 text-[rgba(255,254,250,0.76)]">
            No instant approval. Secure document handling comes later.
          </p>
        </div>
      </div>
    </section>
  );
}
