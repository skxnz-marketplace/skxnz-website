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

const SLIDE_BG_GRADIENTS = [
  "from-[#0a0a0c] via-[#111116] to-[#1a1a22]",
  "from-[#0c0a0e] via-[#130f18] to-[#1e1528]",
  "from-[#0a0c0c] via-[#0f1514] to-[#182020]",
  "from-[#0c0a0a] via-[#160e0e] to-[#221414]",
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % heroSlides.length), 4500);
    return () => clearInterval(id);
  }, []);

  const slide = heroSlides[active];

  return (
    <section
      aria-label="Hero"
      className="relative w-full overflow-hidden bg-[#0E0E10]"
      style={{ minHeight: "clamp(480px, 62vw, 680px)" }}
    >
      {/* Animated background panels */}
      {heroSlides.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 bg-gradient-to-br transition-opacity duration-[900ms] ease-in-out",
            SLIDE_BG_GRADIENTS[i],
            i === active ? "opacity-100" : "opacity-0",
          )}
        />
      ))}

      {/* Grid texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Cyan glow top-right */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-[480px] w-[480px] rounded-full bg-[#00E5FF] opacity-[0.03] blur-3xl" />

      {/* Slide content */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-center px-6 py-16 sm:px-10 lg:px-16"
        style={{ minHeight: "clamp(480px, 62vw, 680px)" }}
      >
        {heroSlides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 flex flex-col justify-center px-6 py-16 transition-all duration-[900ms] sm:px-10 lg:px-16",
              i === active
                ? "translate-y-0 opacity-100"
                : i < active
                ? "-translate-y-4 opacity-0"
                : "translate-y-4 opacity-0",
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
