import Link from "next/link";

import { SafeImage } from "@/components/shared/safe-image";
import type { StyleBoard } from "@/lib/types/community";
import { skxnzFallbackAssets } from "@/src/lib/assets";

type StyleBoardPreviewProps = {
  boards: StyleBoard[];
};

export function StyleBoardPreview({ boards }: StyleBoardPreviewProps) {
  return (
    <section className="space-y-4">
      <div className="min-w-0">
        <p className="text-[0.66rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
          Featured Style Boards
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--skxnz-text-muted)]">
          Demo boards prepared for future account and community saves.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {boards.slice(0, 8).map((board) => (
          <Link
            key={board.id}
            href={`/shop?q=${encodeURIComponent(board.title)}`}
            className="group grid min-w-0 grid-cols-[5.4rem_minmax(0,1fr)] gap-3 overflow-hidden rounded-[24px] border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] p-3 shadow-[0_12px_34px_rgba(58,8,24,0.05)] transition hover:border-[rgba(34,211,238,0.38)]"
          >
            <div className="relative min-h-24 overflow-hidden rounded-[18px] bg-[var(--skxnz-bg-soft)]">
              <SafeImage
                src={board.image}
                fallbackSrc={skxnzFallbackAssets.product}
                alt={board.title}
                fill
                sizes="96px"
                className="object-cover object-center transition group-hover:scale-[1.04]"
              />
            </div>
            <div className="min-w-0 self-center">
              <p className="line-clamp-1 text-sm font-black uppercase tracking-[0.16em] text-[var(--skxnz-text-dark)]">
                {board.title}
              </p>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--skxnz-text-muted)]">
                {board.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {board.tags.slice(0, 2).map((tag) => (
                  <span
                    key={`${board.id}-${tag}`}
                    className="rounded-full border border-[var(--skxnz-border)] bg-[var(--skxnz-bg-soft)] px-2 py-1 text-[0.55rem] font-black uppercase tracking-[0.12em] text-[var(--skxnz-maroon)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
