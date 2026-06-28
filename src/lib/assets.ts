export const skxnzFallbackAssets = {
  product: "/assets/ui/placeholders/product-fallback.svg",
  brand: "/assets/ui/placeholders/brand-fallback.svg",
  hero: "/assets/ui/placeholders/hero-fallback.svg",
  category: "/assets/ui/placeholders/category-fallback.svg",
  avatar: "/assets/ui/placeholders/avatar-fallback.svg",
  seller: "/assets/ui/placeholders/seller-fallback.svg",
} as const;

export const skxnzAssetMap = {
  brand: {
    wordmark: "/assets/brand/logo/skxnz-wordmark-transparent.png",
    mark: "/assets/brand/marks/skxnz-mark-transparent.png",
    icon: "/assets/brand/icons/skxnz-app-icon-transparent.png",
  },
  home: {
    hero: {
      wearTheSignal: "/assets/home/hero/wear-the-signal.png",
      newSeason: "/assets/home/hero/new-season-picks.png",
      aiStyled: "/assets/home/hero/ai-styled-fits.png",
      limitedEdition: "/assets/home/hero/limited-edition-drops.png",
    },
    categories: {
      men: "/assets/home/categories/men.png",
      woman: "/assets/home/categories/women.png",
      perfume: "/assets/home/categories/perfumes.png",
      accessories: "/assets/home/categories/accessories.png",
      streetwear: "/assets/home/categories/streetwear.png",
      footwear: "/assets/home/categories/shoes.svg",
    },
    drops: {
      limitedEdition: "/assets/home/drops/limited-edition-drops.png",
    },
  },
  brands: {
    demo: {
      skxnz: {
        logo: "/assets/brands/demo/skxnz/logo.webp",
        hero: "/assets/brands/demo/skxnz/hero.webp",
      },
      "demo-atelier": {
        logo: "/assets/brands/demo/demo-atelier/logo.webp",
        hero: "/assets/brands/demo/demo-atelier/hero.png",
      },
      "signal-studio": {
        logo: "/assets/brands/demo/signal-studio/logo.webp",
        hero: "/assets/brands/demo/signal-studio/hero.png",
      },
      "chrome-district": {
        logo: "/assets/brands/demo/chrome-district/logo.webp",
        hero: "/assets/brands/demo/chrome-district/hero.png",
      },
    },
  },
  products: {
    demo: {
      "obsidian-signal-oversized-tee":
        "/assets/products/demo/obsidian-signal-oversized-tee.png",
      "pearl-signal-crop-jacket":
        "/assets/products/demo/pearl-signal-crop-jacket.png",
      "chrome-trace-hoodie": "/assets/products/demo/chrome-trace-hoodie.webp",
      ["sonic-ma" + "genta-mini-bag"]:
        "/assets/products/demo/sonic-ma" + "genta-mini-bag.webp",
      "liquid-silver-perfume":
        "/assets/products/demo/liquid-silver-perfume.png",
      "midnight-cargo-pants": "/assets/products/demo/midnight-cargo-pants.webp",
      "ultraviolet-mesh-top": "/assets/products/demo/ultraviolet-mesh-top.webp",
      "pearl-white-sneakers": "/assets/products/demo/pearl-white-sneakers.webp",
      "obsidian-rider-vest": "/assets/products/demo/obsidian-rider-vest.webp",
      ["electric-cy" + "an-sunglasses"]:
        "/assets/products/demo/electric-cy" + "an-sunglasses.webp",
      "signal-layered-shirt": "/assets/products/demo/signal-layered-shirt.png",
      "chrome-district-bracelet":
        "/assets/products/demo/chrome-district-bracelet.webp",
      "demo-atelier-long-coat":
        "/assets/products/demo/demo-atelier-long-coat.png",
      "future-runner-crossbody":
        "/assets/products/demo/future-runner-crossbody.webp",
      "ai-drift-co-ord-set": "/assets/products/demo/ai-drift-co-ord-set.png",
    },
  },
} as const;

