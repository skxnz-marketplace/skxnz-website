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
        "/auth",
        "/cart",
        "/checkout",
        "/forgot-password",
        "/login",
        "/orders",
        "/reset-password",
        "/seller",
        "/signup",
        "/wishlist",
        // Rule-based MVP placeholder tools for sellers, not public content
        // ("No real AI service is connected" — see PageIntro copy on each).
        "/ai/description-generator",
        "/ai/title-generator",
        "/ai/video-prompt-generator",
      ],
    },
    // Must be absolute — crawlers ignore a relative Sitemap directive.
    sitemap: new URL("/sitemap.xml", getSiteBaseUrl()).toString(),
  };
}
