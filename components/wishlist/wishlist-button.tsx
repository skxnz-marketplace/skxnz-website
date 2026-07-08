"use client";

import { useState } from "react";

import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/data/products";

type WishlistButtonProps = {
  productId: string;
  /** Full product snapshot. REQUIRED for LIVE catalog products so they can be
   * saved (they are not in the browser-local demo catalog). Optional for demo
   * products, which the provider can resolve from the local catalog by id. */
  product?: Product;
  className?: string;
  labelClassName?: string;
  showLabel?: boolean;
  savedLabel?: string;
  unsavedLabel?: string;
  onToggle?: (saved: boolean) => void;
};

export function WishlistButton({
  productId,
  product,
  className,
  labelClassName,
  showLabel = false,
  savedLabel = "Saved",
  unsavedLabel = "Save",
  onToggle,
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useMarketplace();
  const [isPressed, setIsPressed] = useState(false);
  const saved = isInWishlist(productId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleWishlist(productId, product);
        onToggle?.(!saved);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        "inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-[var(--skxnz-border)] bg-[var(--skxnz-surface)] text-[var(--skxnz-maroon)] shadow-[0_10px_24px_rgba(58,8,24,0.08)] transition hover:border-[rgba(139,92,246,0.26)] hover:text-[var(--skxnz-maroon-deep)]",
        saved ? "border-[rgba(217,70,239,0.24)] bg-[rgba(217,70,239,0.07)]" : "",
        isPressed ? "scale-95" : "",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} className="h-4 w-4 shrink-0">
        <path
          d="M19.4 5.6a5 5 0 0 0-7.1 0L12 5.9l-.3-.3a5 5 0 0 0-7.1 7.1l.3.3L12 20l7.1-7 .3-.3a5 5 0 0 0 0-7.1Z"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel ? (
        <span className={cn("line-clamp-1 text-xs font-bold uppercase tracking-[0.14em]", labelClassName)}>
          {saved ? savedLabel : unsavedLabel}
        </span>
      ) : null}
    </button>
  );
}
