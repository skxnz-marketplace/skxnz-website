import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-full items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-sandstone/80 bg-white/70 px-3 py-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-sangria",
        className,
      )}
    >
      {children}
    </span>
  );
}
