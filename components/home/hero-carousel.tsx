"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { heroSlides } from "@/lib/home-data";

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="m14.5 5.5-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="m9.5 5.5 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M7 12h10m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Hero backdrop, shared by every slide.
 * The shared photo lives at `public/assets/home/hero-signal.png` and takes over
 * automatically — CSS paints the first layer that resolves, so while that file is
 * absent the vector stand-in below shows instead. No code change needed to swap.
 */
const HERO_BACKDROP =
  "url('/assets/home/hero-signal.png'), url('/assets/home/hero-signal-blur.svg')";

export function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    // Users who ask for reduced motion get a static hero; arrows and dots still work.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => setActive((i) => (i + 1) % heroSlides.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      aria-label="Hero"
      className="relative w-full overflow-hidden bg-[#0E0E10]"
      style={{ minHeight: "clamp(480px, 62vw, 680px)" }}
    >
      {/* Backdrop image — shared by every slide */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: HERO_BACKDROP }}
      />

      {/* Readability scrim — keeps headline/CTA contrast above 4.5:1 over the image */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#05101a]/92 via-[#05101a]/62 to-[#05101a]/15"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#05101a]/85 to-transparent"
      />

      {/* Grid texture overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Slide content */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-center px-6 py-16 sm:px-10 lg:px-16"
        style={{ minHeight: "clamp(480px, 62vw, 680px)" }}
      >
        {heroSlides.map((s, i) => (
          <div
            key={s.id}
            // `invisible` (visibility: hidden) already removes inactive slides from
            // tab order and hit-testing, so no `inert` attribute is needed here.
            aria-hidden={i !== active}
            className={cn(
              "absolute inset-0 flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-16",
              "transition-[opacity,transform,visibility] ease-out motion-reduce:transition-none",
              i === active
                ? "visible translate-y-0 opacity-100 duration-[420ms]"
                : "invisible translate-y-3 opacity-0 duration-[260ms]",
            )}
          >
            <div className="max-w-[600px]">
              <h1
                className="font-grotesk text-[clamp(2.8rem,7vw,5.5rem)] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[#F4F1EC]"
              >
                {s.headline}
              </h1>
              <p className="mt-5 max-w-[480px] text-[clamp(0.9rem,1.4vw,1.1rem)] font-medium leading-relaxed text-[#F4F1EC]/65">
                {s.subline}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={s.primaryHref}
                  className="inline-flex h-12 items-center gap-2.5 rounded-full bg-[#F4F1EC] px-7 text-sm font-bold uppercase tracking-[0.08em] text-[#0E0E10] transition hover:bg-white"
                >
                  {s.primaryCta}
                  <ArrowRight />
                </Link>
                <Link
                  href={s.secondaryHref}
                  className="inline-flex h-12 items-center gap-2.5 rounded-full border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-7 text-sm font-bold uppercase tracking-[0.08em] text-[#00E5FF] transition hover:bg-[#00E5FF]/18"
                >
                  {s.secondaryCta}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Left arrow */}
      <button
        type="button"
        onClick={() => setActive((i) => (i - 1 + heroSlides.length) % heroSlides.length)}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 lg:flex"
      >
        <ChevronLeft />
      </button>

      {/* Right arrow */}
      <button
        type="button"
        onClick={() => setActive((i) => (i + 1) % heroSlides.length)}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 lg:flex"
      >
        <ChevronRight />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {heroSlides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "h-[3px] rounded-full transition-all duration-300",
              i === active
                ? "w-8 bg-[#00E5FF]"
                : "w-3 bg-white/30 hover:bg-white/50",
            )}
          />
        ))}
      </div>
    </section>
  );
}
