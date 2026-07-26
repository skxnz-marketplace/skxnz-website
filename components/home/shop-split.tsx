"use client";

import Link from "next/link";

type Panel = {
  id: "men" | "women";
  label: string;
  cta: string;
  href: string;
  backdrop: string;
  tint: string;
};

const PANELS: Panel[] = [
  {
    id: "men",
    label: "Shop Men",
    cta: "Enter the edit",
    href: "/shop?gender=men",
    backdrop:
      "url('/assets/home/shop-men.jpg'), url('/assets/home/shop-men.svg')",
    tint: "from-[#04121c]/85 via-[#04121c]/45 to-[#04121c]/20",
  },
  {
    id: "women",
    label: "Shop Women",
    cta: "Enter the edit",
    href: "/shop?gender=women",
    backdrop:
      "url('/assets/home/shop-women.jpg'), url('/assets/home/shop-women.svg')",
    tint: "from-[#1c0410]/85 via-[#1c0410]/45 to-[#1c0410]/20",
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

export function ShopSplit() {
  return (
    <section aria-label="Shop by department" className="w-full overflow-hidden bg-[#0E0E10]">
      <div className="flex min-h-[440px] flex-col sm:min-h-[clamp(560px,42vw,680px)] sm:flex-row">
        {PANELS.map((panel) => (
          <Link
            key={panel.id}
            href={panel.href}
            aria-label={`${panel.label} - ${panel.cta}`}
            className={`group relative isolate flex min-h-[220px] w-full items-end overflow-hidden sm:w-1/2 sm:flex-none sm:transform-gpu sm:transition-transform sm:duration-[240ms] sm:ease-[cubic-bezier(0.22,1,0.36,1)] sm:will-change-transform sm:hover:z-10 sm:hover:scale-x-[1.5] sm:focus-visible:z-10 sm:focus-visible:scale-x-[1.5] motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white ${panel.id === "men" ? "sm:origin-left" : "sm:origin-right"}`}
          >
            {/* Transform is the only animated property: no width, font, or layout reflow. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: panel.backdrop }}
            />

            <span
              aria-hidden="true"
              className={`absolute inset-0 -z-10 bg-gradient-to-t opacity-90 ${panel.tint}`}
            />

            <div
              className={`relative w-full p-6 sm:p-8 lg:p-10 sm:transform-gpu sm:transition-transform sm:duration-[240ms] sm:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none ${panel.id === "men" ? "sm:origin-left sm:group-hover:scale-x-[0.666667] sm:group-focus-visible:scale-x-[0.666667]" : "sm:origin-right sm:group-hover:scale-x-[0.666667] sm:group-focus-visible:scale-x-[0.666667]"}`}
            >
              <h3 className="font-grotesk text-[clamp(1.9rem,4vw,3.6rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em] text-[#F4F1EC]">
                {panel.label}
              </h3>
              <span className="mt-3 inline-flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#F4F1EC]/75">
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
