import type { MetadataRoute } from "next";

import { getSiteBaseUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/admin",
        "/api",
        "/checkout",
        "/orders",
        "/seller",
        "/wishlist",
      ],
    },
    // Must be absolute — crawlers ignore a relative Sitemap directive.
    sitemap: new URL("/sitemap.xml", getSiteBaseUrl()).toString(),
  };
}
