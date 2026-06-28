"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/cn";

const introStorageKey = "skxnz_intro_seen";

function markIntroSeen() {
  try {
    window.sessionStorage.setItem(introStorageKey, "true");
    document.body.dataset.skxnzIntroSeen = "true";
  } catch {
    // Session storage can be unavailable in strict browser modes.
  }
}

function hasSeenIntro() {
  try {
    return window.sessionStorage.getItem(introStorageKey) === "true";
  } catch {
    return false;
  }
}

export function SiteOpeningLoader() {
  const [shouldRender, setShouldRender] = useState(true);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    if (hasSeenIntro()) {
      setShouldRender(false);
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hideDelay = prefersReducedMotion ? 350 : 1200;
    const removeDelay = prefersReducedMotion ? 700 : 1500;

    const hideTimer = window.setTimeout(() => {
      markIntroSeen();
      setIsHiding(true);
    }, hideDelay);

    const removeTimer = window.setTimeout(() => {
      setShouldRender(false);
    }, removeDelay);

    const fallbackTimer = window.setTimeout(() => {
      markIntroSeen();
      setShouldRender(false);
    }, 2500);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-skxnz-opening-loader
      className={cn(
        "pointer-events-none fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#100006_0%,#1A030B_46%,#3A0818_100%)] px-6 text-[#FFFEFA] transition-opacity duration-300 ease-out motion-safe:animate-[skxnz-opening-loader-fallback_1.5s_ease_forwards] motion-reduce:animate-[skxnz-opening-loader-fallback-reduced_700ms_ease_forwards]",
        isHiding ? "opacity-0" : "opacity-100",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(255,254,250,0.11),transparent_28%),radial-gradient(circle_at_54%_58%,rgba(255,255,255,0.055),transparent_34%)]" />
      <div className="absolute left-1/2 top-1/2 h-px w-[min(22rem,70vw)] -translate-x-1/2 -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,254,250,0.24),transparent)] opacity-70" />

      <div className="relative flex flex-col items-center motion-safe:animate-[skxnz-opening-logo_520ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none">
        <Image
          src={siteConfig.brandAssets.wordmark}
          alt=""
          width={2172}
          height={724}
          priority
          className="h-auto w-[150px] object-contain drop-shadow-[0_18px_36px_rgba(255,254,250,0.13)] sm:w-[200px] lg:w-[224px]"
          sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 224px"
        />
        <p className="mt-5 text-center text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#FFFEFA]/70 sm:text-[0.68rem]">
          {siteConfig.tagline}
        </p>
      </div>
    </div>
  );
}
