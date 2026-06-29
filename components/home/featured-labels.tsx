"use client";

import Link from "next/link";

import { brandLabels } from "@/lib/home-data";

const BADGE_COLORS = [
  "bg-[#1a1a24] text-[#8888cc]",
  "bg-[#1a1416] text-[#cc8888]",
  "bg-[#141a18] text-[#88ccaa]",
  "bg-[#181418] text-[#cc88cc]",
  "bg-[#16181a] text-[#88aacc]",
  "bg-[#1a1816] text-[#ccaa88]",
  "bg-[#121212] text-[#aaaaaa]",
  "bg-[#1a1a1c] text-[#99ccbb]",
  "bg-[#141416] text-[#bb99cc]",
  "bg-[#181818] text-[#ccbb99]",
  "bg-[#161614] text-[#aabb99]",
];

const PLUS_BADGE = "bg-[#0E0E10] text-[#F4F1EC]/60";

const allBadges = [...brandLabels, { name: "+18", monogram: "+18" }];
// Duplicate for seamless marquee loop
const doubled = [...allBadges, ...allBadges];

export function FeaturedLabels() {
  return (
    <section aria-label="Top brands" className="overflow-hidden bg-[#F4F1EC] py-8">
      <div className="mx-auto mb-5 flex max-w-[1440px] items-center justify-between px-6 sm:px-10 lg:px-16">
        <h2 className="font-grotesk text-xl font-bold uppercase tracking-[-0.01em] text-[#161616]">
          Top Brands
        </h2>
        <Link
          href="/brands"
          className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#2E1014] transition hover:opacity-70"
        >
          View All →
        </Link>
      </div>

      {/* Marquee */}
      <div className="relative">
        {/* Left fade */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-[#F4F1EC] to-transparent" />
        {/* Right fade */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-[#F4F1EC] to-transparent" />

        <div className="flex overflow-hidden">
          <div
            className="flex shrink-0 gap-4 pr-4"
            style={{ animation: "skxnz-marquee 32s linear infinite" }}
          >
            {doubled.map((badge, i) => {
              const isPlus = badge.monogram === "+18";
              const colorClass = isPlus ? PLUS_BADGE : (BADGE_COLORS[i % BADGE_COLORS.length] ?? BADGE_COLORS[0]);
              return (
                <Link
                  key={`${badge.name}-${i}`}
                  href="/brands"
                  className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full ${colorClass} transition hover:scale-105`}
                  aria-label={badge.name}
                >
                  <span className="text-[0.68rem] font-bold leading-none tracking-tight">
                    {badge.monogram}
                  </span>
                  {!isPlus && (
                    <span className="mt-0.5 text-[0.42rem] font-medium uppercase tracking-[0.1em] opacity-60">
                      {badge.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
