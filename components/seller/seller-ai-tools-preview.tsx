import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sellerToolPreviews } from "@/lib/data/seller-dashboard";

export function SellerAiToolsPreview() {
  return (
    <Card className="rounded-[34px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5 shadow-[0_18px_55px_rgba(58,8,24,0.07)] sm:p-7">
      <Badge>AI seller tools preview</Badge>
      <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.08em] text-midnightbrown">
        Future seller tooling
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-stone">
        These are beta workflow surfaces. Product publishing, video generation, image
        enhancement, and automated approval are not live.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sellerToolPreviews.map((tool) => (
          <div
            key={tool.title}
            className="min-w-0 rounded-[28px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-card)] p-5"
          >
            <span className="inline-flex rounded-full border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.07)] px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-sangria">
              {tool.status}
            </span>
            <h3 className="mt-4 line-clamp-2 text-lg font-black text-midnightbrown">
              {tool.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-stone">{tool.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-[28px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-stone">
          Existing AI listing routes remain placeholders and review aids, not automatic
          seller publishing tools.
        </p>
        <Link
          href="/ai-tools/product-description"
          className={buttonVariants({ variant: "secondary", size: "lg" })}
        >
          Open Preview
        </Link>
      </div>
    </Card>
  );
}
