import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Old route aliases collapsed into their canonical /ai/* paths — permanent
  // redirects so bookmarks/inbound links keep working and search engines
  // consolidate signals onto one URL instead of indexing duplicate content.
  async redirects() {
    return [
      { source: "/ai-stylist", destination: "/ai/stylist", permanent: true },
      {
        source: "/ai-tools/product-description",
        destination: "/ai/description-generator",
        permanent: true,
      },
      {
        source: "/ai-tools/product-title",
        destination: "/ai/title-generator",
        permanent: true,
      },
      {
        source: "/ai-tools/product-video-prompt",
        destination: "/ai/video-prompt-generator",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
