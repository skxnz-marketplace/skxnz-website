"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SafeImage } from "@/components/shared/safe-image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  immersiveHeroContentPaddingClass,
  immersiveHeroContentWidthClass,
  immersiveHeroHeightClass,
} from "@/src/lib/hero-layout";
import { ensureHeroAsset, skxnzFallbackAssets } from "@/src/lib/assets";
import { carouselSlides } from "@/src/data/carousels";
import { homepageHeroes } from "@/src/data/homepageHeroes";

const slideImageClassMap: Record<string, string> = {
  "car-001": "object-[78%_24%] scale-[1.12] sm:object-[70%_26%]",
  "car-002": "object-[76%_18%] scale-[1.08] sm:object-[72%_16%]",
  "car-003": "object-[78%_48%] scale-[1.12] sm:object-[70%_50%]",
  "car-004": "object-[78%_48%] scale-[1.12] sm:object-[70%_50%]",
};

const heroDrivenSlides = homepageHeroes.map((hero, index) => ({
  id: hero.id,
  title: hero.title,
  subtitle: hero.subtitle,
  ctaLabel: hero.buttonText,
  href: hero.buttonLink,
  imageSrc: hero.image,
  imageClassName:
    slideImageClassMap[`car-00${index + 1}`] ??
    "object-center scale-[1.04] sm:object-center",
}));

const carouselDrivenSlides = carouselSlides
  .filter((slide) => slide.status !== "Archived")
  .map((slide) => ({
    id: slide.id,
    title: slide.title,
    subtitle: slide.subtitle,
    ctaLabel: slide.buttonText,
    href: slide.buttonLink,
    imageSrc: slide.image,
    imageClassName:
      slideImageClassMap[slide.id] ??
      "object-center scale-[1.04] sm:object-center",
  }));

const slides = [...heroDrivenSlides, ...carouselDrivenSlides]
  .filter(
    (slide, index, collection) =>
      collection.findIndex((entry) => entry.title === slide.title) === index,
  )
  .slice(0, 4);

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d={direction === "left" ? "m14.5 5.5-6 6 6 6" : "m9.5 5.5 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomeHeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goToSlide = (nextIndex: number) => {
    setActiveSlide((nextIndex + slides.length) % slides.length);
  };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!isPaused) {
        setActiveSlide((currentSlide) => (currentSlide + 1) % slides.length);
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [isPaused]);

  return (
    <section
      className="relative w-full overflow-hidden border-b border-sandstone/80 bg-pearlcream"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const startX = touchStartX.current;
        const endX = event.changedTouches[0]?.clientX ?? null;

        if (startX === null || endX === null) {
          return;
        }

        const delta = startX - endX;
        if (Math.abs(delta) < 36) {
          return;
        }

        goToSlide(activeSlide + (delta > 0 ? 1 : -1));
      }}
    >
      <div
        className={cn("flex transition-transform duration-700 ease-out", immersiveHeroHeightClass)}
        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.title}
            className="relative min-w-full overflow-hidden bg-[linear-gradient(135deg,#F8EFE1_0%,#FFF8EA_54%,#FFF9F0_100%)]"
          >
            <SafeImage
              src={ensureHeroAsset(slide.imageSrc)}
              fallbackSrc={skxnzFallbackAssets.hero}
              alt={slide.title}
              fill
              priority={slide.id === slides[0]?.id}
              sizes="100vw"
              className={cn(
                "object-cover transition-transform duration-700",
                slide.imageClassName,
              )}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,245,238,0.1),transparent_24%,rgba(251,245,238,0.04)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(35,31,27,0.84)_0%,rgba(90,31,46,0.74)_24%,rgba(35,31,27,0.4)_50%,rgba(35,31,27,0.14)_72%,rgba(35,31,27,0.08)_100%)]" />
            <div
              className={cn(
                "relative z-10 flex h-full flex-col justify-end gap-4",
                immersiveHeroContentWidthClass,
                immersiveHeroContentPaddingClass,
              )}
            >
              <div className="space-y-2 sm:space-y-3">
                <h1 className="line-clamp-3 min-w-0 break-words font-display text-[2.15rem] uppercase leading-[0.88] tracking-[0.09em] text-pearlcream sm:line-clamp-none sm:text-[3.2rem] md:text-[3.75rem] lg:text-[4.35rem]">
                  {slide.title}
                </h1>
                <p className="line-clamp-2 max-w-[18rem] text-[0.82rem] text-pearlcream/84 sm:max-w-[22rem] sm:text-[0.98rem] md:text-base">
                  {slide.subtitle}
                </p>
              </div>
              <div>
                <Link
                  href={slide.href}
                  className={buttonVariants({
                    variant: "primary",
                    size: "lg",
                    className: "min-w-[8.5rem] sm:min-w-[9rem]",
                  })}
                >
                  {slide.ctaLabel}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 sm:bottom-5">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => goToSlide(index)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === activeSlide
                ? "w-6 bg-teal"
                : "w-1.5 bg-sandstone/80 hover:bg-bronze/70",
            )}
          />
        ))}
      </div>

      <div className="absolute inset-y-0 left-0 hidden items-center pl-4 xl:flex">
        <button
          type="button"
          onClick={() => goToSlide(activeSlide - 1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sandstone/85 bg-pearlcream/88 text-sangria transition hover:border-teal/45 hover:bg-white"
          aria-label="Previous slide"
        >
          <Chevron direction="left" />
        </button>
      </div>

      <div className="absolute inset-y-0 right-0 hidden items-center pr-4 xl:flex">
        <button
          type="button"
          onClick={() => goToSlide(activeSlide + 1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sandstone/85 bg-pearlcream/88 text-sangria transition hover:border-teal/45 hover:bg-white"
          aria-label="Next slide"
        >
          <Chevron direction="right" />
        </button>
      </div>
    </section>
  );
}
