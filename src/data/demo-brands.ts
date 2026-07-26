import { brandPageHeroes } from "@/src/data/brandPageHeroes";
import { structuredBrands } from "@/src/data/brands";
import { structuredProducts } from "@/src/data/products";
import {
  controlledSkxnzBrandPlaceholder,
  controlledSkxnzPlaceholderImage,
  resolveCategoryDisplayName,
  uniqueNonEmpty,
} from "@/src/lib/catalog-content";
import { ensureBrandHeroAsset, ensureBrandLogoAsset } from "@/src/lib/assets";

export type DemoBrand = {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string;
  shortDescription: string;
  logo: string;
  logoType: string;
  heroImage: string;
  accentColor: string;
  featured?: boolean;
  isFeatured: boolean;
  isTopBrand: boolean;
  isLuxury: boolean;
  isStreetwear: boolean;
  isNew: boolean;
  isDemo: boolean;
  country: string;
  productCount: number;
  description: string;
  availabilityNote: string;
  heroProductId: string;
  categories: string[];
  searchKeywords: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export const legacyBrandSlugAliases: Record<string, string> = {
  "noir-signal": "signal-studio",
  "chrome-lab": "chrome-district",
  "vanta-mode": "demo-atelier",
  "pulse-atelier": "chrome-district",
  "obsidian-wear": "skxnz",
};

function resolveBrandSlug(slug: string) {
  return legacyBrandSlugAliases[slug] ?? slug;
}

const structuredBrandProducts = new Map(
  structuredBrands.map((brand) => [
    brand.slug,
    structuredProducts.filter((product) => product.brandSlug === brand.slug),
  ]),
);

export const demoBrands: DemoBrand[] = structuredBrands.map((brand) => {
  const brandHero = brandPageHeroes.find((entry) => entry.brandSlug === brand.slug);
  const brandProducts = structuredBrandProducts.get(brand.slug) ?? [];
  const heroProduct =
    brandProducts.find(
      (product) => product.brandPageDisplay || product.homepageDisplay || product.featured,
    ) ??
    brandProducts[0];
  const categories = uniqueNonEmpty(
    brand.categories.map((category) => resolveCategoryDisplayName(category)),
  );
  const searchKeywords = uniqueNonEmpty(brand.searchKeywords);
  const normalizedBrandSignals = [
    brand.brandCategory,
    brand.name,
    brand.status,
    ...categories,
    ...searchKeywords,
  ]
    .join(" ")
    .toLowerCase();

  return {
    id: `brand-${brand.slug}`,
    slug: brand.slug,
    name: brand.name,
    category: brand.brandCategory,
    tagline: brand.tagline,
    shortDescription: brand.shortDescription,
    logo: ensureBrandLogoAsset(
      brand.logo || controlledSkxnzBrandPlaceholder,
      brand.slug,
    ),
    logoType: brand.slug === "skxnz" ? "SKXNZ mark" : "Curated label mark",
    heroImage: ensureBrandHeroAsset(
      brandHero?.image ?? brand.heroImage ?? heroProduct?.image ?? controlledSkxnzPlaceholderImage,
      brand.slug,
    ),
    accentColor: brand.accentColor,
    featured: brand.featured || brand.topBrand,
    isFeatured: brand.featured || brand.topBrand,
    isTopBrand: brand.topBrand,
    isLuxury: normalizedBrandSignals.includes("luxury"),
    isStreetwear: normalizedBrandSignals.includes("streetwear"),
    isNew: brand.status.toLowerCase().includes("demo") || brand.slug !== "skxnz",
    isDemo: brand.status.toLowerCase() !== "active" || brand.slug !== "skxnz",
    country: "India",
    productCount: brandProducts.length,
    description: brand.description,
    availabilityNote: brand.availabilityNote,
    heroProductId: heroProduct?.slug ?? "obsidian-signal-oversized-tee",
    categories,
    searchKeywords,
    tags: uniqueNonEmpty([
      brand.brandCategory,
      brand.status,
      ...categories,
      ...searchKeywords,
      brand.topBrand ? "Top Brands" : "",
      brand.featured ? "Featured" : "",
    ]),
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  };
});

export function getCanonicalBrandSlug(slug: string) {
  return resolveBrandSlug(slug);
}
