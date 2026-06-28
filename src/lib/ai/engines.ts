import { structuredBrands } from "@/src/data/brands";
import { structuredCategories } from "@/src/data/categories";
import { structuredCollections } from "@/src/data/collections";
import {
  aiCatalogProducts,
  getAiProductSearchTerms,
  type AiCatalogProduct,
} from "@/src/lib/ai/catalog";
import {
  getAiDisclaimerCopy,
  getTryOnConsentCopy,
} from "@/src/lib/ai/safety";
import type {
  BuyerAssistantRequest,
  BuyerAssistantResponse,
  OutfitBuilderOption,
  OutfitBuilderRequest,
  OutfitBuilderResponse,
  SellerProductCheckRequest,
  SellerProductCheckResponse,
  TryOnJobResponse,
} from "@/src/lib/ai/types";
import { normalizeCatalogValue, uniqueNonEmpty } from "@/src/lib/catalog-content";

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeSearch(value: string) {
  return normalizeCatalogValue(value);
}

function tokenize(value: string) {
  return normalizeSearch(value).split(" ").filter(Boolean);
}

function computeMatchScore(query: string, searchableValues: string[]) {
  if (!query) {
    return 0;
  }

  const normalizedQuery = normalizeSearch(query);
  const queryTokens = tokenize(normalizedQuery);
  let score = 0;

  for (const candidateValue of searchableValues) {
    const candidate = normalizeSearch(candidateValue);

    if (!candidate) {
      continue;
    }

    if (candidate === normalizedQuery) {
      score = Math.max(score, 110);
      continue;
    }

    if (candidate.startsWith(normalizedQuery)) {
      score = Math.max(score, 88);
      continue;
    }

    if (candidate.includes(normalizedQuery)) {
      score = Math.max(score, 66);
      continue;
    }

    if (queryTokens.every((token) => candidate.includes(token))) {
      score = Math.max(score, 48);
    }
  }

  return score;
}

function parseBudgetFromText(value: string) {
  const underMatch = value.match(/under\s*₹?\s*([0-9]+)/i);

  if (underMatch) {
    return Number(underMatch[1]);
  }

  const rangeMatch = value.match(/₹?\s*([0-9]+)\s*-\s*₹?\s*([0-9]+)/i);

  if (rangeMatch) {
    return Number(rangeMatch[2]);
  }

  return null;
}

function findMatchedBrands(query: string) {
  return structuredBrands.filter((brand) => {
    const searchableValues = [
      brand.name,
      brand.slug,
      brand.tagline,
      brand.shortDescription,
      ...brand.searchKeywords,
      ...brand.categories,
    ];

    return computeMatchScore(query, searchableValues) > 0;
  });
}

function findMatchedCategories(query: string) {
  return structuredCategories.filter((category) => {
    const searchableValues = [
      category.name,
      category.displayName,
      category.slug,
      category.description,
      ...category.searchKeywords,
    ];

    return computeMatchScore(query, searchableValues) > 0;
  });
}

function findMatchedCollections(query: string) {
  return structuredCollections.filter((collection) => {
    const searchableValues = [
      collection.name,
      collection.slug,
      collection.description,
      ...collection.searchKeywords,
    ];

    return computeMatchScore(query, searchableValues) > 0;
  });
}

function filterProductsBySignals({
  query,
  budget,
  category,
  stylePreference,
  size,
}: {
  query: string;
  budget: number | null;
  category?: string;
  stylePreference?: string;
  size?: string;
}) {
  return aiCatalogProducts
    .map((product) => {
      let score = computeMatchScore(query, getAiProductSearchTerms(product));

      if (budget !== null && product.effectivePrice <= budget) {
        score += 10;
      }

      if (category && normalizeSearch(product.category) === normalizeSearch(category)) {
        score += 18;
      }

      if (
        size &&
        product.sizes.some((entry) => normalizeSearch(entry) === normalizeSearch(size))
      ) {
        score += 14;
      }

      if (
        stylePreference &&
        computeMatchScore(stylePreference, [
          ...(product.metadata?.styleTags ?? []),
          ...product.tags,
          product.shortDescription,
        ]) > 0
      ) {
        score += 12;
      }

      return { product, score };
    })
    .filter(({ product, score }) => {
      if (budget !== null && product.effectivePrice > budget) {
        return false;
      }

      if (
        size &&
        !product.sizes.some((entry) => normalizeSearch(entry) === normalizeSearch(size))
      ) {
        return false;
      }

      return score > 0 && product.stockQuantity > 0;
    })
    .sort((left, right) => right.score - left.score)
    .map(({ product }) => product);
}

