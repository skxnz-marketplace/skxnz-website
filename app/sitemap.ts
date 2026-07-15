import type { MetadataRoute } from "next";

const publicPaths = [
  "/",
  "/about",
  "/authenticity",
  "/brands",
  "/cart",
  "/community",
  "/community-guidelines",
  "/contact",
  "/faq",
  "/privacy",
  "/returns",
  "/search",
  "/sell",
  "/seller-terms",
  "/shipping",
  "/shop",
  "/support",
  "/terms",
  "/waitlist",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://skxnz.com";
  const lastModified = new Date();

  return publicPaths.map((path) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified,
  }));
}
