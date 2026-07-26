import Link from "next/link";

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

const CATEGORY_IMAGES: Record<string, string> = {
  Sneakers: "/assets/home/categories/sneakers.webp",
  Jackets: "/assets/home/categories/jackets.webp",
  Watches: "/assets/home/categories/watches.webp",
  Streetwear: "/assets/home/categories/streetwear.webp",
  Bags: "/assets/home/categories/bags.webp",
  Accessories: "/assets/home/categories/accessories.webp",
};

export function CategoryStrip() {
  return (
    <section aria-label="Shop by category" className="bg-[#F4F1EC]">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {categoryItems.map((cat) => {
          const image = CATEGORY_IMAGES[cat.label];

          return (
            <Link
              key={cat.label}
              href={cat.href}
              className={cn(
                "group relative flex h-[150px] items-end overflow-hidden bg-gradient-to-br bg-cover bg-center bg-no-repeat sm:h-[190px] lg:h-[230px]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white",
                CATEGORY_COLORS[cat.label] ?? "from-[#1a1a1c] to-[#2d2d32]",
              )}
              style={
                image
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(6, 6, 8, 0.08) 0%, rgba(6, 6, 8, 0.22) 46%, rgba(6, 6, 8, 0.72) 100%), url(${image})`,
                    }
                  : undefined
              }
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-white/0 transition-colors duration-200 ease-out group-hover:bg-white/[0.05]"
              />
              <span className="relative px-5 pb-4 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-white/90 transition-colors duration-200 group-hover:text-white">
                {cat.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