function buildWhyItMatches(
  product: AiCatalogProduct,
  {
    budget,
    category,
    size,
    stylePreference,
  }: {
    budget: number | null;
    category?: string;
    size?: string;
    stylePreference?: string;
  },
) {
  const notes = [];

  if (category && normalizeSearch(product.category) === normalizeSearch(category)) {
    notes.push(`matches the ${category} category`);
  }

  if (size && product.sizes.some((entry) => normalizeSearch(entry) === normalizeSearch(size))) {
    notes.push(`${size.toUpperCase()} is available`);
  }

  if (budget !== null && product.effectivePrice <= budget) {
    notes.push(`stays within ₹${budget.toLocaleString("en-IN")}`);
  }

  if (
    stylePreference &&
    computeMatchScore(stylePreference, [
      ...(product.metadata?.styleTags ?? []),
      ...product.tags,
      product.shortDescription,
    ]) > 0
  ) {
    notes.push("fits the styling direction you asked for");
  }

  if (notes.length === 0) {
    notes.push("matches the strongest product signal in the current SKXNZ catalogue");
  }

  return notes.join(", ");
}

export function runBuyerAssistantEngine(
  request: BuyerAssistantRequest,
): BuyerAssistantResponse {
  const question = normalizeText(request.question);
  const normalizedQuestion = normalizeSearch(question);
  const derivedBudget = request.budget ?? parseBudgetFromText(question);
  const matchedProducts = filterProductsBySignals({
    query: question,
    budget: derivedBudget,
    category: request.category,
    stylePreference: request.stylePreference,
    size: request.size,
  }).slice(0, 6);

  const matchedBrands = findMatchedBrands(question);
  const matchedCategories = findMatchedCategories(question);
  const matchedCollections = findMatchedCollections(question);

  const appliedSignals = uniqueNonEmpty([
    derivedBudget !== null ? `Budget under ₹${derivedBudget.toLocaleString("en-IN")}` : null,
    request.category ? `Category: ${request.category}` : null,
    request.stylePreference ? `Style: ${request.stylePreference}` : null,
    request.size ? `Size: ${request.size}` : null,
    matchedBrands[0]?.name ? `Brand: ${matchedBrands[0].name}` : null,
    matchedCategories[0]?.displayName
      ? `Category match: ${matchedCategories[0].displayName}`
      : null,
    matchedCollections[0]?.name ? `Collection: ${matchedCollections[0].name}` : null,
  ]);

  if (matchedProducts.length === 0) {
    const noMatchAnswer = /lv|gucci|louis vuitton/.test(normalizedQuestion)
      ? "No signal found for that label inside the current SKXNZ catalogue. The marketplace only recommends products that exist in structured SKXNZ data."
      : "No signal found. Try another brand, category, or product.";

    return {
      mode: "local-sheet-data",
      answer: noMatchAnswer,
      suggestions: [],
      appliedSignals,
      disclaimer: getAiDisclaimerCopy(),
    };
  }

  const answerParts = [
    `I found ${matchedProducts.length} catalogue match${matchedProducts.length === 1 ? "" : "es"} inside the current SKXNZ data.`,
  ];

  if (matchedCollections[0]) {
    answerParts.push(
      `${matchedCollections[0].name} is the closest collection signal for this request.`,
    );
  }

  if (matchedBrands[0] && matchedBrands[0].name !== "SKXNZ") {
    answerParts.push(`The strongest brand match is ${matchedBrands[0].name}.`);
  }

  if (request.size) {
    answerParts.push("Only products with the requested size are included below.");
  }

  return {
    mode: "local-sheet-data",
    answer: answerParts.join(" "),
    suggestions: matchedProducts.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brandName: product.brandName,
      category: product.category,
      price: product.effectivePrice,
      image: product.image,
      stockStatus: product.stockStatus,
      availableSizes: product.sizes,
      whyItMatches: buildWhyItMatches(product, {
        budget: derivedBudget,
        category: request.category,
        size: request.size,
        stylePreference: request.stylePreference,
      }),
    })),
    appliedSignals,
    disclaimer: getAiDisclaimerCopy(),
  };
}

