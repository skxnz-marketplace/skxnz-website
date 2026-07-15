import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SKXNZ",
    short_name: "SKXNZ",
    description: "Private-preview futurewear discovery by SKXNZ.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFEFA",
    theme_color: "#3A0818",
    icons: [
      {
        src: "/assets/brand/marks/skxnz-mark-transparent.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
