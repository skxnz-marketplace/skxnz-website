"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC = "/assets/home/hero-video.mp4";
const LOGO_SRC = "/assets/home/skxnz-logo.jpeg";
const SCRUB_VH = 170;
const PATCH = { right: "1.2%", bottom: "5%", width: "14%", height: "12%" };

export function HeroScrollVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!section || !stage || !video) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let duration = 0, target = 0, rendered = 0, seeking = false, visible = false, raf = 0;
    const progress = () => {
      const rect = section.getBoundingClientRect();
      const distance = section.offsetHeight - window.innerHeight;
      return distance > 0 ? Math.max(0, Math.min(1, -rect.top / distance)) : 0;
    };
    const seek = () => {
      raf = 0;
      if (!visible || motion.matches || !duration || seeking) return;
      const delta = target - rendered;
      if (Math.abs(delta) < 0.012) return;
      rendered += delta * 0.34;
      seeking = true;
      video.currentTime = Math.max(0, Math.min(duration, rendered));
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(seek); };
    const update = () => { target = progress() * duration; schedule(); };
    const metadata = () => { duration = Number.isFinite(video.duration) ? video.duration : 0; rendered = 0; target = 0; video.currentTime = 0; };
    const completeSeek = () => { seeking = false; rendered = video.currentTime; if (Math.abs(target - rendered) >= 0.012) schedule(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.intersectionRatio >= 0.999; if (visible) update(); }, { threshold: [0, 1] });
    observer.observe(stage);
    video.addEventListener("loadedmetadata", metadata);
    video.addEventListener("seeked", completeSeek);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    if (video.readyState >= 1) metadata();
    return () => { cancelAnimationFrame(raf); observer.disconnect(); video.removeEventListener("loadedmetadata", metadata); video.removeEventListener("seeked", completeSeek); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);

  return <section ref={sectionRef} aria-label="SKXNZ hero" className="relative w-full" style={{ height: `${SCRUB_VH}vh` }}>
    <div className="sticky top-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black">
      <div ref={stageRef} className="relative aspect-[1456/624] w-[min(100vw,233.333dvh)] max-w-full">
        <video ref={videoRef} src={VIDEO_SRC} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain" />
        <div aria-hidden className="pointer-events-none absolute" style={{ ...PATCH, background: "#f4f4f2", WebkitMaskImage: "radial-gradient(115% 115% at 72% 62%,#000 47%,transparent 78%)", maskImage: "radial-gradient(115% 115% at 72% 62%,#000 47%,transparent 78%)" }} />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-[8%] flex flex-col items-center gap-3">
          <img src={LOGO_SRC} alt="SKXNZ" className="h-auto w-[min(44%,520px)]" />
          <p className="text-[0.6rem] font-light uppercase tracking-[0.42em] text-white/85 sm:text-[0.72rem]">Wear the Signal.</p>
        </div>
      </div>
    </div>
  </section>;
}
