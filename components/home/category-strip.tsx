"use client";

import Link from "next/link";
import { useRef } from "react";

import { cn } from "@/lib/cn";
import { categoryItems } from "@/lib/home-data";

const CATEGORY_COLORS: Record<string, string> = {
  Sneakers:    "from-[#1a1a24] to-[#252538]",
  Jackets:     "from-[#1a1416] to-[#2a1c20]",
  Watches:     "from-[#141a18] to-[#1c2826]",
  Streetwear:  "from-[#181418] to-[#261c28]",
  Bags:        "from-[#16181a] to-[#222830]",
  Accessories: "from-[#1a1816] to-[#2a2420]",
};

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="m14.5 5.5-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="m9.5 5.5 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CategoryStrip() {
  const stripRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    stripRef.current?.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  }

  return (
    <section aria-label="Shop by category" className="relative bg-[#F4F1EC] py-6">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <div className="relative">
          {/* Left arrow */}
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll categories left"
            className="absolute -left-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/8 transition hover:shadow-lg lg:flex"
          >
            <ChevronLeft />
          </button>

          {/* Strip */}
          <div
            ref={stripRef}
            className="flex gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categoryItems.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="group flex shrink-0 flex-col items-center gap-2"
              >
                <div
                  className={cn(
                    "relative flex h-[100px] w-[140px] items-end overflow-hidden rounded-xl bg-gradient-to-br sm:h-[112px] sm:w-[158px]",
                    CATEGORY_COLORS[cat.label] ?? "from-[#1a1a1c] to-[#2d2d32]",
                  )}
                >
                  <span className="absolute inset-x-0 bottom-2 px-3 text-[0.6rem] font-medium uppercase tracking-[0.15em] text-white/25">
                    {cat.label}
                  </span>
                </div>
                <span className="text-[0.74rem] font-semibold uppercase tracking-[0.1em] text-[#161616] transition group-hover:text-[#2E1014]">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Right arrow */}
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll categories right"
            className="absolute -right-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/8 transition hover:shadow-lg lg:flex"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
