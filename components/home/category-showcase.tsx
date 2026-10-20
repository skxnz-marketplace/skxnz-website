import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  { label: "Sneakers", href: "/categories/sneakers", image: "/assets/home/categories/sneakers.webp" },
  { label: "Jackets", href: "/categories/jackets", image: "/assets/home/categories/jackets.webp" },
  { label: "Watches", href: "/categories/watches", image: "/assets/home/categories/watches.webp" },
  { label: "Streetwear", href: "/categories/streetwear", image: "/assets/home/categories/streetwear.webp" },
  { label: "Bags", href: "/categories/bags", image: "/assets/home/categories/bags.webp" },
  { label: "Accessories", href: "/categories/accessories", image: "/assets/home/categories/accessories.webp" },
] as const;

/**
 * Replaces the old 150px-tall CategoryStrip. Same six categories, same
 * images, same routes — just given room to actually read as photography
 * instead of a thin ribbon of thumbnails.
 */
export function CategoryShowcase() {
  return (
    <section aria-label="Shop by category" className="bg-[#F4F1EC] py-14 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-grotesk text-2xl font-bold uppercase tracking-[-0.015em] text-[#161616] sm:text-3xl">
            Shop by Category
          </h2>
        </div>

        <p className="mb-5 text-sm text-[#2E1014]">Style inspiration. Category results show current availability.</p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group relative flex aspect-[4/5] items-end overflow-hidden rounded-[22px] bg-[#161616] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#161616] sm:aspect-[3/4]"
            >
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 30vw"
                className="object-cover object-center transition duration-500 ease-out group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="relative flex w-full items-center justify-between gap-2 p-4 sm:p-5">
                <span className="text-[0.9rem] font-bold uppercase tracking-[0.08em] text-white sm:text-base">
                  {cat.label}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition duration-300 group-hover:bg-white group-hover:text-[#161616]"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path
                      d="M7 12h10m0 0-4-4m4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategoryShowcase;