const legacyAssetAliases: Record<string, string> = {
  "/assets/brand/skxnz/logo-wordmark-transparent.png": skxnzAssetMap.brand.wordmark,
  "/assets/brand/skxnz/logo-mark-transparent.png": skxnzAssetMap.brand.mark,
  "/assets/demo/uploaded/editorial/fire-shirt-look.png":
    skxnzAssetMap.home.hero.wearTheSignal,
  "/assets/demo/uploaded/products/skxnz-back-tee.png":
    skxnzAssetMap.home.hero.aiStyled,
  "/assets/demo/uploaded/products/skxnz-graphic-tee.png":
    skxnzAssetMap.home.hero.limitedEdition,
  "/assets/demo/uploaded/editorial/monochrome-fit.png":
    skxnzAssetMap.home.categories.men,
  "/assets/demo/uploaded/editorial/chrome-queen.png":
    skxnzAssetMap.home.categories.perfume,
  "/assets/demo/uploaded/categories/streetwear-chain.png":
    skxnzAssetMap.home.categories.accessories,
  "/assets/demo/categories/shoes.svg": skxnzAssetMap.home.categories.footwear,
  "/assets/demo/brands/skxnz/logo.webp":
    skxnzAssetMap.brands.demo.skxnz.logo,
  "/assets/demo/brands/skxnz/hero.webp":
    skxnzAssetMap.brands.demo.skxnz.hero,
};

const productSlugAssetMap = skxnzAssetMap.products.demo;
const brandDemoAssetMap = skxnzAssetMap.brands.demo;
const categoryAssetMap: Record<string, string> = {
  men: skxnzAssetMap.home.categories.men,
  woman: skxnzAssetMap.home.categories.woman,
  perfume: skxnzAssetMap.home.categories.perfume,
  accessories: skxnzAssetMap.home.categories.accessories,
  streetwear: skxnzAssetMap.home.categories.streetwear,
  footwear: skxnzAssetMap.home.categories.footwear,
  "wear-the-signal": skxnzAssetMap.home.hero.wearTheSignal,
  "new-season": skxnzAssetMap.home.hero.newSeason,
  "ai-stylised": skxnzAssetMap.home.hero.aiStyled,
  "limited-edition": skxnzAssetMap.home.drops.limitedEdition,
};

export function normalizeAssetPath(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "";
  }

  return legacyAssetAliases[trimmed] ?? trimmed;
}

export function isInternalAssetPath(value?: string | null) {
  return normalizeAssetPath(value).startsWith("/assets/");
}

function ensureAsset(value: string | null | undefined, fallback: string) {
  const normalized = normalizeAssetPath(value);
  return isInternalAssetPath(normalized) ? normalized : fallback;
}

export function ensureProductAsset(value?: string | null, slug?: string) {
  return ensureAsset(
    slug ? productSlugAssetMap[slug as keyof typeof productSlugAssetMap] ?? value : value,
    skxnzFallbackAssets.product,
  );
}

export function ensureBrandLogoAsset(value?: string | null, slug?: string) {
  return ensureAsset(
    slug ? brandDemoAssetMap[slug as keyof typeof brandDemoAssetMap]?.logo ?? value : value,
    skxnzFallbackAssets.brand,
  );
}

export function ensureBrandHeroAsset(value?: string | null, slug?: string) {
  return ensureAsset(
    slug ? brandDemoAssetMap[slug as keyof typeof brandDemoAssetMap]?.hero ?? value : value,
    skxnzFallbackAssets.hero,
  );
}

export function ensureHeroAsset(value?: string | null) {
  return ensureAsset(value, skxnzFallbackAssets.hero);
}

export function ensureCategoryAsset(value?: string | null, slug?: string) {
  return ensureAsset(slug ? categoryAssetMap[slug] ?? value : value, skxnzFallbackAssets.category);
}

export function ensureAvatarAsset(value?: string | null) {
  return ensureAsset(value, skxnzFallbackAssets.avatar);
}

export function ensureSellerAsset(value?: string | null) {
  return ensureAsset(value, skxnzFallbackAssets.seller);
}
