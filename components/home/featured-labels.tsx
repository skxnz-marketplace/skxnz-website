"use client";

import Link from "next/link";

import LogoLoop, { type LogoItem } from "@/components/reactbits/logo-loop";
import { brandLabels, type BrandLabel } from "@/lib/home-data";

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

type FeaturedLabelsProps = {
  /** Live active brands from Supabase; falls back to static labels when empty. */
  brands?: BrandLabel[];
};

function BrandBadge({ badge, colorClass }: { badge: BrandLabel; colorClass: string }) {
  const isPlus = badge.monogram === "+18";
  return (
    <Link
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
}

export function FeaturedLabels({ brands }: FeaturedLabelsProps) {
  const source = brands && brands.length > 0 ? brands : brandLabels;
  const allBadges = [...source, { name: "+18", monogram: "+18" }];

  const logos: LogoItem[] = allBadges.map((badge, i) => {
    const isPlus = badge.monogram === "+18";
    const colorClass = isPlus ? PLUS_BADGE : (BADGE_COLORS[i % BADGE_COLORS.length] ?? BADGE_COLORS[0]);
    return {
      node: <BrandBadge badge={badge} colorClass={colorClass} />,
      ariaLabel: badge.name,
    };
  });

  return (
    <section aria-label="Top brands" className="overflow-hidden bg-[#F4F1EC] pb-3 pt-8">
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

      <LogoLoop
        logos={logos}
        speed={28}
        direction="left"
        gap={16}
        logoHeight={64}
        pauseOnHover
        fadeOut
        fadeOutColor="#F4F1EC"
        ariaLabel="Top brands"
      />
    </section>
  );
}
