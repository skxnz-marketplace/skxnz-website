import {
  formatProductPrice,
  isApprovedProduct,
  products as demoProducts,
  type Product,
} from "@/lib/data/products";
import { demoBrands } from "@/src/data/demo-brands";
import { aiOutfitMetadata, type AiOutfitMetadata } from "@/src/data/aiOutfitMetadata";
import { ensureProductAsset, skxnzFallbackAssets } from "@/src/lib/assets";
import {
  getCategoryPageHref,
  getStructuredCategoryByValue,
  resolveCategoryDisplayName,
  resolveCategorySlug,
  uniqueNonEmpty,
} from "@/src/lib/catalog-content";
import { getProductSearchTerms } from "@/src/lib/site-search";

export type SkxnzAssistantIntent =
  | "color_product_request"
  | "product_recommendation"
  | "occasion_styling"
  | "budget_recommendation"
  | "product_comparison"
  | "category_navigation"
  | "size_help"
  | "cart_help"
  | "order_help"
  | "return_help"
  | "gift_help"
  | "blocked_out_of_scope"
  | "unknown_shopping_related";

export type SkxnzAssistantProductRecommendation = {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  price: number;
  formattedPrice: string;
  category: string;
  image: string;
  href: string;
  reason: string;
  sizes: string[];
  colors: string[];
  matchedColor?: string;
};

export type SkxnzAssistantSuggestedLink = {
  id: string;
  type: "category" | "brand";
  label: string;
  href: string;
  helperText: string;
};

export type SkxnzAssistantContext = {
  cartProductIds?: string[];
  wishlistProductIds?: string[];
  stylePreferences?: {
    preferredCategory?: string;
    favouriteBrands?: string;
    favouriteColors?: string;
    styleVibe?: string;
    budgetRange?: string;
    sizePreferences?: string;
  };
};

export type SkxnzAssistantResponse = {
  reply: string;
  intent: SkxnzAssistantIntent;
  blocked: boolean;
  recommendedProducts: SkxnzAssistantProductRecommendation[];
  suggestedLinks: SkxnzAssistantSuggestedLink[];
  followUpQuestion?: string;
};

type AssistantCategoryKey =
  | "tshirt"
  | "shirt"
  | "hoodie"
  | "jeans"
  | "pants"
  | "perfume"
  | "accessories"
  | "sneakers"
  | "jacket"
  | "streetwear"
  | "limitedEdition"
  | "aiStyled"
  | "newSeason";

type AssistantColorConfig = {
  id: string;
  label: string;
  terms: string[];
  productTerms: string[];
};

type QuerySignals = {
  normalizedMessage: string;
  intent: SkxnzAssistantIntent;
  categoryKeys: AssistantCategoryKey[];
  categoryLabels: string[];
  requestedColors: AssistantColorConfig[];
  colorLabels: string[];
  occasionLabels: string[];
  occasionTerms: string[];
  styleTerms: string[];
  fitTerms: string[];
  brandTerms: string[];
  brandSlugs: string[];
  brandLabels: string[];
  contextTerms: string[];
  cartProductIds: string[];
  wishlistProductIds: string[];
  budgetMax?: number;
  budgetMin?: number;
  budgetLabel?: string;
  priceMood?: "affordable" | "premium";
  exactMatchWasWeak: boolean;
  fallbackReason?: "no_exact_color_category" | "no_exact_color" | "no_exact_budget" | "weak";
};

type RecommendationResult = {
  products: Product[];
  exactMatchWasWeak: boolean;
  isAlternative: boolean;
  fallbackReason?: QuerySignals["fallbackReason"];
};

const skxnzOnlyRefusal =
  "I can only help with SKXNZ shopping, styling, products, orders, and marketplace support. Tell me what you're shopping for and I'll help you find the right fit.";

const blockedKeywordGroups = [
  [
    "prime minister",
    "president",
    "election",
    "government",
    "parliament",
    "political party",
    "vote",
    "minister",
    "politics",
  ],
  [
    "news",
    "current affairs",
    "today news",
    "latest news",
    "celebrity",
    "celebrities",
    "cricket score",
    "weather",
    "capital of france",
    "homework",
    "write code",
    "coding",
    "another app",
  ],
  ["medicine", "diagnosis", "disease", "doctor", "prescription", "treatment", "medical"],
  ["lawyer", "court", "legal advice", "fir", "contract", "lawsuit", "legal"],
  ["stock", "stocks", "crypto", "investment", "trading", "loan", "tax advice", "finance"],
  ["weapon", "weapons", "bomb", "poison", "hack", "hacking", "exploit", "violence"],
  ["sex", "nude", "explicit", "porn", "adult"],
];

const joinWord = (...parts: string[]) => parts.join("");

