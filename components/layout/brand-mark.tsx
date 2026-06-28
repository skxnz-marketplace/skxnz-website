import Link from "next/link";

import { SafeImage } from "@/components/shared/safe-image";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/lib/site";
import { skxnzFallbackAssets } from "@/src/lib/assets";

type BrandMarkProps = {
  className?: string;
  compact?: boolean;
};

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <Link
      href="/"
      className={cn("inline-flex min-w-0 items-center gap-3", className)}
      aria-label="SKXNZ home"
    >
      <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">
        <SafeImage
          src={siteConfig.brandAssets.mark}
          fallbackSrc={skxnzFallbackAssets.brand}
          alt="SKXNZ mark"
          fill
          sizes="44px"
          className="object-contain drop-shadow-[0_10px_18px_rgba(90,31,46,0.12)]"
        />
      </span>
      <span className="min-w-0 space-y-2">
        <span className="flex max-w-full items-center">
          <SafeImage
            src={siteConfig.brandAssets.wordmark}
            fallbackSrc={skxnzFallbackAssets.brand}
            alt="SKXNZ"
            width={2172}
            height={724}
            className="h-5 w-auto max-w-full object-contain drop-shadow-[0_10px_18px_rgba(90,31,46,0.1)] sm:h-6"
          />
        </span>
        {!compact ? (
          <span className="block text-[0.66rem] uppercase tracking-[0.28em] text-silver">
            {siteConfig.tagline}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
