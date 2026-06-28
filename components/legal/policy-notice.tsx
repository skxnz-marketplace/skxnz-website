import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type PolicyNoticeProps = {
  children: ReactNode;
  tone?: "draft" | "beta" | "warning";
  className?: string;
};

const toneClassNames = {
  draft: "border-sangria/20 bg-sangria/[0.06] text-sangria",
  beta: "border-teal/20 bg-teal/[0.08] text-midnightbrown",
  warning: "border-bronze/30 bg-bronze/[0.08] text-midnightbrown",
};

export function PolicyNotice({
  children,
  tone = "draft",
  className,
}: PolicyNoticeProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[24px] border px-4 py-3 text-sm leading-6 shadow-[0_12px_30px_rgba(58,8,24,0.06)]",
        toneClassNames[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
