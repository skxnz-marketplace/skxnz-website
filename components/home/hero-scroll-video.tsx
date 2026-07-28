"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Native dimensions of the supplied clip — never crop/stretch/reframe.
const VIDEO_W = 1456;
const VIDEO_H = 624;
const VIDEO_AR = VIDEO_W / VIDEO_H;
const VIDEO_SRC = "/assets/home/hero-video.mp4";
const LOGO_SRC = "/assets/home/skxnz-logo.jpeg";
const LOGO_AR = 2244 / 701;

// Scroll room (in viewport heights) mapped onto video playback while pinned.
const SCRUB_VH = 320;

// Grok watermark sits bottom-right; box + adjacent sample strip in video-% space.
const WM = { right: 0.012, bottom: 0.05, w: 0.14, h: 0.12 };

function fitRect(vw: number, vh: number) {
  // Largest rect with the video's aspect ratio that fits the viewport.
  let w = vw;
  let h = w / VIDEO_AR;
  if (h > vh) {
    h = vh;
    w = h * VIDEO_AR;
  }
  return { w, h };
}

export function HeroScrollVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const logoCanvasRef = useRef<HTMLCanvasElement>(null);
  const patchRef = useRef<HTMLDivElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [box, setBox] = useState({ w: VIDEO_W, h: VIDEO_H });
  const [reduced, setReduced] = useState(false);

  // ---- responsive video rect (keeps original AR, never crops) ----
  useEffect(() => {
    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setBox(fitRect(vw, vh));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // ---- reduced-motion ----
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // ---- build transparent logo once (canvas alpha-key; RGB untouched) ----
  useEffect(() => {
    const canvas = logoCanvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = LOGO_SRC;
    img.onload = () => {
      const src = document.createElement("canvas");
      src.width = img.naturalWidth;
      src.height = img.naturalHeight;
      const sctx = src.getContext("2d", { willReadFrequently: true });
      if (!sctx) return;
      sctx.drawImage(img, 0, 0);
      const data = sctx.getImageData(0, 0, src.width, src.height);
      const p = data.data;
      // Alpha from luminance: dark carbon bg -> transparent, bright chrome kept.
      // smoothstep(lo,hi) feathers anti-aliased edges so nothing looks cut out.
      const lo = 34;
      const hi = 96;
      for (let i = 0; i < p.length; i += 4) {
        const lum = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
        let a = (lum - lo) / (hi - lo);
        a = a < 0 ? 0 : a > 1 ? 1 : a * a * (3 - 2 * a);
        p[i + 3] = Math.round(a * 255);
      }
      sctx.putImageData(data, 0, 0);
      // Draw keyed logo into the visible DPR-aware canvas.
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const cssW = canvas.clientWidth || 1;
      const cssH = cssW / LOGO_AR;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, canvas.width, canvas.height);
    };
  }, [box.w]);

  // ---- watermark: fill a feathered patch with a runtime-sampled adjacent color ----
  const sampleWatermarkColor = useCallback(() => {
    const video = videoRef.current;
    const patch = patchRef.current;
    if (!video || !patch || video.readyState < 2) return;
    let sc = sampleCanvasRef.current;
    if (!sc) {
      sc = document.createElement("canvas");
      sc.width = 24;
      sc.height = 24;
      sampleCanvasRef.current = sc;
    }
    const ctx = sc.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    // Sample the strip immediately LEFT of the watermark (same studio bg).
    const sx = (1 - WM.right - WM.w * 1.9) * VIDEO_W;
    const sy = (1 - WM.bottom - WM.h) * VIDEO_H;
    const sw = WM.w * 0.8 * VIDEO_W;
    const sh = WM.h * VIDEO_H;
    try {
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 24, 24);
      const d = ctx.getImageData(0, 0, 24, 24).data;
      let r = 0;
      let g = 0;
      let b = 0;
      const n = d.length / 4;
      for (let i = 0; i < d.length; i += 4) {
        r += d[i];
        g += d[i + 1];
        b += d[i + 2];
      }
      patch.style.backgroundColor = `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
    } catch {
      /* frame not ready — keep last colour */
    }
  }, []);

  // ---- scroll-scrub engine ----
  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    let duration = 0;
    let raf = 0;
    let current = 0;
    let target = 0;
    let inView = false;
    let lastSample = 0;

    const onMeta = () => {
      duration = video.duration || 10;
      video.pause();
      video.currentTime = 0;
      sampleWatermarkColor();
    };
    video.addEventListener("loadedmetadata", onMeta);
    if (video.readyState >= 1) onMeta();

    const computeTarget = () => {
      // Viewport-relative — works whether the page or an inner element scrolls.
      const rect = section.getBoundingClientRect();
      const scrollable = section.offsetHeight - window.innerHeight;
      const passed = -rect.top;
      const p = scrollable > 0 ? Math.min(1, Math.max(0, passed / scrollable)) : 0;
      target = p * duration;
    };

    const tick = () => {
      if (reduced) return;
      // Recompute every frame from geometry — no dependence on a specific
      // scroll target, so a nested scroll container drives it just as well.
      computeTarget();
      // Ease currentTime toward the scroll-derived target for buttery scrub.
      const diff = target - current;
      if (Math.abs(diff) > 0.003) {
        current += diff * 0.18;
        if (duration) {
          try {
            video.currentTime = current;
          } catch {
            /* seeking */
          }
        }
      }
      const now = performance.now();
      if (now - lastSample > 180) {
        sampleWatermarkColor();
        lastSample = now;
      }
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (inView) computeTarget();
    };

    // Only scrub while the hero is actually on screen (gate + CPU saver).
    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        if (inView) {
          computeTarget();
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 },
    );
    io.observe(section);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduced, sampleWatermarkColor]);

  const stageStyle = { width: box.w, height: box.h } as const;

  // Reduced motion: static first frame, normal-height section, no pin.
  if (reduced) {
    return (
      <section aria-label="Hero" className="flex w-full justify-center bg-black">
        <div className="relative" style={stageStyle}>
          <HeroMedia
            videoRef={videoRef}
            logoCanvasRef={logoCanvasRef}
            patchRef={patchRef}
            box={box}
          />
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} aria-label="Hero" style={{ height: `${SCRUB_VH}vh` }} className="relative w-full">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden bg-black">
        <div ref={stageRef} className="relative" style={stageStyle}>
          <HeroMedia
            videoRef={videoRef}
            logoCanvasRef={logoCanvasRef}
            patchRef={patchRef}
            box={box}
          />
        </div>
      </div>
    </section>
  );
}

function HeroMedia({
  videoRef,
  logoCanvasRef,
  patchRef,
  box,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  logoCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  patchRef: React.RefObject<HTMLDivElement | null>;
  box: { w: number; h: number };
}) {
  // Box AR === video AR, so object-cover fills exactly with zero crop.
  return (
    <>
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Watermark cover — feathered so there is no visible rectangle. */}
      <div
        ref={patchRef}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          right: `${WM.right * 100}%`,
          bottom: `${WM.bottom * 100}%`,
          width: `${WM.w * 100}%`,
          height: `${WM.h * 100}%`,
          backgroundColor: "#f4f4f2",
          WebkitMaskImage:
            "radial-gradient(120% 120% at 70% 60%, #000 42%, transparent 78%)",
          maskImage:
            "radial-gradient(120% 120% at 70% 60%, #000 42%, transparent 78%)",
        }}
      />

      {/* Bottom scrim for logo/tagline legibility. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
      />

      {/* Supplied logo (alpha-keyed on canvas) + tagline, centered near bottom. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[8%] flex flex-col items-center gap-3">
        <canvas
          ref={logoCanvasRef}
          aria-label="SKXNZ"
          role="img"
          className="block"
          style={{ width: Math.min(box.w * 0.44, 520), height: "auto", aspectRatio: `${2244}/${701}` }}
        />
        <p className="text-[0.6rem] font-light uppercase tracking-[0.42em] text-white/85 sm:text-[0.72rem]">
          Wear the Signal.
        </p>
      </div>
    </>
  );
}

export default HeroScrollVideo;