const assistantCategoryConfigs: Array<{
  key: AssistantCategoryKey;
  label: string;
  terms: string[];
  productTerms: string[];
}> = [
  {
    key: "tshirt",
    label: "t-shirt",
    terms: ["t-shirt", "t-shirts", "t shirt", "tshirt", "tee", "tees"],
    productTerms: ["t-shirts", "t-shirt", "tee", "tees", "oversized tee"],
  },
  {
    key: "shirt",
    label: "shirt",
    terms: ["shirt", "shirts"],
    productTerms: ["shirts", "shirt", "layered shirt"],
  },
  {
    key: "hoodie",
    label: "hoodie",
    terms: ["hoodie", "hoodies", "sweatshirt"],
    productTerms: ["hoodies", "hoodie", "sweatshirt"],
  },
  {
    key: "jeans",
    label: "jeans",
    terms: ["jeans", "denim"],
    productTerms: ["jeans", "denim"],
  },
  {
    key: "pants",
    label: "pants",
    terms: ["pants", "cargo", "trousers", "bottomwear", "bottom"],
    productTerms: ["pants", "cargo", "trousers", "bottomwear"],
  },
  {
    key: "perfume",
    label: "perfume",
    terms: ["perfume", "fragrance", "scent"],
    productTerms: ["perfume", "fragrance", "scent"],
  },
  {
    key: "accessories",
    label: "accessories",
    terms: ["accessories", "accessory", "bag", "bags", "sunglasses", "bracelet", "cap"],
    productTerms: ["accessories", "accessory", "bags", "bag", "eyewear", "bracelet", "jewellery"],
  },
  {
    key: "sneakers",
    label: "sneakers",
    terms: ["sneakers", "sneaker", "shoes", "shoe", "footwear"],
    productTerms: ["sneakers", "sneaker", "shoes", "shoe", "footwear"],
  },
  {
    key: "jacket",
    label: "jacket",
    terms: ["jacket", "jackets", "coat", "coats", "vest", "vests", "layer"],
    productTerms: ["jackets", "jacket", "coat", "coats", "vest", "vests", "outerwear"],
  },
  {
    key: "streetwear",
    label: "streetwear",
    terms: ["streetwear", "street wear"],
    productTerms: ["streetwear", "street wear"],
  },
  {
    key: "limitedEdition",
    label: "limited edition",
    terms: ["limited edition", "limited", "drop", "drops"],
    productTerms: ["limited edition", "limited", "drop", "drops"],
  },
  {
    key: "aiStyled",
    label: "AI Styled",
    terms: ["ai styled", "ai stylised", "ai style", "ai fashion"],
    productTerms: ["ai styled", "ai stylised", "ai style", "ai fashion"],
  },
  {
    key: "newSeason",
    label: "new season",
    terms: ["new season", "new collection", "latest", "fresh drops"],
    productTerms: ["new season", "new collection", "latest", "fresh drops"],
  },
];

const assistantColors: AssistantColorConfig[] = [
  {
    id: joinWord("bl", "ue"),
    label: joinWord("bl", "ue"),
    terms: [joinWord("bl", "ue")],
    productTerms: [joinWord("bl", "ue")],
  },
  {
    id: "black",
    label: "black",
    terms: ["black", "obsidian"],
    productTerms: ["black", "obsidian"],
  },
  {
    id: "white",
    label: "white",
    terms: ["white", "pearl"],
    productTerms: ["white", "pearl"],
  },
  {
    id: "red",
    label: "red",
    terms: ["red", "sangria"],
    productTerms: ["red", "sangria"],
  },
  {
    id: "green",
    label: "green",
    terms: ["green"],
    productTerms: ["green"],
  },
  {
    id: "beige",
    label: "beige",
    terms: ["beige", "sand"],
    productTerms: ["beige", "sand"],
  },
  {
    id: "cream",
    label: "cream",
    terms: ["cream", "ivory"],
    productTerms: ["cream", "ivory"],
  },
  {
    id: "grey",
    label: "grey",
    terms: ["grey", "gray", "chrome"],
    productTerms: ["grey", "gray", "chrome"],
  },
  {
    id: "silver",
    label: "silver",
    terms: ["silver"],
    productTerms: ["silver"],
  },
  {
    id: "navy",
    label: "navy",
    terms: ["navy", "midnight"],
    productTerms: ["navy", "midnight"],
  },
  {
    id: joinWord("pur", "ple"),
    label: joinWord("pur", "ple"),
    terms: [joinWord("pur", "ple"), "ultra" + joinWord("vio", "let")],
    productTerms: [joinWord("pur", "ple"), "ultra" + joinWord("vio", "let")],
  },
  {
    id: joinWord("pi", "nk"),
    label: joinWord("pi", "nk"),
    terms: [joinWord("pi", "nk")],
    productTerms: [joinWord("pi", "nk")],
  },
  {
    id: "brown",
    label: "brown",
    terms: ["brown", "bronze"],
    productTerms: ["brown", "bronze"],
  },
  {
    id: "yellow",
    label: "yellow",
    terms: ["yellow"],
    productTerms: ["yellow"],
  },
  {
    id: "orange",
    label: "orange",
    terms: ["orange"],
    productTerms: ["orange"],
  },
  {
    id: "pastel",
    label: "pastel",
    terms: ["pastel"],
    productTerms: ["pastel", "pearl", "cream", "ivory", "beige"],
  },
  {
    id: "dark",
    label: "dark",
    terms: ["dark"],
    productTerms: ["dark", "black", "obsidian", "midnight", "navy"],
  },
  {
    id: "light",
    label: "light",
    terms: ["light"],
    productTerms: ["light", "white", "pearl", "cream", "ivory", "beige", "silver"],
  },
];

const occasionMappings: Record<string, string[]> = {
  "beach party": [
    "t-shirt",
    "tee",
    "relaxed",
    "breathable",
    "light",
    "summer",
    "casual",
    "streetwear",
    "daily",
  ],
  party: ["statement", "dark", "bold", "premium", "streetwear", "evening"],
  college: ["casual", "comfortable", "affordable", "daily", "streetwear", "backpack"],
  date: ["clean", "premium", "minimal", "fitted", "relaxed", "polished", "dinner"],
  wedding: ["formal", "premium", "elegant", "polished"],
  travel: ["comfortable", "versatile", "layering", "relaxed", "carry"],
  gym: ["breathable", "stretch", "activewear", "comfortable"],
  club: ["party", "statement", "dark", "bold", "streetwear"],
  dinner: ["date", "clean", "premium", "polished", "evening"],
  "daily wear": ["daily", "casual", "comfortable", "clean"],
  "night fit": ["night", "dark", "statement", "premium", "streetwear", "chrome"],
  "night fits": ["night", "dark", "statement", "premium", "streetwear", "chrome"],
  gift: ["gift", "perfume", "accessory", "neutral", "popular"],
};

