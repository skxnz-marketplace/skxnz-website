import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

type SupportCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function SupportCard({ title, description, children }: SupportCardProps) {
  return (
    <Card className="section-border rounded-[28px] bg-white p-5">
      <h2 className="font-display text-xl uppercase tracking-[0.1em] text-sangria">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-midnightbrown/70">
        {description}
      </p>
      {children ? <div className="mt-4">{children}</div> : null}
    </Card>
  );
}