function getOutfitSlot(product: AiCatalogProduct): OutfitBuilderOption["items"][number]["slot"] | null {
  const itemType = normalizeSearch(product.metadata?.itemType ?? product.subcategory);

  if (
    ["t-shirts", "tops", "shirts", "hoodies", "jackets", "vests"].some((entry) =>
      itemType.includes(normalizeSearch(entry)),
    )
  ) {
    return "topwear";
  }

  if (["pants", "bottoms", "cargo", "jeans"].some((entry) => itemType.includes(entry))) {
    return "bottomwear";
  }

  if (["sneakers", "footwear", "shoes"].some((entry) => itemType.includes(entry))) {
    return "footwear";
  }

  if (["fragrance", "bags", "bracelets", "accessory", "eyewear"].some((entry) => itemType.includes(entry))) {
    return "accessory";
  }

  return null;
}

function getPreferredAnchorSlots(request: OutfitBuilderRequest) {
  const requestSignal = normalizeSearch(
    uniqueNonEmpty([
      request.query,
      request.style,
      request.occasion,
      request.colorPreference,
    ]).join(" "),
  );

  if (/perfume|fragrance|scent/.test(requestSignal)) {
    return ["accessory", "topwear", "bottomwear", "footwear"] as const;
  }

  if (/shoe|shoes|sneaker|sneakers|footwear/.test(requestSignal)) {
    return ["footwear", "topwear", "bottomwear", "accessory"] as const;
  }

  if (/accessory|bag|bags|jewellery|bracelet|eyewear|sunglasses/.test(requestSignal)) {
    return ["accessory", "topwear", "bottomwear", "footwear"] as const;
  }

  if (/pant|pants|cargo|bottomwear|jeans/.test(requestSignal)) {
    return ["bottomwear", "topwear", "footwear", "accessory"] as const;
  }

  return ["topwear", "bottomwear", "footwear", "accessory"] as const;
}

function matchesGender(product: AiCatalogProduct, gender?: string) {
  if (!gender) {
    return true;
  }

  const normalizedGender = normalizeSearch(gender);
  const normalizedProductGender = normalizeSearch(product.gender);

  return (
    normalizedProductGender === "unisex" ||
    normalizedGender === "unisex" ||
    normalizedProductGender.includes(normalizedGender) ||
    normalizedGender.includes(normalizedProductGender)
  );
}

function matchesSize(product: AiCatalogProduct, size?: string) {
  if (!size) {
    return true;
  }

  return product.sizes.some((entry) => normalizeSearch(entry) === normalizeSearch(size));
}

function scoreOutfitCandidate(
  product: AiCatalogProduct,
  request: OutfitBuilderRequest,
  slot: NonNullable<ReturnType<typeof getOutfitSlot>>,
) {
  let score = 0;
  const query = uniqueNonEmpty([
    request.query,
    request.style,
    request.occasion,
    request.colorPreference,
  ]).join(" ");

  score += computeMatchScore(query, [
    ...getAiProductSearchTerms(product),
    ...(product.metadata?.styleTags ?? []),
    ...(product.metadata?.occasionTags ?? []),
  ]);

  if (product.effectivePrice <= request.budget) {
    score += 12;
  }

  if (matchesSize(product, request.size)) {
    score += 10;
  }

  if (matchesGender(product, request.gender)) {
    score += 8;
  }

  if (
    request.colorPreference &&
    computeMatchScore(request.colorPreference, [
      ...product.colors,
      ...(product.metadata?.colorFamily ?? []),
    ]) > 0
  ) {
    score += 12;
  }

  if (slot === "accessory" && /perfume|fragrance/.test(normalizeSearch(request.query ?? ""))) {
    score += 16;
  }

  return score;
}

function buildOutfitExplanation(optionTitle: string, items: AiCatalogProduct[], request: OutfitBuilderRequest) {
  const itemNames = items.map((item) => item.name).join(", ");
  const signals = uniqueNonEmpty([
    request.style ? `${request.style.toLowerCase()} styling` : null,
    request.occasion ? `${request.occasion.toLowerCase()} context` : null,
    request.colorPreference ? `${request.colorPreference.toLowerCase()} palette` : null,
  ]);

  if (signals.length === 0) {
    return `${optionTitle} keeps the outfit clean by combining ${itemNames} from the current SKXNZ catalogue.`;
  }

  return `${optionTitle} works because ${itemNames} stay aligned with ${signals.join(", ")} while respecting the selected budget and available stock.`;
}

