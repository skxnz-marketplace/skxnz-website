import Link from "next/link";

import { SafeImage } from "@/components/shared/safe-image";
import { getProductHref } from "@/lib/catalog/product-links";
import { products } from "@/lib/data/products";
import { skxnzFallbackAssets } from "@/src/lib/assets";

const pillars = ["Drop Discussions", "Style Signals", "Member Fits"];

// Same honest framing as /community itself: the room is upcoming, not live.
// No invented posts, threads, or member activity — just what's arriving.
const previewProducts = products.slice(0, 4);

export function SignalRoomTeaser() {
  return (
    <section aria-label="Signal Room" className="bg-[#F4F1EC] py-16 sm:py-24">
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-6 sm:px-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:px-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2E1014]/15 bg-[#2E1014]/[0.05] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2E1014]/50" />
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#2E1014]/70">
              Coming Soon
            </span>
          </div>
          <h2 className="mt-5 font-grotesk text-[clamp(1.9rem,4vw,2.9rem)] font-bold uppercase leading-[0.98] tracking-[-0.02em] text-[#161616]">
            The Signal Room.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-[#161616]/65 sm:text-base">
            A space for drop discussions, style signals, and member fits —
            opening after account access and community safety flows are
            ready.
          </p>
          <ul className="mt-7 flex flex-wrap gap-2">
            {pillars.map((p) => (
              <li
                key={p}
                className="rounded-full border border-[#2E1014]/15 bg-white px-4 py-2 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[#2E1014]"
              >
                {p}
              </li>
            ))}
          </ul>
          <Link
            href="/community"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full border border-[#2E1014]/20 px-7 text-[0.9rem] font-semibold uppercase tracking-[0.075em] text-[#2E1014] transition duration-300 hover:bg-[#2E1014] hover:text-white sm:h-[52px]"
          >
            Preview the Signal Room
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {previewProducts.map((product) => (
            <Link
              key={product.id}
              href={getProductHref(product)}
              className="group relative aspect-square overflow-hidden rounded-[18px] bg-white"
            >
              <SafeImage
                src={product.image}
                fallbackSrc={skxnzFallbackAssets.product}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center transition duration-500 group-hover:scale-105"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SignalRoomTeaser;