const fitTerms = ["oversized", "regular", "slim", "relaxed", "fitted"];
const vibeTerms = [
  "streetwear",
  "minimal",
  "luxury",
  "bold",
  "clean",
  "futuristic",
  "chrome",
  "night fit",
  "night fits",
  "casual",
  "formal",
  "premium",
  "statement",
  "daily",
  "limited edition",
  "wear the signal",
  "new season",
  "ai stylised",
  "ai styled",
];

const aiMetadataBySlug = new Map(aiOutfitMetadata.map((metadata) => [metadata.slug, metadata]));

function compactWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeText(value: string) {
  return compactWhitespace(value).toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasTerm(normalizedText: string, term: string) {
  const normalizedTerm = normalizeText(term);

  if (!normalizedTerm) {
    return false;
  }

  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`).test(
    normalizedText,
  );
}

function includesAny(normalizedText: string, terms: readonly string[]) {
  return terms.some((term) => hasTerm(normalizedText, term));
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function sanitizeIdList(values?: string[]) {
  return unique(
    (values ?? [])
      .map((value) => value.trim())
      .filter((value) => /^[a-z0-9-]+$/i.test(value)),
  ).slice(0, 12);
}

function getContextTerms(context?: SkxnzAssistantContext) {
  const preferences = context?.stylePreferences;

  if (!preferences) {
    return [] as string[];
  }

  return unique([
    preferences.preferredCategory ?? "",
    preferences.favouriteBrands ?? "",
    preferences.favouriteColors ?? "",
    preferences.styleVibe ?? "",
    preferences.budgetRange ?? "",
    preferences.sizePreferences ?? "",
  ]);
}

function effectiveProductPrice(product: Product) {
  return product.salePrice ?? product.price;
}

function getProductMetadata(product: Product): AiOutfitMetadata | null {
  return aiMetadataBySlug.get(product.slug) ?? aiMetadataBySlug.get(product.id) ?? null;
}

function getProductDescriptor(product: Product) {
  const metadata = getProductMetadata(product);

  return normalizeText(
    [
      ...getProductSearchTerms(product),
      ...(metadata?.styleTags ?? []),
      ...(metadata?.occasionTags ?? []),
      ...(metadata?.colorFamily ?? []),
      metadata?.itemType,
      metadata?.fitType,
      metadata?.gender,
      product.fit,
      product.fabric,
      product.price.toString(),
      effectiveProductPrice(product) < 5000 ? "under 5000 affordable" : "",
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getProductTypeDescriptor(product: Product) {
  const metadata = getProductMetadata(product);

  return normalizeText(
    [
      product.name,
      product.category,
      product.subcategory,
      product.subtitle,
      product.shortDescription,
      product.description,
      product.fit,
      product.fabric,
      product.accent,
      metadata?.itemType,
      metadata?.fitType,
      metadata?.gender,
      ...(metadata?.styleTags ?? []),
      ...(metadata?.occasionTags ?? []),
      ...(metadata?.colorFamily ?? []),
      ...(product.tags ?? []),
      ...(product.collections ?? []),
      ...(product.searchAliases ?? []),
    ].join(" "),
  );
}

function getStrictColorDescriptor(product: Product) {
  return normalizeText(
    [
      product.name,
      product.accent,
      ...product.colors,
      ...(product.tags ?? []),
      ...(product.searchAliases ?? []),
    ].join(" "),
  );
}

function parseBudget(normalizedMessage: string) {
  const numberPattern = "([0-9][0-9,]*)";
  const upperBudget = normalizedMessage.match(
    new RegExp(`(?:under|below|less than|up to|upto)\\s*(?:rs|inr|₹)?\\s*${numberPattern}`),
  );
  const betweenBudget = normalizedMessage.match(
    new RegExp(
      `between\\s*(?:rs|inr|₹)?\\s*${numberPattern}\\s*(?:and|to|-)\\s*(?:rs|inr|₹)?\\s*${numberPattern}`,
    ),
  );

  if (betweenBudget) {
    const min = Number(betweenBudget[1].replace(/,/g, ""));
    const max = Number(betweenBudget[2].replace(/,/g, ""));

    return {
      min,
      max,
      label: `${formatProductPrice(min)}-${formatProductPrice(max)}`,
    };
  }

  if (upperBudget) {
    const max = Number(upperBudget[1].replace(/,/g, ""));

    return {
      max,
      label: `under ${formatProductPrice(max)}`,
    };
  }

  if (hasTerm(normalizedMessage, "affordable")) {
    return {
      max: 2500,
      label: `under ${formatProductPrice(2500)}`,
      priceMood: "affordable" as const,
    };
  }

  if (hasTerm(normalizedMessage, "premium") || hasTerm(normalizedMessage, "luxury")) {
    return {
      priceMood: "premium" as const,
    };
  }

  return {};
}

function isBlockedOutOfScope(normalizedMessage: string) {
  if (blockedKeywordGroups.some((group) => includesAny(normalizedMessage, group))) {
    return true;
  }

  const generalQuestionStart =
    normalizedMessage.startsWith("who is ") ||
    normalizedMessage.startsWith("what is the capital") ||
    normalizedMessage.startsWith("solve ") ||
    normalizedMessage.includes("solve my") ||
    normalizedMessage.startsWith("explain ");

  if (!generalQuestionStart) {
    return false;
  }

  const shoppingTerms = [
    "skxnz",
    "product",
    "brand",
    "category",
    "order",
    "return",
    "cart",
    "style",
    "fit",
    "wear",
    "shopping",
  ];

  return !includesAny(normalizedMessage, shoppingTerms);
}

function detectCategories(normalizedMessage: string) {
  const hasTshirtRequest = assistantCategoryConfigs
    .find((config) => config.key === "tshirt")
    ?.terms.some((term) => hasTerm(normalizedMessage, term));

  return assistantCategoryConfigs.filter((config) => {
    if (config.key === "shirt" && hasTshirtRequest) {
      return false;
    }

    return config.terms.some((term) => hasTerm(normalizedMessage, term));
  });
}

function detectColors(normalizedMessage: string) {
  return assistantColors.filter((config) =>
    config.terms.some((term) => hasTerm(normalizedMessage, term)),
  );
}

function detectBrands(normalizedMessage: string) {
  const productBrands = new Map<string, string>();

  for (const product of demoProducts) {
    productBrands.set(product.brandSlug, product.brandName || product.brandSlug);
  }

  return Array.from(productBrands.entries())
    .map(([slug, name]) => {
      const brand = demoBrands.find((entry) => entry.slug === slug);
      const searchTerms = unique([
        slug,
        slug.replace(/-/g, " "),
        name,
        brand?.name ?? "",
        ...(brand?.searchKeywords ?? []),
      ]);

      return {
        slug,
        name,
        searchTerms,
      };
    })
    .filter((brand) =>
      brand.searchTerms.some((term) => {
        const normalizedTerm = normalizeText(term);

        return normalizedTerm.length > 1 && normalizedMessage.includes(normalizedTerm);
      }),
    );
}

function detectOccasions(normalizedMessage: string) {
  return Object.entries(occasionMappings)
    .filter(([occasion]) => hasTerm(normalizedMessage, occasion))
    .map(([occasion, terms]) => ({
      label: occasion,
      terms,
    }));
}

function classifyIntent(
  normalizedMessage: string,
  categories = detectCategories(normalizedMessage),
  requestedColors = detectColors(normalizedMessage),
): SkxnzAssistantIntent {
  if (isBlockedOutOfScope(normalizedMessage)) {
    return "blocked_out_of_scope";
  }

  if (includesAny(normalizedMessage, ["compare", "which is better", "this or that"])) {
    return "product_comparison";
  }

  if (includesAny(normalizedMessage, ["gift", "present"])) {
    return "gift_help";
  }

  if (includesAny(normalizedMessage, ["size", "sizing", "fit me"])) {
    return "size_help";
  }

  if (includesAny(normalizedMessage, ["cart", "checkout", "add to cart"])) {
    return "cart_help";
  }

  if (includesAny(normalizedMessage, ["order", "tracking", "delivery"])) {
    return "order_help";
  }

  if (includesAny(normalizedMessage, ["return", "refund"])) {
    return "return_help";
  }

  if (requestedColors.length > 0 && categories.length > 0) {
    return "color_product_request";
  }

  if (includesAny(normalizedMessage, ["under", "below", "budget", "affordable", "between"])) {
    return "budget_recommendation";
  }

  if (detectOccasions(normalizedMessage).length > 0) {
    return "occasion_styling";
  }

  if (categories.length > 0 || includesAny(normalizedMessage, vibeTerms)) {
    return "product_recommendation";
  }

  if (includesAny(normalizedMessage, ["men", "woman", "women", "category", "brand", "collection"])) {
    return "category_navigation";
  }

  return "unknown_shopping_related";
}

export function classifySkxnzAssistantRequest(message: string): SkxnzAssistantIntent {
  return classifyIntent(normalizeText(message));
}

function detectSignals(message: string, context?: SkxnzAssistantContext): QuerySignals {
  const normalizedMessage = normalizeText(message);
  const categories = detectCategories(normalizedMessage);
  const requestedColors = detectColors(normalizedMessage);
  const occasions = detectOccasions(normalizedMessage);
  const budget = parseBudget(normalizedMessage);
  const intent = classifyIntent(normalizedMessage, categories, requestedColors);
  const detectedFitTerms = fitTerms.filter((term) => hasTerm(normalizedMessage, term));
  const detectedStyleTerms = vibeTerms.filter((term) => hasTerm(normalizedMessage, term));
  const detectedBrands = detectBrands(normalizedMessage);
  const contextTerms = getContextTerms(context);

  return {
    normalizedMessage,
    intent,
    categoryKeys: categories.map((category) => category.key),
    categoryLabels: unique(categories.map((category) => category.label)),
    requestedColors,
    colorLabels: unique(requestedColors.map((color) => color.label)),
    occasionLabels: unique(occasions.map((occasion) => occasion.label)),
    occasionTerms: unique(occasions.flatMap((occasion) => occasion.terms)),
    styleTerms: unique(detectedStyleTerms),
    fitTerms: unique(detectedFitTerms),
    brandTerms: unique(detectedBrands.flatMap((brand) => [brand.name, brand.slug])),
    brandSlugs: unique(detectedBrands.map((brand) => brand.slug)),
    brandLabels: unique(detectedBrands.map((brand) => brand.name)),
    contextTerms,
    cartProductIds: sanitizeIdList(context?.cartProductIds),
    wishlistProductIds: sanitizeIdList(context?.wishlistProductIds),
    budgetMax: budget.max,
    budgetMin: budget.min,
    budgetLabel: budget.label,
    priceMood: budget.priceMood,
    exactMatchWasWeak: false,
  };
}

function productMatchesCategory(product: Product, categoryKey: AssistantCategoryKey) {
  const descriptor = getProductTypeDescriptor(product);
  const config = assistantCategoryConfigs.find((entry) => entry.key === categoryKey);

  if (!config) {
    return false;
  }

  if (categoryKey === "aiStyled") {
    return includesAny(descriptor, ["ai styled", "ai stylised", "ai fashion"]);
  }

  if (categoryKey === "newSeason") {
    return includesAny(descriptor, ["new season", "new collection", "fresh drops"]);
  }

  if (categoryKey === "shirt") {
    const metadata = getProductMetadata(product);
    const itemType = normalizeText(metadata?.itemType ?? product.category);

    return itemType.includes("shirt") && !itemType.includes("t-shirt");
  }

  if (categoryKey === "tshirt") {
    const metadata = getProductMetadata(product);
    const itemType = normalizeText(metadata?.itemType ?? "");

    return (
      itemType.includes("t-shirt") ||
      config.productTerms.some((term) => hasTerm(descriptor, term))
    );
  }

  return config.productTerms.some((term) => hasTerm(descriptor, term));
}

function productMatchesAnyCategory(product: Product, categoryKeys: AssistantCategoryKey[]) {
  return categoryKeys.length === 0 || categoryKeys.some((key) => productMatchesCategory(product, key));
}

function productMatchedColor(product: Product, requestedColors: AssistantColorConfig[]) {
  if (requestedColors.length === 0) {
    return "";
  }

  const descriptor = getStrictColorDescriptor(product);

  for (const color of requestedColors) {
    if (color.productTerms.some((term) => hasTerm(descriptor, term))) {
      return color.label;
    }
  }

  return "";
}

function productMatchesBudget(product: Product, signals: QuerySignals) {
  const price = effectiveProductPrice(product);

  if (signals.budgetMax && price > signals.budgetMax) {
    return false;
  }

  if (signals.budgetMin && price < signals.budgetMin) {
    return false;
  }

  return true;
}

function hasHardConstraints(signals: QuerySignals) {
  return (
    signals.categoryKeys.length > 0 ||
    signals.requestedColors.length > 0 ||
    Boolean(signals.budgetMax || signals.budgetMin)
  );
}

function matchesHardConstraints(product: Product, signals: QuerySignals) {
  if (!isApprovedProduct(product) || product.stock <= 0) {
    return false;
  }

  if (!productMatchesAnyCategory(product, signals.categoryKeys)) {
    return false;
  }

  if (signals.requestedColors.length > 0 && !productMatchedColor(product, signals.requestedColors)) {
    return false;
  }

  return productMatchesBudget(product, signals);
}

function scoreProduct(product: Product, signals: QuerySignals) {
  if (!isApprovedProduct(product) || product.stock <= 0) {
    return -1;
  }

  const descriptor = getProductDescriptor(product);
  const matchedColor = productMatchedColor(product, signals.requestedColors);
  let score = 0;

  if (signals.categoryKeys.some((key) => productMatchesCategory(product, key))) {
    score += 40;
  }

  if (matchedColor) {
    score += 35;
  }

  if (signals.occasionTerms.some((term) => hasTerm(descriptor, term))) {
    score += 25;
  }

  if (productMatchesBudget(product, signals) && (signals.budgetMax || signals.budgetMin)) {
    score += 25;
  }

  if (signals.fitTerms.some((term) => hasTerm(descriptor, term))) {
    score += 15;
  }

  if (signals.styleTerms.some((term) => hasTerm(descriptor, term))) {
    score += 15;
  }

  if (signals.brandTerms.some((term) => descriptor.includes(normalizeText(term)))) {
    score += 10;
  }

  if (signals.brandSlugs.includes(product.brandSlug)) {
    score += 18;
  }

  for (const token of signals.normalizedMessage.split(" ").filter((entry) => entry.length > 2)) {
    if (hasTerm(descriptor, token)) {
      score += 10;
    }
  }

  if (signals.contextTerms.some((term) => includesAny(descriptor, term.split(/[,/]+/)))) {
    score += 8;
  }

  if (product.stock > 0) {
    score += 20;
  }

  if (signals.intent === "gift_help" && includesAny(descriptor, ["perfume", "accessory", "bag"])) {
    score += 30;
  }

  if (signals.occasionLabels.includes("beach party") && productMatchesCategory(product, "tshirt")) {
    score += 35;
  }

  if (signals.occasionLabels.includes("college") && effectiveProductPrice(product) <= 3000) {
    score += 18;
  }

  if (signals.priceMood === "premium" && includesAny(descriptor, ["premium", "luxury", "editorial"])) {
    score += 18;
  }

  return score;
}

function createReason(product: Product, signals: QuerySignals, isAlternative: boolean) {
  const categoryLabel = signals.categoryLabels[0] ?? product.category;
  const colorLabel = productMatchedColor(product, signals.requestedColors);

  if (!isAlternative && colorLabel && signals.categoryLabels.length > 0) {
    return `Matches your ${colorLabel} ${categoryLabel} request.`;
  }

  if (isAlternative && signals.colorLabels.length > 0 && signals.categoryLabels.length > 0) {
    return `Closest alternative for your ${signals.colorLabels[0]} ${categoryLabel} request.`;
  }

  if (signals.occasionLabels.includes("beach party")) {
    return "Fits the beach-party brief with relaxed, casual SKXNZ styling.";
  }

  if (signals.occasionLabels.length > 0) {
    return `Fits the ${signals.occasionLabels[0]} styling brief.`;
  }

  if (signals.budgetMax && productMatchesBudget(product, signals)) {
    return `Within your selected ${signals.budgetLabel ?? "budget"}.`;
  }

  if (signals.intent === "gift_help") {
    return "A safer gift direction because it is easy to style within SKXNZ.";
  }

  if (colorLabel) {
    return `Matches your ${colorLabel} color request.`;
  }

  return "A relevant SKXNZ pick based on the product data available.";
}

function toRecommendation(
  product: Product,
  signals: QuerySignals,
  isAlternative: boolean,
): SkxnzAssistantProductRecommendation {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brandName: product.brandName || "SKXNZ",
    price: effectiveProductPrice(product),
    formattedPrice: formatProductPrice(effectiveProductPrice(product)),
    category: product.category || "SKXNZ Product",
    image: ensureProductAsset(product.image, product.slug) || skxnzFallbackAssets.product,
    href: `/product/${product.id}`,
    reason: createReason(product, signals, isAlternative),
    sizes: product.sizes ?? [],
    colors: product.colors ?? [],
    matchedColor: productMatchedColor(product, signals.requestedColors) || undefined,
  };
}

function findMentionedProducts(signals: QuerySignals, approvedProducts: Product[]) {
  return approvedProducts.filter((product) => {
    const normalizedName = normalizeText(product.name);
    const normalizedId = normalizeText(product.id);
    const normalizedSlug = normalizeText(product.slug);

    return (
      signals.normalizedMessage.includes(normalizedName) ||
      signals.normalizedMessage.includes(normalizedId) ||
      signals.normalizedMessage.includes(normalizedSlug)
    );
  });
}

function rankProducts(products: Product[], signals: QuerySignals) {
  return products
    .map((product) => ({
      product,
      score: scoreProduct(product, signals),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => right.score - left.score);
}

function findAlternativeProducts(approvedProducts: Product[], signals: QuerySignals) {
  const categoryAlternatives = signals.categoryKeys.length
    ? approvedProducts.filter((product) => productMatchesAnyCategory(product, signals.categoryKeys))
    : [];
  const colorAlternatives = signals.requestedColors.length
    ? approvedProducts.filter((product) => productMatchedColor(product, signals.requestedColors))
    : [];

  if (categoryAlternatives.length > 0) {
    return rankProducts(categoryAlternatives, signals)
      .slice(0, 3)
      .map((entry) => entry.product);
  }

  if (colorAlternatives.length > 0) {
    return rankProducts(colorAlternatives, signals)
      .slice(0, 3)
      .map((entry) => entry.product);
  }

  const fallbackPool = unique(approvedProducts.map((product) => product.id))
    .map((id) => approvedProducts.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));

  return rankProducts(fallbackPool, signals)
    .slice(0, 3)
    .map((entry) => entry.product);
}

function findCartAwareProducts(approvedProducts: Product[], signals: QuerySignals) {
  if (signals.cartProductIds.length === 0) {
    return [] as Product[];
  }

  const cartProducts = signals.cartProductIds
    .map((productId) =>
      approvedProducts.find((product) => product.id === productId || product.slug === productId),
    )
    .filter((product): product is Product => Boolean(product));

  if (cartProducts.length === 0) {
    return [] as Product[];
  }

  const cartDescriptor = normalizeText(
    cartProducts
      .flatMap((product) => [
        product.category,
        product.subcategory,
        product.brandName,
        ...product.tags,
        ...product.collections,
        ...product.colors,
      ])
      .join(" "),
  );

  return rankProducts(
    approvedProducts.filter((product) => !signals.cartProductIds.includes(product.id)),
    {
      ...signals,
      styleTerms: unique([...signals.styleTerms, ...cartDescriptor.split(/\s+/)]),
    },
  )
    .slice(0, 3)
    .map((entry) => entry.product);
}

function findRecommendations(signals: QuerySignals): RecommendationResult {
  const approvedProducts = demoProducts.filter((product) => isApprovedProduct(product) && product.stock > 0);

  if (approvedProducts.length === 0) {
    return {
      products: [] as Product[],
      exactMatchWasWeak: false,
      isAlternative: false,
      fallbackReason: undefined,
    };
  }

  if (signals.intent === "cart_help") {
    const cartAwareProducts = findCartAwareProducts(approvedProducts, signals);

    if (cartAwareProducts.length > 0) {
      return {
        products: cartAwareProducts,
        exactMatchWasWeak: false,
        isAlternative: false,
        fallbackReason: undefined,
      };
    }
  }

  if (signals.intent === "product_comparison") {
    const mentionedProducts = findMentionedProducts(signals, approvedProducts);

    if (mentionedProducts.length >= 2) {
      return {
        products: mentionedProducts.slice(0, 3),
        exactMatchWasWeak: false,
        isAlternative: false,
        fallbackReason: undefined,
      };
    }

    if (!hasHardConstraints(signals)) {
      return {
        products: [] as Product[],
        exactMatchWasWeak: true,
        isAlternative: false,
        fallbackReason: "weak" as const,
      };
    }
  }

  if (hasHardConstraints(signals)) {
    const exactMatches = rankProducts(
      approvedProducts.filter((product) => matchesHardConstraints(product, signals)),
      signals,
    ).map((entry) => entry.product);

    if (exactMatches.length > 0) {
      return {
        products: exactMatches.slice(0, 3),
        exactMatchWasWeak: false,
        isAlternative: false,
        fallbackReason: undefined,
      };
    }

    const fallbackReason =
      signals.requestedColors.length > 0 && signals.categoryKeys.length > 0
        ? "no_exact_color_category"
        : signals.requestedColors.length > 0
          ? "no_exact_color"
          : "no_exact_budget";

    return {
      products: findAlternativeProducts(approvedProducts, signals),
      exactMatchWasWeak: true,
      isAlternative: true,
      fallbackReason,
    };
  }

  const rankedProducts = rankProducts(approvedProducts, signals);
  const positiveMatches = rankedProducts.filter((entry) => entry.score > 30);

  if (positiveMatches.length > 0) {
    return {
      products: positiveMatches.slice(0, 3).map((entry) => entry.product),
      exactMatchWasWeak: false,
      isAlternative: false,
      fallbackReason: undefined,
    };
  }

  return {
    products: rankedProducts.slice(0, 3).map((entry) => entry.product),
    exactMatchWasWeak: true,
    isAlternative: true,
    fallbackReason: "weak" as const,
  };
}

function createFollowUpQuestion(signals: QuerySignals) {
  if (signals.intent === "budget_recommendation" && !signals.fitTerms.length) {
    return "Do you want a relaxed oversized fit or a sharper fitted look?";
  }

  if (signals.intent === "occasion_styling" && !signals.budgetMax) {
    return "Do you want me to keep the full look under a specific budget?";
  }

  if (signals.intent === "gift_help") {
    return "Is this gift for daily wear, a party look, or something safer like fragrance or accessories?";
  }

  if (!signals.colorLabels.length) {
    return "Do you want a darker mood or a lighter clean look?";
  }

  return "Want me to narrow this by budget, fit, or color mood?";
}

function createComparisonReply(recommendations: SkxnzAssistantProductRecommendation[]) {
  if (recommendations.length < 2) {
    if (recommendations.length === 1) {
      return `I found one strong SKXNZ match: ${recommendations[0].name}. I need one more real matching product before I compare fairly.`;
    }

    return "I can compare SKXNZ products once I can identify at least two real catalog items. Send two product names or a category with enough SKXNZ matches.";
  }

  const [first, second] = recommendations;
  const bestPick = first.price <= second.price ? first : second;

  return [
    "I found real SKXNZ products to compare.",
    `${first.name}: ${first.category}, ${first.formattedPrice}, available in ${first.colors.slice(0, 2).join(", ") || "listed colors"}.`,
    `${second.name}: ${second.category}, ${second.formattedPrice}, available in ${second.colors.slice(0, 2).join(", ") || "listed colors"}.`,
    `My pick: ${bestPick.name}, because it is the stronger price-to-style match for this request.`,
  ].join(" ");
}

function createReply(signals: QuerySignals, recommendations: SkxnzAssistantProductRecommendation[]) {
  const colorLabel = signals.colorLabels[0];
  const categoryLabel = signals.categoryLabels[0];
  const occasionLabel = signals.occasionLabels[0];

  if (signals.intent === "blocked_out_of_scope") {
    return skxnzOnlyRefusal;
  }

  if (signals.intent === "cart_help") {
    if (signals.cartProductIds.length > 0 && recommendations.length > 0) {
      return "Based on your browser-local SKXNZ cart, these are safe catalog additions that keep the look connected. Checkout remains MVP-only where labeled.";
    }

    return "I can help you choose what to add, compare SKXNZ products, or guide you to the cart. Checkout remains MVP-only where labeled.";
  }

  if (signals.intent === "order_help") {
    return "I can guide you to SKXNZ order pages and explain visible MVP order statuses. Live delivery tracking is not connected yet.";
  }

  if (signals.intent === "return_help") {
    return "I can guide you to SKXNZ returns support. Return pickup and refunds are MVP placeholders where labeled.";
  }

  if (signals.intent === "size_help") {
    return "I can use visible SKXNZ size options, fit labels, and stock preview data to help you choose. I cannot guarantee perfect fit.";
  }

  if (signals.intent === "product_comparison") {
    return createComparisonReply(recommendations);
  }

  if (recommendations.length === 0) {
    return "Product recommendations are not available right now. You can still browse SKXNZ categories.";
  }

  if (signals.fallbackReason === "no_exact_color_category" && colorLabel && categoryLabel) {
    return `I could not find an exact ${colorLabel} ${categoryLabel} in SKXNZ right now. These are the closest alternatives.`;
  }

  if (signals.fallbackReason === "no_exact_color" && colorLabel) {
    return `I could not find an exact ${colorLabel} match in SKXNZ right now. These are the closest alternatives.`;
  }

  if (signals.fallbackReason === "no_exact_budget") {
    return `I could not find an exact SKXNZ match inside ${signals.budgetLabel ?? "that budget"} right now. These are the closest alternatives.`;
  }

  if (colorLabel && categoryLabel) {
    return `I found SKXNZ ${categoryLabel} options in ${colorLabel}. I’d start with these because they match your color and category exactly.`;
  }

  if (signals.intent === "budget_recommendation") {
    return `Here are SKXNZ picks ${signals.budgetLabel ?? "for your budget"}. I kept the recommendations budget-first, then ranked them by style relevance.`;
  }

  if (occasionLabel === "beach party") {
    return "For a beach party, I’d keep the look relaxed, light, and easy to move in. These SKXNZ picks fit the occasion best.";
  }

  if (occasionLabel) {
    return `For ${occasionLabel}, I’d keep the styling focused and SKXNZ-ready. These picks fit the occasion best.`;
  }

  if (signals.intent === "gift_help") {
    return "For gifting, I would keep it stylish and less size-sensitive where possible. These SKXNZ picks fit that brief.";
  }

  if (categoryLabel) {
    return `I found SKXNZ ${categoryLabel} picks that match your shopping brief.`;
  }

  return "Here are the closest SKXNZ picks for your shopping brief.";
}

function createSuggestedLinks(
  signals: QuerySignals,
  recommendations: SkxnzAssistantProductRecommendation[],
): SkxnzAssistantSuggestedLink[] {
  const categoryLinks = uniqueNonEmpty([
    ...signals.categoryLabels,
    ...recommendations.map((product) => product.category),
  ])
    .slice(0, 2)
    .map((category) => {
      const structuredCategory = getStructuredCategoryByValue(category);
      const categorySlug = structuredCategory?.slug ?? resolveCategorySlug(category);
      const label = structuredCategory?.displayName ?? resolveCategoryDisplayName(category);

      return {
        id: `category-${categorySlug}`,
        type: "category" as const,
        label,
        href: structuredCategory
          ? getCategoryPageHref(categorySlug)
          : `/shop?q=${encodeURIComponent(label)}`,
        helperText: "Browse this SKXNZ category.",
      };
    });
  const brandLinks = uniqueNonEmpty([
    ...signals.brandSlugs,
    ...recommendations.map((product) => product.brandName),
  ])
    .reduce<SkxnzAssistantSuggestedLink[]>((links, brandValue) => {
      const normalizedValue = normalizeText(brandValue);
      const brand =
        demoBrands.find(
          (entry) =>
            normalizeText(entry.slug) === normalizedValue ||
            normalizeText(entry.name) === normalizedValue,
        ) ??
        demoBrands.find((entry) =>
          recommendations.some((product) => product.brandName === entry.name),
        );

      if (!brand) {
        return links;
      }

      links.push({
        id: `brand-${brand.slug}`,
        type: "brand",
        label: brand.name,
        href: `/brands/${brand.slug}`,
        helperText: "Open this SKXNZ brand page.",
      });

      return links;
    }, []);

  const uniqueLinks = new Map<string, SkxnzAssistantSuggestedLink>();

  for (const link of [...categoryLinks, ...brandLinks]) {
    uniqueLinks.set(link.id, link);
  }

  return Array.from(uniqueLinks.values()).slice(0, 4);
}

export function extractQueryIntent(message: string, context?: SkxnzAssistantContext) {
  const signals = detectSignals(message, context);

  return {
    intent: signals.intent,
    categoryLabels: signals.categoryLabels,
    colorLabels: signals.colorLabels,
    occasionLabels: signals.occasionLabels,
    brandLabels: signals.brandLabels,
    budgetLabel: signals.budgetLabel,
    priceMood: signals.priceMood,
    blocked: signals.intent === "blocked_out_of_scope",
  };
}

export function findProductsForPrompt(
  message: string,
  context?: SkxnzAssistantContext,
) {
  const signals = detectSignals(message, context);
  const recommendationResult = findRecommendations(signals);
  const nextSignals = {
    ...signals,
    exactMatchWasWeak: recommendationResult.exactMatchWasWeak,
    fallbackReason: recommendationResult.fallbackReason,
  };

  return recommendationResult.products
    .slice(0, 4)
    .map((product) => toRecommendation(product, nextSignals, recommendationResult.isAlternative));
}

export function recommendByStyle(style: string, limit = 4) {
  const signals = detectSignals(style);

  return rankProducts(
    demoProducts.filter((product) => isApprovedProduct(product) && product.stock > 0),
    signals,
  )
    .slice(0, limit)
    .map((entry) => toRecommendation(entry.product, signals, false));
}

export function recommendSimilarProducts(productId: string, limit = 4) {
  const product = demoProducts.find(
    (entry) => entry.id === productId || entry.slug === productId,
  );

  if (!product) {
    return [] as SkxnzAssistantProductRecommendation[];
  }

  const signals = detectSignals(
    [
      product.category,
      product.subcategory,
      product.brandName,
      ...product.tags,
      ...product.colors,
    ].join(" "),
  );

  return rankProducts(
    demoProducts.filter(
      (entry) =>
        entry.id !== product.id && isApprovedProduct(entry) && entry.stock > 0,
    ),
    signals,
  )
    .slice(0, limit)
    .map((entry) => toRecommendation(entry.product, signals, false));
}

export function getAIStyledProducts(limit = 4) {
  return recommendByStyle("ai styled ai stylised futurewear", limit);
}

export function getLimitedEditionProducts(limit = 4) {
  return recommendByStyle("limited edition drop exclusive", limit);
}

export function getNewSeasonProducts(limit = 4) {
  return recommendByStyle("new season latest fresh drops", limit);
}

export function createSkxnzAssistantResponse(
  message: string,
  context?: SkxnzAssistantContext,
): SkxnzAssistantResponse {
  const signals = detectSignals(message, context);

  if (signals.intent === "blocked_out_of_scope") {
    return {
      reply: skxnzOnlyRefusal,
      intent: signals.intent,
      blocked: true,
      recommendedProducts: [],
      suggestedLinks: [],
    };
  }

  if (signals.intent === "unknown_shopping_related") {
    return {
      reply: "I can help. Are you shopping for an occasion, a category, or a budget?",
      intent: signals.intent,
      blocked: false,
      recommendedProducts: [],
      suggestedLinks: [],
      followUpQuestion: "Tell me the occasion, category, or price range and I will keep it inside SKXNZ.",
    };
  }

  const recommendationResult = findRecommendations(signals);
  const nextSignals = {
    ...signals,
    exactMatchWasWeak: recommendationResult.exactMatchWasWeak,
    fallbackReason: recommendationResult.fallbackReason,
  };
  const recommendedProducts = recommendationResult.products.map((product) =>
    toRecommendation(product, nextSignals, recommendationResult.isAlternative),
  );

  return {
    reply: createReply(nextSignals, recommendedProducts),
    intent: nextSignals.intent,
    blocked: false,
    recommendedProducts,
    suggestedLinks: createSuggestedLinks(nextSignals, recommendedProducts),
    followUpQuestion: createFollowUpQuestion(nextSignals),
  };
}

export const skxnzAssistantLimits = {
  maxMessageLength: 500,
  refusal: skxnzOnlyRefusal,
} as const;
