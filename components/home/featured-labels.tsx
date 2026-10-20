"use client";

import Image from "next/image";
import Link from "next/link";

import LogoLoop, { type LogoItem } from "@/components/reactbits/logo-loop";

const BRAND_LOGOS = [
  { name: "Louis Vuitton", file: "louisvuitton-com-logo.png" },
  { name: "Hermès", file: "hermes-com-logo.png" },
  { name: "Cartier", file: "cartier-com-logo.png" },
  { name: "Chanel", file: "chanel-com-logo.png" },
  { name: "Gucci", file: "gucci-com-logo.png" },
  { name: "Prada", file: "prada-com-logo.png" },
  { name: "Burberry", file: "burberry-com-logo.png" },
  { name: "Loewe", file: "loewe-com-logo.png" },
  { name: "Celine", file: "celine-com-logo.png" },
  { name: "Balmain", file: "balmain-com-logo.png" },
  { name: "Dolce & Gabbana", file: "dolcegabbana-com-logo.png" },
  { name: "Tiffany & Co.", file: "tiffany-com-logo.png" },
  { name: "Patek Philippe", file: "patek-com-logo.png" },
  { name: "Omega", file: "omegawatches-com-logo.png" },
  { name: "Breitling", file: "breitling-com-logo.png" },
  { name: "Hublot", file: "hublot-com-logo.png" },
  { name: "Montblanc", file: "montblanc-com-logo.png" },
  { name: "Fossil", file: "fossil-com-logo.png" },
  { name: "Oakley", file: "oakley-com-logo.png" },
] as const;

function BrandLogo({ name, file }: { name: string; file: string }) {
  return (
    <Link
      href="/brands"
      className="flex h-16 w-28 shrink-0 items-center justify-center rounded-xl bg-white px-4 py-2 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
      aria-label={name}
    >
      <Image
        src={`/assets/brands/logos/${file}`}
        alt={name}
        width={140}
        height={48}
        className="h-full w-full object-contain"
      />
    </Link>
  );
}

export function FeaturedLabels() {
  const logos: LogoItem[] = BRAND_LOGOS.map((brand) => ({
    node: <BrandLogo name={brand.name} file={brand.file} />,
    ariaLabel: brand.name,
  }));

  return (
    <section aria-label="Editorial brand inspiration" className="overflow-hidden bg-[#F4F1EC] py-14 sm:py-20">
      <div className="mx-auto mb-8 flex max-w-[1440px] items-center justify-between gap-4 px-6 sm:px-10 lg:px-16">
        <h2 className="font-grotesk text-2xl font-bold uppercase tracking-[-0.015em] text-[#161616] sm:text-3xl">
          Brand Inspiration
        </h2>
        <Link
          href="/brands"
          className="inline-flex min-h-[44px] shrink-0 items-center rounded-full px-2 text-[0.8rem] font-bold uppercase tracking-[0.1em] text-[#2E1014] transition hover:opacity-70"
        >
          Catalogue Brands →
        </Link>
      </div>

      <p className="mx-auto mb-5 max-w-[1440px] px-6 text-sm text-[#2E1014] sm:px-10 lg:px-16">Editorial references. Logos do not indicate stock or marketplace partnerships.</p>
      <LogoLoop
        logos={logos}
        speed={28}
        direction="left"
        gap={20}
        logoHeight={64}
        pauseOnHover
        fadeOut
        fadeOutColor="#F4F1EC"
        ariaLabel="Editorial brand inspiration"
      />
    </section>
  );
}
