"use client";

import Link from "next/link";

import { CardStack, type CardStackItem } from "@/components/ui/card-stack";

// Placeholder imagery — reuses assets added today. Swap imageSrc/href per card
// when the real Luxury Finds product shots land.
const items: CardStackItem[] = [
  {
    id: 1,
    title: "Silver Dial Timepiece",
    description: "Precision movement, mirror-polished case.",
    imageSrc: "/assets/home/shop-the-edit/timepieces.png",
    href: "/shop",
  },
  {
    id: 2,
    title: "Designer Selects",
    description: "Curated pieces from the labels that define the season.",
    imageSrc: "/assets/home/shop-the-edit/designer-selects.png",
    href: "/shop",
  },
  {
    id: 3,
    title: "Liquid Silver",
    description: "A signature scent with a chrome-clean finish.",
    imageSrc: "/assets/home/trending/liquid-silver-perfume.jpeg",
    href: "/shop",
  },
  {
    id: 4,
    title: "Carry Goods",
    description: "Leather essentials built to outlast the trend cycle.",
    imageSrc: "/assets/home/shop-the-edit/carry-goods.png",
    href: "/shop",
  },
  {
    id: 5,
    title: "Luxury Sneakers",
    description: "Elevated silhouettes for the everyday flex.",
    imageSrc: "/assets/home/shop-the-edit/luxury-sneakers.webp",
    href: "/shop",
  },
];

export function LuxuryFinds() {
  return (
    <section aria-label="Luxury Finds" className="overflow-hidden bg-[#F4F1EC] py-12">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10 lg:px-16">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="font-grotesk text-xl font-bold uppercase tracking-[-0.01em] text-[#161616]">
            Luxury Finds
          </h2>
          <Link
            href="/shop"
            className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#2E1014] transition hover:opacity-70"
          >
            View All →
          </Link>
        </div>

        <CardStack items={items} initialIndex={0} showDots />
      </div>
    </section>
  );
}
