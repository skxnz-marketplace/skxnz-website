import { skxnzAssetMap } from "@/src/lib/assets";

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
  sellerApplicationUrl:
    process.env.NEXT_PUBLIC_SELLER_APPLICATION_URL || "/sell",
};
