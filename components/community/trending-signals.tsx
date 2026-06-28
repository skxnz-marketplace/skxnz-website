import Link from "next/link";

type TrendingSignalsProps = {
  tags: string[];
};

function getTagHref(tag: string) {
  const normalizedTag = tag.replace("#", "").trim().toLowerCase();

  if (normalizedTag.includes("limited")) {
    return "/categories/limited-edition";
  }

  if (normalizedTag.includes("newseason")) {
    return "/categories/new-season";
  }

  if (normalizedTag.includes("aistyled")) {
    return "/categories/ai-styled";
  }

  if (normalizedTag.includes("streetwear")) {
    return "/categories/streetwear";
  }

  return `/shop?q=${encodeURIComponent(tag.replace("#", ""))}`;
}

export function TrendingSignals({ tags }: TrendingSignalsProps) {
  return (
    <section
      id="signal-tags"
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      aria-label="Trending signal tags"
    >
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.66rem] font-black uppercase tracking-[0.24em] text-[var(--skxnz-maroon)]">
            Trending Signals
          </p>
          <p className="mt-1 text-sm text-[var(--skxnz-text-muted)]">
            Demo tags route to existing SKXNZ discovery pages.
          </p>
        </div>
      </div>

      <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <div className="flex min-w-max gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={getTagHref(tag)}
              className="rounded-full border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.18em] text-[var(--skxnz-text-dark)] shadow-[0_10px_26px_rgba(58,8,24,0.05)] transition hover:border-[rgba(34,211,238,0.45)] hover:text-[var(--skxnz-maroon)]"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