export function runOutfitBuilderEngine(
  request: OutfitBuilderRequest,
): OutfitBuilderResponse {
  const eligibleProducts = aiCatalogProducts.filter(
    (product) =>
      product.stockQuantity > 0 &&
      product.effectivePrice <= request.budget &&
      matchesGender(product, request.gender) &&
      matchesSize(product, request.size),
  );

  const bySlot: Record<"topwear" | "bottomwear" | "footwear" | "accessory", AiCatalogProduct[]> = {
    topwear: [],
    bottomwear: [],
    footwear: [],
    accessory: [],
  };

  for (const product of eligibleProducts) {
    const slot = getOutfitSlot(product);

    if (!slot) {
      continue;
    }

    bySlot[slot].push(product);
  }

  for (const slot of Object.keys(bySlot) as Array<keyof typeof bySlot>) {
    bySlot[slot].sort(
      (left, right) =>
        scoreOutfitCandidate(right, request, slot) -
        scoreOutfitCandidate(left, request, slot),
    );
  }

  const preferredAnchorSlots = getPreferredAnchorSlots(request);
  const anchorSlot =
    preferredAnchorSlots.find((slot) => bySlot[slot].length > 0) ?? "topwear";
  const anchorCandidates = bySlot[anchorSlot].slice(0, 4);
  const options: OutfitBuilderOption[] = [];
  const optionTitles = ["Signal Base", "After Hours Edit", "Quiet Luxury Stack"];

  for (const [index, anchorItem] of anchorCandidates.entries()) {
    const chosenItems = [anchorItem];
    let runningTotal = anchorItem.effectivePrice;

    for (const slot of preferredAnchorSlots) {
      if (slot === anchorSlot) {
        continue;
      }

      const nextItem = bySlot[slot].find((candidate) => {
        if (chosenItems.some((item) => item.id === candidate.id)) {
          return false;
        }

        return runningTotal + candidate.effectivePrice <= request.budget;
      });

      if (nextItem) {
        chosenItems.push(nextItem);
        runningTotal += nextItem.effectivePrice;
      }
    }

    const optionId = createId("outfit");
    options.push({
      id: optionId,
      title: optionTitles[index] ?? `Option ${index + 1}`,
      items: chosenItems.map((item) => ({
        slot: getOutfitSlot(item) ?? "accessory",
        id: item.id,
        slug: item.slug,
        name: item.name,
        brandName: item.brandName,
        price: item.effectivePrice,
        image: item.image,
      })),
      totalPrice: runningTotal,
      withinBudget: runningTotal <= request.budget,
      explanation: buildOutfitExplanation(optionTitles[index] ?? `Option ${index + 1}`, chosenItems, request),
      sizeMatched: request.size ? chosenItems.every((item) => matchesSize(item, request.size)) : true,
    });
  }

  const dedupedOptions = options
    .filter((option, index, collection) =>
      collection.findIndex((entry) =>
        entry.items.map((item) => item.id).join("|") === option.items.map((item) => item.id).join("|"),
      ) === index,
    )
    .slice(0, 3);

  const summary =
    dedupedOptions.length > 0
      ? `Built ${dedupedOptions.length} outfit option${dedupedOptions.length === 1 ? "" : "s"} from in-stock SKXNZ products only.`
      : "No complete signal found inside the current budget, size, and stock constraints.";

  return {
    mode: "local-sheet-data",
    requestId: createId("outfit_request"),
    options: dedupedOptions,
    summary,
    disclaimer: getAiDisclaimerCopy(),
  };
}

function normalizeSellerTags(tags: string[] | undefined, payload: SellerProductCheckRequest) {
  const providedTags = tags?.map((entry) => normalizeText(entry)).filter(Boolean) ?? [];

  if (providedTags.length > 0) {
    return providedTags;
  }

  return uniqueNonEmpty([
    payload.category,
    payload.fit,
    ...payload.colors,
    ...tokenize(payload.name)
      .filter((token) => token.length > 2)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1)),
  ]);
}

