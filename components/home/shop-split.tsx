"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";

type Panel = {
  id: "men" | "women";
  label: string;
  cta: string;
  href: string;
  src: string;
  /** object-position — tuned per photo so the subject's face/body stays in frame. */
  objectPosition: string;
  tint: string;
  align: "left" | "right";
};

const PANELS: Panel[] = [
  {
    id: "men",
    label: "Shop Men",
    cta: "Enter the edit",
    href: "/shop?gender=men",
    src: "/assets/home/shop-men.png",
    objectPosition: "30% 20%",
    tint: "from-[#04121c]/85 via-[#04121c]/35 to-transparent",
    align: "left",
  },
  {
    id: "women",
    label: "Shop Women",
    cta: "Enter the edit",
    href: "/shop?gender=women",
    src: "/assets/home/shop-women.png",
    objectPosition: "50% 15%",
    tint: "from-[#1c0410]/85 via-[#1c0410]/35 to-transparent",
    align: "right",
  },
];

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M7 12h10m0 0-4-4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Each photo is rendered at full quality and never resized or stretched.
 * Both photos overlay the ENTIRE stage; clip-path is what shows only half
 * of each at rest. Hovering widens the clip window to the full image —
 * a genuine reveal of more real pixels, not a scaled/blurred crop.
 * clip-path also clips hit-testing, so each half stays independently
 * clickable at rest with no extra pointer-events wiring needed.
 *
 * Tailwind's JIT scanner reads this file as static text, so these two
 * class strings must be written out in full — building them from a
 * template literal would leave the arbitrary clip-path values unresolved.
 *
 * Hovering reveals to 88%, not 100% — a 12% sliver of the other panel
 * always stays visible at the far edge so it reads as "still there",
 * not replaced.
 */
const REVEAL_CLASSES: Record<Panel["align"], string> = {
  left: "sm:[clip-path:inset(0px_50%_0px_0px)] sm:hover:[clip-path:inset(0px_12%_0px_0px)] sm:focus-visible:[clip-path:inset(0px_12%_0px_0px)]",
  right:
    "sm:[clip-path:inset(0px_0px_0px_50%)] sm:hover:[clip-path:inset(0px_0px_0px_12%)] sm:focus-visible:[clip-path:inset(0px_0px_0px_12%)]",
};

export function ShopSplit() {
  return (
    <section aria-label="Shop by department" className="w-full overflow-hidden bg-[#0E0E10]">
      <div className="relative flex flex-col sm:block sm:h-[clamp(560px,42vw,680px)]">
        {PANELS.map((panel) => (
          <Link
            key={panel.id}
            href={panel.href}
            aria-label={`${panel.label} - ${panel.cta}`}
            className={cn(
              "group relative block h-[320px] w-full overflow-hidden",
              "sm:absolute sm:inset-0 sm:z-10 sm:h-full sm:overflow-visible",
              "sm:transition-[clip-path] sm:duration-[420ms] sm:ease-[cubic-bezier(0.22,1,0.36,1)]",
              "sm:hover:z-20 sm:focus-visible:z-20",
              "motion-reduce:transition-none",
              "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white",
              REVEAL_CLASSES[panel.align],
            )}
          >
            <Image
              src={panel.src}
              alt={panel.label}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
              style={{ objectPosition: panel.objectPosition }}
            />

            <span
              aria-hidden="true"
              className={`absolute inset-0 bg-gradient-to-t opacity-90 ${panel.tint}`}
            />

            <div
              className={cn(
                "absolute bottom-0 w-full p-6 sm:w-1/2 sm:p-8 lg:p-10",
                panel.align === "left" ? "left-0" : "right-0 sm:text-right",
              )}
            >
              <h3 className="font-grotesk text-[clamp(1.9rem,4vw,3.6rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em] text-[#F4F1EC]">
                {panel.label}
              </h3>
              <span
                className={cn(
                  "mt-3 inline-flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#F4F1EC]/75",
                  panel.align === "right" && "sm:flex-row-reverse",
                )}
              >
                {panel.cta}
                <ArrowRight />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
