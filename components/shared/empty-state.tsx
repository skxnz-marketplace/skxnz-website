import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <Card className="section-border rounded-[32px] p-8 text-center">
      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
        MVP Placeholder
      </p>
      <h2 className="mx-auto mt-4 max-w-[13ch] break-words font-display text-[1.28rem] uppercase leading-[1] tracking-[0.05em] text-midnightbrown sm:max-w-none sm:text-2xl sm:tracking-[0.14em]">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-silver">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <div className="mt-6">
          <Link href={actionHref} className={buttonVariants({ variant: "secondary" })}>
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