export function runSellerProductCheckEngine(
  payload: SellerProductCheckRequest,
): SellerProductCheckResponse {
  const missingFields = [];

  if (!payload.name.trim()) missingFields.push("Product name");
  if (!payload.category.trim()) missingFields.push("Category");
  if (!payload.price || payload.price <= 0) missingFields.push("Valid price");
  if (!payload.sizes.length) missingFields.push("Sizes");
  if (!payload.colors.length) missingFields.push("Colors");
  if (payload.stock === null || payload.stock === undefined || payload.stock < 0) {
    missingFields.push("Stock");
  }
  if (!payload.fabric.trim()) missingFields.push("Fabric");
  if (!payload.fit.trim()) missingFields.push("Fit");
  if (!payload.description.trim()) missingFields.push("Description");
  if (!payload.imageUrl.trim()) missingFields.push("Product image");

  const validCategory = structuredCategories.some((category) => {
    const candidates = [category.name, category.displayName, category.slug];

    return candidates.some(
      (entry) => normalizeSearch(entry) === normalizeSearch(payload.category),
    );
  });

  const normalizedName = normalizeSearch(payload.name);
  const duplicateMatches = aiCatalogProducts
    .filter((product) => {
      const productName = normalizeSearch(product.name);

      return (
        productName === normalizedName ||
        productName.includes(normalizedName) ||
        normalizedName.includes(productName)
      );
    })
    .slice(0, 3)
    .map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
    }));

  const suggestedTags = normalizeSellerTags(payload.tags, payload).slice(0, 8);
  const warnings = uniqueNonEmpty([
    validCategory ? null : "Category is not aligned with the current structured SKXNZ taxonomy.",
    payload.tags && payload.tags.length > 0
      ? null
      : "No explicit seller tags were provided, so the AI suggested tags from the draft copy.",
    duplicateMatches.length > 0
      ? "Duplicate risk detected against existing catalogue products. Keep this in admin review."
      : null,
    payload.stock !== null && payload.stock <= 0
      ? "Stock is zero, so the product should not be treated as buyer-ready."
      : null,
  ]);

  const publishReady =
    missingFields.length === 0 && validCategory && payload.stock !== null && payload.stock > 0;
  const duplicateRiskLevel =
    duplicateMatches.length >= 2 ? "high" : duplicateMatches.length === 1 ? "medium" : "low";

  return {
    mode: "local-sheet-data",
    publishReady,
    reviewState: publishReady ? "READY_FOR_ADMIN_REVIEW" : "NEEDS_SELLER_FIXES",
    missingFields,
    warnings,
    suggestedTags,
    duplicateRisk: {
      level: duplicateRiskLevel,
      matches: duplicateMatches,
    },
    adminReviewRequired: true,
    checklist: [
      {
        label: "Required fields",
        status: missingFields.length === 0 ? "pass" : "fail",
        detail:
          missingFields.length === 0
            ? "Core product fields are present."
            : `Missing: ${missingFields.join(", ")}.`,
      },
      {
        label: "Category mapping",
        status: validCategory ? "pass" : "warn",
        detail: validCategory
          ? "Category maps to the current SKXNZ taxonomy."
          : "Category needs review or re-mapping before admin approval.",
      },
      {
        label: "Tags and discovery",
        status: suggestedTags.length >= 3 ? "pass" : "warn",
        detail: `Suggested tags: ${suggestedTags.join(", ")}.`,
      },
      {
        label: "Image presence",
        status: payload.imageUrl.trim() ? "pass" : "fail",
        detail: payload.imageUrl.trim()
          ? "Image reference is present for admin review."
          : "Image reference is missing.",
      },
      {
        label: "Variant completeness",
        status:
          payload.sizes.length > 0 && payload.colors.length > 0 && (payload.stock ?? 0) > 0
            ? "pass"
            : "warn",
        detail:
          payload.sizes.length > 0 && payload.colors.length > 0
            ? "Sizes and colors are present for variant planning."
            : "Add sizes and colors before admin review.",
      },
      {
        label: "Duplicate risk",
        status: duplicateRiskLevel === "high" ? "warn" : "pass",
        detail:
          duplicateMatches.length > 0
            ? `Potential match: ${duplicateMatches.map((match) => match.name).join(", ")}.`
            : "No close duplicate detected in the current structured catalogue.",
      },
      {
        label: "Publish readiness",
        status: publishReady ? "pass" : "warn",
        detail: publishReady
          ? "This draft can move into admin review, but it still must not auto-publish."
          : "Fix the blocking items before sending this draft for admin review.",
      },
    ],
    disclaimer:
      "Validation is an SKXNZ AI readiness check only. Seller uploads still require admin review before going live.",
  };
}

export function createTryOnJobStub(): TryOnJobResponse {
  return {
    id: createId("try_on"),
    status: "CONSENT_REQUIRED",
    message: "Future try-on is not active yet. The job route is reserved until consent, storage, and deletion policies are live.",
    consentNotice: getTryOnConsentCopy(),
    createdAt: new Date().toISOString(),
  };
}
