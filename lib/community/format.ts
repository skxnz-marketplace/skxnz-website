// Pure display-formatting helpers for the community feed. No Supabase, no
// "use server" — safe to import from both server and client code.

import type { Product } from "@/lib/data/products";

/** "Ava Fernandes" -> "AF". Falls back to the site's own initials when a
 * name is empty (never renders blank). */
export function avatarInitialsFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "SK";

  const initials = trimmed
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "SK";
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["week", 1000 * 60 * 60 * 24 * 7],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
];

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "2026-09-21T10:00:00Z" -> "3 hours ago". Falls back to "Just now" for
 * anything under a minute. */
export function relativeTimeLabel(isoTimestamp: string): string {
  const then = new Date(isoTimestamp).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = then - Date.now();

  for (const [unit, unitMs] of RELATIVE_UNITS) {
    if (Math.abs(diffMs) >= unitMs) {
      return relativeTimeFormatter.format(Math.round(diffMs / unitMs), unit);
    }
  }

  return "Just now";
}

/** Live-catalog counterpart of lib/data/community.ts's getCommunityTaggedProducts.
 * Pure lookup, safe for client components (unlike lib/community/read-community.ts,
 * which imports the server-only Supabase client). */
export function pickTaggedProducts(products: Product[], productIds: string[]): Product[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  return productIds
    .map((id) => byId.get(id))
    .filter((product): product is Product => Boolean(product));
}
