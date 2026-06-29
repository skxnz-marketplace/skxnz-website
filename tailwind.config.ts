import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "home-ivory": "#F4F1EC",
        "home-dark": "#0E0E10",
        "home-oxblood": "#2E1014",
        "home-cyan": "#00E5FF",
        "home-text": "#161616",
        warmivory: "#FFFEFA",
        sangria: "#3A0818",
        teal: "#3A0818",
        midnightbrown: "#120B0D",
        sandstone: "#EDE3D5",
        pearlcream: "#FFFEFA",
        bronze: "#4B1022",
        softblack: "#100006",
        wine: "#4B1022",
        skxnzcard: "#FFFDF8",
        stone: "rgba(18, 11, 13, 0.62)",
        creamshadow: "#FFFDF7",
      },
      boxShadow: {
        glow: "0 16px 36px rgba(34, 211, 238, 0.12)",
        panel: "0 16px 34px rgba(58, 8, 24, 0.08), 0 6px 18px rgba(16, 0, 6, 0.06)",
      },
      backgroundImage: {
        "signal-grid":
          "linear-gradient(rgba(58,8,24,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(58,8,24,0.055) 1px, transparent 1px)",
        "signal-radial":
          "radial-gradient(circle at top, rgba(58, 8, 24, 0.08), transparent 28%), radial-gradient(circle at 85% 20%, rgba(34, 211, 238, 0.06), transparent 24%), radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.05), transparent 28%)",
      },
      fontFamily: {
        grotesk: ["var(--font-grotesk)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Times New Roman", "serif"],
        sans: [
          "var(--font-primary)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        accent: [
          "var(--font-accent)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
