"use client";

import { useEffect, useRef, useState } from "react";

// Native dimensions of the supplied clip — never crop/stretch/reframe.
const VIDEO_W = 1456;
const VIDEO_H = 624;
const VIDEO_AR = VIDEO_W / VIDEO_H;

// Scrub-optimised master, built from the supplied clip with ffmpeg:
//   * motion-interpolated 24fps -> 72fps (minterpolate mci — real reconstructed
//     frames, not crossfades), because at 24fps a slow scroll steps visibly;
//   * every frame forced to a keyframe (-g 1). The original carried a SINGLE
//     keyframe for the whole clip, so every scrub position had to decode from
//     frame 0 and playback read as a slideshow;
//   * watermark removed at source (delogo), so nothing has to be painted over
//     it at runtime.
const VIDEO_SRC = "/assets/home/hero-film.mp4";
const POSTER_SRC = "/assets/home/hero-film-poster.jpg";
const LOGO_SRC = "/assets/home/skxnz-logo.jpeg";
const LOGO_AR = 2244 / 701;

// Scroll room (in viewport heights) mapped onto video playback. This sets what
// the clip costs to scroll past: at 420vh it burned through in ~33 wheel ticks
// (~22 of the 718 frames per tick, which read as jumping rather than motion),
// while 1200vh was smooth but ~78 ticks — too long to sit through. 800vh lands
// near ~52 ticks at ~14 frames each, which playback-driven scrubbing carries
// smoothly because it plays through them rather than seeking to each one.
const SCRUB_VH = 800;

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const logoCanvasRef = useRef<HTMLCanvasElement>(null);

  const [box, setBox] = useState({ w: VIDEO_W, h: VIDEO_H });
  const [reduced, setReduced] = useState(false);

  // ---- responsive video rect (keeps original AR, never crops) ----
  useEffect(() => {
    const measure = () => {
      setBox(fitRect(window.innerWidth, window.innerHeight));
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

  // ---- scrub engine: smoothed playhead, driven by PLAYBACK not seeking ----
  //
  // Seeking is what made this read as photo frames: each wheel tick jumped the
  // decoder to one discrete frame and held it, so the eye saw stills. While the
  // playhead moves forward we let the video actually play and steer
  // `playbackRate` instead, so the decoder presents frames on its own cadence —
  // which is what watching a video is. Seeking is kept for reverse and for
  // jumps too large for playback to express.
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    // Start fetching the clip once the page itself has finished loading. It is
    // ~15 MB: preloading it eagerly competes with everything above the fold,
    // but waiting until the section is near means arriving before it can
    // decode. The poster covers the gap either way.
    let idle = 0;
    const beginFetch = () => {
      if (video.preload !== "auto") {
        video.preload = "auto";
        video.load();
      }
    };
    const scheduleFetch = () => {
      const ric = (
        window as unknown as {
          requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
        }
      ).requestIdleCallback;
      idle = ric ? ric(beginFetch, { timeout: 2000 }) : window.setTimeout(beginFetch, 400);
    };
    if (document.readyState === "complete") scheduleFetch();
    else window.addEventListener("load", scheduleFetch, { once: true });

    // Backstop: approaching the section forces the fetch regardless.
    const preloader = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        beginFetch();
        preloader.disconnect();
      },
      { rootMargin: "300% 0px" },
    );
    preloader.observe(section);

    if (reduced) {
      // Static poster frame; no scrubbing, no playback.
      video.pause();
      return () => {
        preloader.disconnect();
        window.removeEventListener("load", scheduleFetch);
        window.clearTimeout(idle);
      };
    }

    let raf = 0;
    let inView = false;
    let last = performance.now();

    // Seconds for the playhead to converge on the scroll position. A spring was
    // tried first and always trailed a moving target by velocity*damping/
    // stiffness — ~360 ms behind the wheel, which is what "laggy" felt like, and
    // stiffening barely moved it. SmoothDamp is critically damped and tracks a
    // *moving* target, so the trail is just this constant (~110 ms) while still
    // carrying ~55 frames of glide after the wheel stops. Simulated across
    // 0.08-0.35s; 0.12 was the knee between responsiveness and that glide.
    const SMOOTH_TIME = 0.12;

    let head = 0; // playhead position, seconds
    let vel = 0; // playhead velocity, video-seconds per real-second

    const progress = () => {
      const rect = section.getBoundingClientRect();
      const travel = section.offsetHeight - window.innerHeight;
      if (travel <= 0) return 0;
      // Measured live from layout every frame, so there are no cached offsets
      // to go stale when images above finish loading and move this section.
      return Math.min(1, Math.max(0, -rect.top / travel));
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);

      const duration = video.duration;
      if (!duration || !isFinite(duration) || video.readyState < 2) {
        last = now;
        return;
      }

      // Clamp dt so a background tab or a long frame cannot fling the playhead.
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;

      const target = progress() * duration;

      // Critically-damped SmoothDamp (Game Programming Gems formulation).
      // `vel` carries across frames, which is what produces the glide.
      const omega = 2 / SMOOTH_TIME;
      const x = omega * dt;
      const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
      const change = head - target;
      const temp = (vel + omega * change) * dt;
      vel = (vel - omega * temp) * decay;
      head = target + (change + temp) * decay;

      if (head < 0) {
        head = 0;
        vel = 0;
      } else if (head > duration) {
        head = duration;
        vel = 0;
      }

      const drift = head - video.currentTime;
      const moving = vel > 0.08;
      const nearby = Math.abs(drift) < 0.75;
      // Decoder has run past the playhead; playing faster cannot fix that
      // (the rate floor keeps it moving forward), so hand back to seeking.
      const overshot = drift < -0.04;

      if (moving && nearby && !overshot && video.readyState >= 3) {
        // Rate both matches the playhead's speed and closes residual drift.
        // Clamped to the range browsers honour — outside it Chrome silently
        // falls back to 1.0.
        const rate = Math.min(8, Math.max(0.12, vel + drift * 1.6));
        if (Math.abs(video.playbackRate - rate) > 0.02) video.playbackRate = rate;
        if (video.paused) void video.play().catch(() => {});
      } else {
        if (!video.paused) video.pause();
        if (Math.abs(drift) > 1 / 200) {
          try {
            video.currentTime = head;
          } catch {
            /* decoder busy — next frame retries */
          }
        }
      }
    };

    const start = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (!video.paused) video.pause();
    };

    // Off-screen the film costs nothing at all.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting === inView) return;
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(section);

    return () => {
      io.disconnect();
      preloader.disconnect();
      window.removeEventListener("load", scheduleFetch);
      window.clearTimeout(idle);
      stop();
    };
  }, [reduced]);

  const stageStyle = { width: box.w, height: box.h } as const;

  // Reduced motion: static poster, normal-height section, no pin.
  if (reduced) {
    return (
      <section aria-label="SKXNZ signal film" className="flex w-full justify-center bg-[#F4F1EC]">
        <div className="relative" style={stageStyle}>
          <HeroMedia videoRef={videoRef} logoCanvasRef={logoCanvasRef} box={box} />
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-label="SKXNZ signal film"
      style={{ height: `${SCRUB_VH}vh` }}
      className="relative w-full"
    >
      {/* Letterbox fill: the stage keeps the clip's aspect ratio, so the bands
          above and below it show this background. Site cream, not black — the
          clip is shot on a near-white studio backdrop, so cream reads as part
          of the page instead of two hard black bars. */}
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden bg-[#F4F1EC]">
        <div className="relative" style={stageStyle}>
          <HeroMedia videoRef={videoRef} logoCanvasRef={logoCanvasRef} box={box} />
        </div>
      </div>
    </section>
  );
}

function HeroMedia({
  videoRef,
  logoCanvasRef,
  box,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  logoCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  box: { w: number; h: number };
}) {
  // The stage box carries the video's own aspect ratio, so object-contain fills
  // it edge-to-edge with zero crop. object-contain (not -cover) is deliberate:
  // when the box AR matches the clip they render identically, but on any
  // sub-pixel rounding or a transient resize, contain shows a hairline of the
  // cream stage behind rather than cropping the frame — and "no crop" is a hard
  // requirement for this clip.
  return (
    <>
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        poster={POSTER_SRC}
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-contain"
      />

      {/* Bottom scrim. Fades to the page cream rather than to black: the
          letterbox band below is cream, so a black scrim left a hard line
          across the bottom edge of the frame. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-[#F4F1EC] via-[#F4F1EC]/25 to-transparent"
      />

      {/* Supplied logo (alpha-keyed on canvas) + tagline, centered near bottom. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[8%] flex flex-col items-center gap-3">
        <canvas
          ref={logoCanvasRef}
          aria-label="SKXNZ"
          role="img"
          className="block"
          style={{
            width: Math.min(box.w * 0.44, 520),
            height: "auto",
            aspectRatio: `${2244}/${701}`,
          }}
        />
        {/* Ink, not white: the scrim behind it now fades to cream. */}
        <p className="text-[0.6rem] font-light uppercase tracking-[0.42em] text-[#161616]/75 sm:text-[0.72rem]">
          Wear the Signal.
        </p>
      </div>
    </>
  );
}

export default HeroScrollVideo;
