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

export const brandLabels: BrandLabel[] = [
  { name: "VANTA", monogram: "V" },
  { name: "AXIS", monogram: "AX" },
  { name: "SIGNAL", monogram: "SG" },
  { name: "MERIDIAN", monogram: "MD" },
  { name: "HALO", monogram: "HL" },
  { name: "KORE", monogram: "KR" },
  { name: "FLUX", monogram: "FX" },
  { name: "NOIR", monogram: "NR" },
  { name: "MONOLITH", monogram: "MN" },
  { name: "APEX", monogram: "AP" },
  { name: "PULSE", monogram: "PL" },
];

export const trendingProducts: HomeProduct[] = [
  {
    id: "t1",
    brand: "VANTA",
    name: "Obsidian Utility Jacket",
    price: 749900,
    href: "/shop",
    image: "",
  },
  {
    id: "t2",
    brand: "AXIS",
    name: "Chrome Runner Sneaker",
    price: 1299900,
    href: "/shop",
    image: "",
  },
  {
    id: "t3",
    brand: "MERIDIAN",
    name: "Midnight Cargo Pants",
    price: 499900,
    href: "/shop",
    image: "",
  },
  {
    id: "t4",
    brand: "SIGNAL",
    name: "Signal Black Hoodie",
    price: 399900,
    href: "/shop",
    image: "",
  },
  {
    id: "t5",
    brand: "HALO",
    name: "Silver Dial Timepiece",
    price: 1849900,
    href: "/shop",
    image: "",
  },
  {
    id: "t6",
    brand: "KORE",
    name: "Urban Sling Bag",
    price: 549900,
    href: "/shop",
    image: "",
  },
];

export const newInProducts: HomeProduct[] = [
  {
    id: "n1",
    brand: "FLUX",
    name: "Vapor Low Trainer",
    price: 899900,
    href: "/shop",
    image: "",
  },
  {
    id: "n2",
    brand: "NOIR",
    name: "Structured Bomber",
    price: 649900,
    href: "/shop",
    image: "",
  },
  {
    id: "n3",
    brand: "MONOLITH",
    name: "Slate Overshirt",
    price: 459900,
    href: "/shop",
    image: "",
  },
  {
    id: "n4",
    brand: "APEX",
    name: "Velocity Track Pant",
    price: 379900,
    href: "/shop",
    image: "",
  },
];

export const luxuryFinds: HomeProduct[] = [
  {
    id: "l1",
    brand: "HALO",
    name: "Obsidian Chronograph",
    price: 3499900,
    href: "/shop",
    image: "",
  },
  {
    id: "l2",
    brand: "MERIDIAN",
    name: "Sculpted Leather Tote",
    price: 2299900,
    href: "/shop",
    image: "",
  },
  {
    id: "l3",
    brand: "VANTA",
    name: "Cashmere Wrap Coat",
    price: 1899900,
    href: "/shop",
    image: "",
  },
  {
    id: "l4",
    brand: "PULSE",
    name: "Titanium Frame Shades",
    price: 1249900,
    href: "/shop",
    image: "",
  },
];

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
