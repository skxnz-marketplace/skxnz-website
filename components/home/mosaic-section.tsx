import Link from "next/link";

import { cn } from "@/lib/cn";
import { mosaicTiles } from "@/lib/home-data";

const TILE_GRADIENTS = [
  "from-[#0f0f14] to-[#1e1e2a]",
  "from-[#0f0c10] to-[#1e1622]",
  "from-[#0c0f0e] to-[#162020]",
  "from-[#100e0c] to-[#20181a]",
  "from-[#0e0e10] to-[#1a1a20]",
  "from-[#0c0e10] to-[#181e26]",
];

export function MosaicSection() {
  return (
    <section
      aria-label="Shop by category"
      className="relative isolate overflow-hidden bg-[#7b262c] py-12"
    >
      {/* Brand gradient backdrop — spans the section horizontally, tiles sit on top */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/home/shop-the-edit-gradient.svg')" }}
      />

      <div className="relative mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <h2 className="font-grotesk mb-6 text-xl font-bold uppercase tracking-[-0.01em] text-[#F4F1EC]">
          Shop The Edit
        </h2>

        {/*
          Mosaic grid:
          desktop: 4 cols — tile[0] spans 2×2, rest fill remaining cells
          mobile: 2 cols uniform
        */}
        <div className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[180px] lg:grid-cols-4 lg:auto-rows-[200px]">
          {mosaicTiles.map((tile, i) => (
            <Link
              key={tile.label}
              href={tile.href}
              className={cn(
                "group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br p-4",
                TILE_GRADIENTS[i % TILE_GRADIENTS.length],
                // Apply desktop spans
                i === 0 ? "lg:col-span-2 lg:row-span-2" : "",
                i === 3 ? "col-span-2 lg:col-span-2" : "",
              )}
            >
              {/* Subtle label watermark */}
              <span className="absolute inset-x-0 top-1/3 -translate-y-1/2 text-center text-[clamp(1rem,3vw,2.5rem)] font-bold uppercase tracking-widest text-white/[0.04] select-none">
                {tile.label}
              </span>

              <div className="relative z-10">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#F4F1EC]">
                  {tile.label}
                </p>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-[#F4F1EC]/50 transition group-hover:text-[#00E5FF]">
                  {tile.cta} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
