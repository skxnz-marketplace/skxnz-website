import type { MetadataRoute } from "next";

import { getSiteBaseUrl } from "@/lib/site";

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
  const baseUrl = getSiteBaseUrl();
  const lastModified = new Date();

  return publicPaths.map((path) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified,
  }));
}
