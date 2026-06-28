import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

type PolicySectionProps = {
  title: string;
  children: ReactNode;
  eyebrow?: string;
};

export function PolicySection({ title, children, eyebrow }: PolicySectionProps) {
  return (
    <Card className="section-border rounded-[30px] bg-white p-5 sm:p-6">
      {eyebrow ? (
        <p className="section-kicker text-[0.66rem] font-bold uppercase tracking-[0.22em] text-teal">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 font-display text-2xl uppercase tracking-[0.08em] text-sangria sm:text-3xl">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-midnightbrown/78 sm:text-base">
        {children}
      </div>
    </Card>
  );
}
