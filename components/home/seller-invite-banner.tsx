import Image from "next/image";
import Link from "next/link";

/** Real acquisition surface — links to /sell (seller application). */
export function SellerInviteBanner() {
  return (
    <section aria-label="Sell on SKXNZ" className="bg-[#F4F1EC] py-16 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <div className="relative overflow-hidden rounded-[32px] bg-[#161616]">
          <div className="absolute inset-0">
            <Image
              src="/assets/home/shop-men.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[70%_20%] opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#161616] via-[#161616]/85 to-[#161616]/30" />
          </div>

          <div className="relative flex flex-col gap-6 px-6 py-14 sm:px-10 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-16 lg:py-20">
            <div className="max-w-xl">
              <p className="text-[0.78rem] font-bold uppercase tracking-[0.24em] text-[#00E5FF]">
                For Labels &amp; Independent Sellers
              </p>
              <h2 className="mt-4 font-grotesk text-[clamp(1.8rem,3.6vw,2.7rem)] font-bold uppercase leading-[0.98] tracking-[-0.02em] text-white">
                Bring your label to SKXNZ.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/60 sm:text-base">
                Curated placement, catalogue tools, and a buyer base already
                looking for what you make.
              </p>
            </div>
            <Link
              href="/sell"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-white px-7 text-[0.9rem] font-semibold uppercase tracking-[0.075em] text-[#161616] transition duration-300 hover:bg-white/85 sm:h-[52px]"
            >
              Apply to sell
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SellerInviteBanner;
