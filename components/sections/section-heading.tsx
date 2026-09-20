import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  titleClassName?: string;
  descriptionClassName?: string;
  /** Document heading level for `title`. Defaults to h2 (this component is
   * usually one section among several on a page that has its own h1
   * elsewhere). Pass "h1" when a caller uses this as the page's only/primary
   * heading — visual size is controlled entirely by titleClassName/CSS, not
   * by this prop. */
  as?: "h1" | "h2";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  titleClassName,
  descriptionClassName,
  as: HeadingTag = "h2",
}: SectionHeadingProps) {
  return (
    <div className="min-w-0 max-w-3xl space-y-4">
      <Badge className="max-w-full">{eyebrow}</Badge>
      <div className="space-y-3">
        <HeadingTag
          className={cn(
            "text-wrap-safe break-words font-display text-[1.45rem] font-semibold uppercase leading-[1.02] tracking-[0.02em] text-midnightbrown sm:text-2xl sm:leading-[1.05] lg:text-3xl",
            titleClassName,
          )}
        >
          {title}
        </HeadingTag>
        <p
          className={cn(
            "text-wrap-safe max-w-full text-sm leading-6 text-silver",
            descriptionClassName,
          )}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
