import type { ReactNode } from "react";

import { SectionHeading } from "@/components/sections/section-heading";
import { Card } from "@/components/ui/card";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  footer?: ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
  /** Pass "h1" when this PageIntro is the page's only/primary heading (no
   * other h1 exists on the page). Defaults to h2. See SectionHeading. */
  headingLevel?: "h1" | "h2";
};

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  footer,
  titleClassName,
  descriptionClassName,
  headingLevel,
}: PageIntroProps) {
  return (
    <Card className="section-border rounded-[28px] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          titleClassName={titleClassName}
          descriptionClassName={descriptionClassName}
          as={headingLevel}
        />
        {actions ? <div className="flex min-w-0 flex-wrap gap-3">{actions}</div> : null}
      </div>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </Card>
  );
}
