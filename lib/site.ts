import { skxnzAssetMap } from "@/src/lib/assets";

/** Absolute origin for metadata routes. robots.txt requires an absolute
 * Sitemap URL, and sitemap entries must be absolute too, so both read this. */
export function getSiteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://skxnz.com"
  );
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "SKXNZ",
  tagline: "WEAR THE SIGNAL.",
  brandAssets: {
    mark: skxnzAssetMap.brand.mark,
    wordmark: skxnzAssetMap.brand.wordmark,
  },
  description:
    "AI-powered futurewear marketplace for curated fashion discovery, seller review foundations, and intelligent style experiences.",
  parentCompany: "Vivaan Poddar Companies",
  domain: "skxnz.com",
  launchMode: "Private Beta MVP",
  socialHandle: "@skxnzofficial",
  supportEmail: "support@skxnz.com",
  sellerEmail: "sellers@skxnz.com",
  waitlistUrl: process.env.NEXT_PUBLIC_WAITLIST_URL || "/waitlist",
};
