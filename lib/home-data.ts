// All homepage content lives here. Swap arrays for Supabase queries later.

export type HeroSlide = {
  id: string;
  headline: string;
  subline: string;
  primaryCta: string;
  secondaryCta: string;
  primaryHref: string;
  secondaryHref: string;
};

export type CategoryItem = {
  label: string;
  href: string;
  image: string;
};

export type BrandLabel = {
  name: string;
  monogram: string;
};

export type HomeProduct = {
  id: string;
  brand: string;
  name: string;
  /** price in paise */
  price: number;
  /** original price in paise, shown struck if present */
  oldPrice?: number;
  href: string;
  image: string;
};

export type MosaicTile = {
  label: string;
  href: string;
  cta: string;
  image: string;
  /** Tailwind col/row span classes */
  span: string;
};

export type AiStep = {
  step: string;
  label: string;
};

export type TrustItem = {
  icon: string;
  title: string;
  desc: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Format paise integer as ₹ display string */
export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

// ─── Content ─────────────────────────────────────────────────────────────────

export const heroSlides: HeroSlide[] = [
  {
    id: "signal",
    headline: "WEAR THE SIGNAL.",
    subline: "A curated marketplace for the next generation of futurewear.",
    primaryCta: "Browse the Catalogue",
    secondaryCta: "Preview AI Stylist",
    primaryHref: "/shop",
    secondaryHref: "/ai-stylist",
  },
  {
    id: "drops",
    headline: "SHARP NEW DROPS.",
    subline: "Fresh pieces and sharp signals from curated labels.",
    primaryCta: "Browse the Catalogue",
    secondaryCta: "Preview AI Stylist",
    primaryHref: "/shop",
    secondaryHref: "/ai-stylist",
  },
  {
    id: "luxury",
    headline: "PRECISION LUXURY.",
    subline: "Watches, sneakers, and designer selects — authenticity-first curation.",
    primaryCta: "Browse the Catalogue",
    secondaryCta: "Preview AI Stylist",
    primaryHref: "/shop",
    secondaryHref: "/ai-stylist",
  },
  {
    id: "future",
    headline: "FUTURE READY.",
    subline: "An AI style companion meets a curated marketplace. The next era of fashion.",
    primaryCta: "Browse the Catalogue",
    secondaryCta: "Preview AI Stylist",
    primaryHref: "/shop",
    secondaryHref: "/ai-stylist",
  },
];

export const categoryItems: CategoryItem[] = [
  { label: "Sneakers", href: "/categories/sneakers", image: "" },
  { label: "Jackets", href: "/categories/jackets", image: "" },
  { label: "Watches", href: "/categories/watches", image: "" },
  { label: "Streetwear", href: "/categories/streetwear", image: "" },
  { label: "Bags", href: "/categories/bags", image: "" },
  { label: "Accessories", href: "/categories/accessories", image: "" },
];

// Real curated labels from the local catalogue — never invented brand names.
export const brandLabels: BrandLabel[] = [
  { name: "SKXNZ", monogram: "SX" },
  { name: "ATELIER NOVA", monogram: "AN" },
  { name: "SIGNAL STUDIO", monogram: "SS" },
  { name: "CHROME DISTRICT", monogram: "CD" },
];

// Fabricated homepage product lists were removed in D10-C. Homepage sections
// now render live catalog products or the approved local catalogue mapped in
// app/page.tsx — every card links to a real product-detail page.

export const mosaicTiles: MosaicTile[] = [
  {
    label: "Luxury Sneakers",
    href: "/categories/sneakers",
    cta: "Shop Now",
    image: "",
    span: "col-span-2 row-span-2",
  },
  {
    label: "New Streetwear",
    href: "/categories/streetwear",
    cta: "Explore",
    image: "",
    span: "",
  },
  {
    label: "Timepieces",
    href: "/categories/watches",
    cta: "Shop Now",
    image: "",
    span: "",
  },
  {
    label: "Carry Goods",
    href: "/categories/bags",
    cta: "Explore",
    image: "",
    span: "col-span-2",
  },
  {
    label: "Everyday Essentials",
    href: "/categories/accessories",
    cta: "Shop Now",
    image: "",
    span: "",
  },
  {
    label: "Designer Selects",
    href: "/shop",
    cta: "Explore",
    image: "",
    span: "",
  },
];

export const aiSteps: AiStep[] = [
  { step: "01", label: "Set Your Budget" },
  { step: "02", label: "Choose Occasion" },
  { step: "03", label: "Pick Your Style" },
];

export const trustItems: TrustItem[] = [
  {
    icon: "✓",
    title: "Curated Labels",
    desc: "Hand-Picked",
  },
  {
    icon: "🔒",
    title: "Encrypted Checkout",
    desc: "Coming Soon",
  },
  {
    icon: "↩",
    title: "Simple Returns",
    desc: "In Development",
  },
  {
    icon: "⚡",
    title: "Nationwide Shipping",
    desc: "Rolling Out",
  },
  {
    icon: "✦",
    title: "AI Styling",
    desc: "In Development",
  },
];
