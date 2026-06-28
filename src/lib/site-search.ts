import { demoBrands, type DemoBrand } from "@/src/data/demo-brands";
import { structuredCategories } from "@/src/data/categories";
import type { Product } from "@/src/data/demo-products";
import { structuredCollections } from "@/src/data/collections";
import {
  getCategoryPageHref,
  getCategorySearchTerms as getStructuredCategorySearchTerms,
} from "@/src/lib/catalog-content";

export type SearchSuggestionType =
  | "product"
  | "brand"
  | "category"
  | "collection"
  | "page";

export type SearchSuggestion = {
  type: SearchSuggestionType;
  label: string;
  href: string;
  description: string;
  image?: string;
  score: number;
};

const categoryAliases: Record<string, string[]> = {
  Men: ["men", "man", "mens"],
  Women: ["women", "woman", "womens"],
  Woman: ["woman", "women", "womens"],
  Perfumes: ["perfume", "perfumes", "fragrance", "fragrances"],
  Perfume: ["perfume", "perfumes", "fragrance", "fragrances"],
  Accessories: ["accessories", "accessory"],
  Shoes: ["shoes", "shoe", "footwear"],
  Footwear: ["footwear", "shoes", "shoe", "sneakers", "sneaker"],
  Streetwear: ["streetwear", "street wear"],
  Outerwear: ["outerwear", "jacket", "layering"],
  Jackets: ["jackets", "jacket"],
  Tops: ["tops", "top", "tee", "shirt"],
  "T-Shirts": ["t-shirts", "t shirt", "t-shirt", "tee", "tees", "shirt"],
  Bags: ["bags", "bag", "carry"],
  Bottoms: ["bottoms", "pants", "cargo"],
  Vests: ["vests", "vest"],
  "New Season": ["new season", "season picks", "fresh drops", "new collection"],
  "AI Stylised": [
    "ai stylised",
    "ai styled",
    "ai style",
    "ai fashion",
    "digital fashion",
    "futurewear",
  ],
  "AI Styled": [
    "ai styled",
    "ai stylised",
    "ai style",
    "ai fashion",
    "digital fashion",
    "futurewear",
  ],
  "Limited Edition": [
    "limited edition",
    "limited",
    "limited drops",
    "drop zone",
    "exclusive",
    "rare",
  ],
  "Wear The Signal": [
    "wear the signal",
    "signal",
    "skxnz signature",
    "signature",
    "futurewear",
  ],
};

const pageSuggestions = [
  {
    label: "AI Stylist",
    href: "/ai-stylist",
    description: "Page",
    searchTerms: ["ai stylist", "ai stylised", "ai styled", "stylist", "style"],
  },
] as const;

const collectionSuggestions = structuredCollections.map((collection) => ({
  label: collection.name,
  href: collection.href,
  description: "Collection",
  searchTerms: collection.searchKeywords,
}));

function compactWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeSearchQuery(value: string) {
  return compactWhitespace(value).toLowerCase();
}

function createMatchScore(
  normalizedQuery: string,
  searchableValues: readonly string[],
) {
  if (!normalizedQuery) {
    return 0;
  }

  const queryTokens = normalizedQuery.split(" ");
  let bestScore = 0;

  for (const value of searchableValues) {
    const normalizedValue = normalizeSearchQuery(value);

    if (!normalizedValue) {
      continue;
    }

    if (normalizedValue === normalizedQuery) {
      bestScore = Math.max(bestScore, 120);
      continue;
    }

    if (normalizedValue.startsWith(normalizedQuery)) {
      bestScore = Math.max(bestScore, 92);
      continue;
    }

    if (normalizedValue.includes(normalizedQuery)) {
      bestScore = Math.max(bestScore, 72);
      continue;
    }

    if (queryTokens.every((token) => normalizedValue.includes(token))) {
      bestScore = Math.max(bestScore, 54);
    }
  }

  return bestScore;
}

function getCategorySearchTerms(category: string) {
  return [category, ...(categoryAliases[category] ?? [])];
}

function getCollectionSearchTerms(collection: string) {
  return [collection, ...(categoryAliases[collection] ?? [])];
}

