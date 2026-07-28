"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

export type CardStackItem = {
  id: number | string;
  title: string;
  description: string;
  imageSrc: string;
  href?: string;
};

type CardStackProps = {
  items: CardStackItem[];
  /** Index shown on top at mount. */
  initialIndex?: number;
  /** Auto-cycle through cards on a timer. */
  autoAdvance?: boolean;
  /** Auto-advance interval in ms. */
  intervalMs?: number;
  /** Pause auto-advance while the pointer is over the stack. */
  pauseOnHover?: boolean;
  /** Show clickable position dots below the stack. */
  showDots?: boolean;
  className?: string;
};

// Fan layout — front card centered, up to DEPTH cards splayed to each side.
// No wrap-around in the transform math, so no cross-front "teleport" jump.
// Auto-advance wraps via modulo (that's fine when triggered explicitly).
const DEPTH = 2;
const X_STEP = 42; // percent of card width each depth level shifts outward
const ROT_STEP = 10; // degrees of tilt per depth level
const SCALE_STEP = 0.07;
const OPACITY_STEP = 0.28;

export function CardStack({
  items,
  initialIndex = 0,
  autoAdvance = false,
  intervalMs = 4000,
  pauseOnHover = true,
  showDots = false,
  className,
}: CardStackProps) {
  const count = items.length;
  const clampIndex = useCallback(
    (n: number) => (count === 0 ? 0 : Math.max(0, Math.min(count - 1, n))),
    [count],
  );

  const [active, setActive] = useState(() => clampIndex(initialIndex));
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((i: number) => setActive(clampIndex(i)), [clampIndex]);
  const goPrev = useCallback(
    () => setActive((a) => (a - 1 + count) % count),
    [count],
  );
  const goNext = useCallback(
    () => setActive((a) => (a + 1) % count),
    [count],
  );

  // Auto-advance (opt-in via prop). Wraps via modulo — instant jump only when
  // the user opted in; disabled by default.
  useEffect(() => {
    if (!autoAdvance || count <= 1 || paused) return;
    const id = setInterval(goNext, Math.max(1200, intervalMs));
    return () => clearInterval(id);
  }, [autoAdvance, count, paused, intervalMs, goNext]);

  // Keyboard nav when the stack has focus.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  if (count === 0) return null;

  return (
    <div
      ref={rootRef}
      className={cn("flex flex-col items-center gap-6", className)}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
    >
      <div
        className="relative w-full overflow-visible"
        style={{ aspectRatio: "16 / 10" }}
        role="group"
        aria-roledescription="carousel"
        aria-label="Featured cards"
      >
        {items.map((item, i) => {
          // Signed distance from front card — NOT wrapped. Items past ±DEPTH
          // fade out in place rather than teleporting across the front.
          const signed = i - active;
          const abs = Math.abs(signed);
          const dir = Math.sign(signed);
          const clamped = Math.min(abs, DEPTH);
          const isFront = signed === 0;
          const hidden = abs > DEPTH;

          const translateX = dir * clamped * X_STEP;
          const rotate = dir * clamped * ROT_STEP;
          const scale = 1 - clamped * SCALE_STEP;
          const opacity = hidden ? 0 : 1 - clamped * OPACITY_STEP;

          const cardClasses =
            "group relative block h-full w-full overflow-hidden rounded-3xl bg-[#0E0E10] shadow-2xl ring-1 ring-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

          const inner = (
            <>
              <Image
                src={item.imageSrc}
                alt={item.title}
                fill
                sizes="(max-width: 1024px) 90vw, 900px"
                className="object-cover object-center transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
                <h3 className="font-grotesk text-[clamp(1.4rem,2.6vw,2.4rem)] font-bold uppercase leading-[0.98] tracking-[-0.02em] text-[#F4F1EC]">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-[42ch] text-sm font-medium leading-relaxed text-[#F4F1EC]/70">
                  {item.description}
                </p>
              </div>
            </>
          );

          return (
            <div
              key={item.id}
              className="absolute inset-0 will-change-transform transition-[transform,opacity] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{
                // translate3d promotes to its own compositor layer → smoother
                // transforms with no repaint jank.
                transform: `translate3d(${translateX}%, 0, 0) rotate(${rotate}deg) scale(${scale})`,
                opacity,
                zIndex: count - abs,
                // Hidden cards must not swallow clicks that belong to the fade
                // area behind the fan.
                pointerEvents: hidden ? "none" : "auto",
              }}
              aria-hidden={!isFront}
            >
              {isFront && item.href ? (
                <Link
                  href={item.href}
                  aria-label={item.title}
                  className={cardClasses}
                >
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={isFront ? item.title : `Show ${item.title}`}
                  className={cn(cardClasses, "text-left")}
                  tabIndex={hidden ? -1 : 0}
                  disabled={hidden}
                >
                  {inner}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showDots && count > 1 && (
        <div className="flex items-center gap-2" role="tablist" aria-label="Select card">
          {items.map((item, i) => {
            const isActive = i === active;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show ${item.title}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-[3px] rounded-full transition-all duration-300",
                  isActive ? "w-8 bg-[#161616]" : "w-3 bg-[#161616]/25 hover:bg-[#161616]/45",
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CardStack;
