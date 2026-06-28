import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-panel min-w-0 rounded-[20px] border border-sandstone/70 p-4 shadow-[0_10px_28px_rgba(58,8,24,0.045)]",
        className,
      )}
      {...props}
    />
  );
}
