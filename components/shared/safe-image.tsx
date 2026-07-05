"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

type SafeImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackSrc: string;
};

/** Root-relative local path — always safe for next/image. */
function isLocalPath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

/**
 * Parseable http(s) URL. Rendered with `unoptimized` because next.config has
 * no images.remotePatterns, and the optimizing loader throws on any remote
 * hostname (e.g. seller-submitted URLs or seed values like
 * "placeholder://gradient" would crash the whole page).
 */
function isRemoteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function classify(value: string | null | undefined): "local" | "remote" | "invalid" {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return "invalid";
  if (isLocalPath(trimmed)) return "local";
  if (isRemoteHttpUrl(trimmed)) return "remote";
  return "invalid";
}

/** Last-resort placeholder when even the fallback asset cannot render. */
function PlaceholderBlock({
  alt,
  className,
  fill,
}: {
  alt: string;
  className?: string;
  fill?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={className}
      style={{
        ...(fill
          ? { position: "absolute", inset: 0 }
          : { width: "100%", height: "100%" }),
        background:
          "linear-gradient(135deg, #0b0910 0%, #2a0613 45%, #3a0818 100%)",
      }}
    />
  );
}

/**
 * Never lets an invalid/unknown src crash next/image.
 * - local "/..." paths: optimized next/image
 * - valid http(s) URLs: next/image with unoptimized (no remote config needed)
 * - anything else (null, "", "placeholder://gradient", junk): local fallback
 * - if the fallback itself is unusable or also fails: styled placeholder div
 */
export function SafeImage({ src, fallbackSrc, alt, ...props }: SafeImageProps) {
  const [stage, setStage] = useState<"primary" | "fallback" | "dead">("primary");

  useEffect(() => {
    setStage("primary");
  }, [src, fallbackSrc]);

  const primaryKind = classify(src);
  const fallbackKind = classify(fallbackSrc);

  let activeSrc: string | null = null;
  let activeKind: "local" | "remote" = "local";

  if (stage === "primary" && primaryKind !== "invalid") {
    activeSrc = (src as string).trim();
    activeKind = primaryKind;
  } else if (stage !== "dead" && fallbackKind !== "invalid") {
    activeSrc = fallbackSrc.trim();
    activeKind = fallbackKind;
  }

  if (!activeSrc) {
    return (
      <PlaceholderBlock
        alt={typeof alt === "string" ? alt : "Image unavailable"}
        className={props.className}
        fill={props.fill}
      />
    );
  }

  return (
    <Image
      {...props}
      src={activeSrc}
      alt={alt}
      unoptimized={activeKind === "remote" ? true : props.unoptimized}
      onError={() => {
        setStage((current) => (current === "primary" ? "fallback" : "dead"));
      }}
    />
  );
}
