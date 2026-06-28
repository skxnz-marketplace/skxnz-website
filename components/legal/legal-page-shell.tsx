import type { ReactNode } from "react";

import { PolicyNotice } from "@/components/legal/policy-notice";
import { Badge } from "@/components/ui/badge";

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  notice?: ReactNode;
};

export function LegalPageShell({
  eyebrow,
  title,
  description,
  children,
  notice = "Draft for review before public launch. This page is not final legal advice.",
}: LegalPageShellProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section className="overflow-hidden rounded-[36px] border border-[var(--skxnz-border)] bg-[linear-gradient(135deg,var(--skxnz-maroon-deep),var(--skxnz-maroon),var(--skxnz-obsidian))] p-6 text-pearlcream shadow-[0_28px_70px_rgba(26,3,11,0.22)] sm:p-8 lg:p-10">
        <Badge className="border-pearlcream/20 bg-pearlcream/10 text-pearlcream">
          {eyebrow}
        </Badge>
        <h1 className="mt-6 max-w-4xl font-display text-4xl uppercase leading-[0.95] tracking-[0.04em] text-pearlcream sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-pearlcream/78 sm:text-base">
          {description}
        </p>
        <PolicyNotice tone="beta" className="mt-7 border-pearlcream/15 bg-pearlcream/[0.08] text-pearlcream/82">
          {notice}
        </PolicyNotice>
      </section>

      <div className="mt-8 grid gap-5">{children}</div>
    </main>
  );
}
