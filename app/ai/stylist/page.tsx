import Link from "next/link";

import { AiPhaseOneStudio } from "@/components/ai/ai-phase-one-studio";
import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { buttonVariants } from "@/components/ui/button";

export default function AIStylistPage() {
  return (
    <DemoRoleGate
      allowedRoles={["buyer", "seller", "admin"]}
      areaLabel="AI Assistant Beta"
      helperText="The AI Assistant Beta is in early access. Sign in to explore catalogue-aware styling help while SKXNZ prepares for public launch."
    >
      <div className="min-h-screen bg-[linear-gradient(135deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep)_52%,var(--skxnz-maroon))] text-[var(--skxnz-text-light)] motion-safe:animate-[skxnz-ai-page-in_420ms_ease-out]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
            <div className="min-w-0">
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[var(--skxnz-glint)]">
                AI Assistant Beta
              </p>
              <h1 className="mt-3 max-w-3xl text-[2.25rem] font-semibold uppercase leading-[0.96] tracking-[-0.025em] sm:text-5xl">
                Catalog-aware style workspace.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/[0.72]">
                Ask for SKXNZ catalog picks, outfit direction, and seller-safe listing
                help. No visual try-on or product invention is live.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/shop"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "lg",
                    className:
                      "border-white/[0.15] bg-white/10 text-[var(--skxnz-text-light)] hover:bg-white/[0.16] hover:text-[var(--skxnz-text-light)]",
                  })}
                >
                  Browse Catalog
                </Link>
                <Link
                  href="/ai-tools/product-title"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "lg",
                    className:
                      "border-white/[0.12] bg-transparent text-white/[0.78] hover:bg-white/10 hover:text-white",
                  })}
                >
                  Title Tool
                </Link>
              </div>
            </div>

            <aside className="rounded-[24px] bg-white/[0.08] p-5 ring-1 ring-white/10 backdrop-blur">
              <p className="text-[0.64rem] font-black uppercase tracking-[0.14em] text-[var(--skxnz-glint)]">
                Relevance rule
              </p>
              <p className="mt-3 text-sm leading-6 text-white/[0.72]">
                Recommendations must come from SKXNZ catalog data. Promoted placements
                may influence featured suggestions when relevant, with disclosure.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Catalog only", "No try-on live", "Beta"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-white/[0.76] ring-1 ring-white/10"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </aside>
          </section>

          <div className="mt-6 rounded-[30px] bg-[var(--skxnz-bg)] p-3 text-[var(--skxnz-text-dark)] shadow-[0_30px_90px_rgba(16,0,6,0.28)] ring-1 ring-white/10 sm:p-5">
            <AiPhaseOneStudio />
          </div>
        </div>
      </div>
    </DemoRoleGate>
  );
}