function getBrandSearchTerms(brand: DemoBrand) {
  return [
    brand.name,
    brand.slug,
    brand.tagline,
    brand.shortDescription,
    brand.description,
    ...brand.searchKeywords,
    ...brand.categories,
    ...brand.categories.flatMap((category) => getCategorySearchTerms(category)),
  ];
}

export function getProductSearchTerms(product: Product) {
  const brand = demoBrands.find((entry) => entry.slug === product.brandSlug);

  return [
    product.name,
    product.brandName,
    product.brandSlug,
    product.category,
    product.subtitle,
    product.shortDescription,
    product.description,
    String(product.price),
    product.salePrice ? String(product.salePrice) : "",
    `under ${product.salePrice ?? product.price}`,
    `below ${product.salePrice ?? product.price}`,
    product.fabric,
    product.fit,
    product.seller,
    product.launchNote,
    ...product.colors,
    ...product.sizes,
    ...(product.tags ?? []),
    ...(product.collections ?? []).flatMap((collection) =>
      getCollectionSearchTerms(collection),
    ),
    ...(product.searchAliases ?? []),
    ...(brand ? getBrandSearchTerms(brand) : []),
    ...getCategorySearchTerms(product.category),
  ];
}

export function filterProductsBySearch(products: Product[], query: string) {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return products;
  }

  return [...products]
    .map((product) => ({
      product,
      score: createMatchScore(normalizedQuery, getProductSearchTerms(product)),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.product);
}

export function buildSearchSuggestions({
  query,
  products,
  brands = demoBrands,
  limit = 8,
}: {
  query: string;
  products: Product[];
  brands?: DemoBrand[];
  limit?: number;
}) {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return [] as SearchSuggestion[];
  }

  const suggestions: SearchSuggestion[] = [];
  const pushSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestions.some((entry) => entry.type === suggestion.type && entry.href === suggestion.href)) {
      return;
    }

    suggestions.push(suggestion);
  };

  for (const product of products) {
    const score = createMatchScore(normalizedQuery, getProductSearchTerms(product));

    if (score > 0) {
      pushSuggestion({
        type: "product",
        label: product.name,
        href: `/product/${product.id}`,
        description: `${product.brandName} • Product`,
        image: product.image,
        score: score + 20,
      });
    }
  }

  for (const brand of brands) {
    const score = createMatchScore(normalizedQuery, getBrandSearchTerms(brand));

    if (score > 0) {
      pushSuggestion({
        type: "brand",
        label: brand.name,
        href: `/brands/${brand.slug}`,
        description: "Brand",
        image: brand.logo,
        score: score + 12,
      });
    }
  }

  for (const category of structuredCategories) {
    const score = createMatchScore(
      normalizedQuery,
      getStructuredCategorySearchTerms(category).concat(
        categoryAliases[category.displayName] ?? [],
      ),
    );

    if (score > 0) {
      pushSuggestion({
        type: "category",
        label: category.displayName,
        href: getCategoryPageHref(category.slug),
        description: "Category",
        score,
      });
    }
  }

  const dynamicCollections = Array.from(
    new Set(products.flatMap((product) => product.collections ?? [])),
  );

  for (const collection of dynamicCollections) {
    const score = createMatchScore(normalizedQuery, [collection]);

    if (score > 0) {
      pushSuggestion({
        type: "collection",
        label: collection,
        href: `/shop?q=${encodeURIComponent(collection)}`,
        description: "Collection",
        score,
      });
    }
  }

  for (const entry of collectionSuggestions) {
    const score = createMatchScore(normalizedQuery, entry.searchTerms);

    if (score > 0) {
      pushSuggestion({
        type: "collection",
        label: entry.label,
        href: entry.href,
        description: entry.description,
        score: score + 8,
      });
    }
  }

  for (const entry of pageSuggestions) {
    const score = createMatchScore(normalizedQuery, entry.searchTerms);

    if (score > 0) {
      pushSuggestion({
        type: "page",
        label: entry.label,
        href: entry.href,
        description: entry.description,
        score,
      });
    }
  }

  return suggestions.sort((left, right) => right.score - left.score).slice(0, limit);
}
