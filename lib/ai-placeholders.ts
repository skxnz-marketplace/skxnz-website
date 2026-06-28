import { getProductById, products } from "@/lib/data/products";

export const AI_DISCLAIMER =
  "AI suggestions are for discovery and styling guidance only. Real fit, fabric fall, and color may vary.";

export type ProductTitleInput = {
  productType: string;
  color: string;
  fabric: string;
  style: string;
  targetBuyer: string;
};

export type ProductDescriptionInput = {
  productName: string;
  category: string;
  fabric: string;
  fit: string;
  color: string;
  styleNotes: string;
};

export type ProductDescriptionOutput = {
  shortDescription: string;
  highlights: string[];
  careNote: string;
};

export type ProductVideoPromptInput = {
  productType: string;
  color: string;
  mood: string;
  background: string;
  modelStyle: string;
};

export type StylistInput = {
  gender: string;
  occasion: string;
  colorPreference: string;
  stylePreference: string;
};

export type StylistRecommendation = {
  title: string;
  productIds: string[];
  reason: string;
  palette: string;
};

type OutfitTemplate = {
  title: string;
  productIds: string[];
  palette: string;
  baseReason: string;
  occasions: string[];
  styles: string[];
  colors: string[];
};

const titleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const normalizeText = (value: string, fallback: string) => {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : fallback;
};

const matchKeyword = (value: string, keywords: string[]) => {
  const normalized = value.toLowerCase();

  return keywords.some((keyword) => normalized.includes(keyword));
};

const pickStyleTokens = (style: string) => {
  const normalized = style.toLowerCase();

  if (matchKeyword(normalized, ["technical", "utility", "modular"])) {
    return ["Vector", "Signal", "Module"];
  }

  if (matchKeyword(normalized, ["minimal", "clean", "tailored"])) {
    return ["Neutra", "Core", "Line"];
  }

  if (matchKeyword(normalized, ["chrome", "statement", "editorial"])) {
    return ["Chrome", "Afterglow", "Nova"];
  }

  if (matchKeyword(normalized, ["street", "youth", "gen z", "campus"])) {
    return ["Motion", "Axis", "Shift"];
  }

  return ["Signal", "Vector", "Nova"];
};

const pickBuyerToken = (buyer: string) => {
  const normalized = buyer.toLowerCase();

  if (matchKeyword(normalized, ["night", "party", "after dark", "evening"])) {
    return "Afterdark";
  }

  if (matchKeyword(normalized, ["creative", "content", "studio"])) {
    return "Studio";
  }

  if (matchKeyword(normalized, ["collector", "luxury", "premium"])) {
    return "Edition";
  }

  if (matchKeyword(normalized, ["early adopter", "beta", "future"])) {
    return "Future";
  }

  return "Signal";
};

const pickColorToken = (color: string) => {
  const normalized = color.toLowerCase();

  if (normalized.includes("obsidian")) {
    return "Obsidian";
  }

  if (normalized.includes("midnight")) {
    return "Midnight";
  }

  if (normalized.includes("teal")) {
    return "Teal";
  }

  if (normalized.includes("ultraviolet")) {
    return "Ultraviolet";
  }

  if (normalized.includes("sangria")) {
    return "Sangria";
  }

  if (matchKeyword(normalized, ["silver", "chrome"])) {
    return "Chrome";
  }

  if (normalized.includes("pearl") || normalized.includes("white")) {
    return "Pearl";
  }

  return titleCase(normalizeText(color, "Signal").split(/\s+/)[0] ?? "Signal");
};

const pickFabricToken = (fabric: string) => {
  const normalized = fabric.toLowerCase();

  if (normalized.includes("nylon")) {
    return "Nylon";
  }

  if (normalized.includes("mesh")) {
    return "Mesh";
  }

  if (normalized.includes("cotton")) {
    return "Cotton";
  }

  if (normalized.includes("fleece")) {
    return "Fleece";
  }

  if (normalized.includes("twill")) {
    return "Twill";
  }

  if (normalized.includes("denim")) {
    return "Denim";
  }

  if (normalized.includes("jersey")) {
    return "Jersey";
  }

  return titleCase(normalizeText(fabric, "Weave").split(/\s+/).at(-1) ?? "Weave");
};

const ensureUniqueTitles = (titles: string[]) => {
  const seen = new Set<string>();

  return titles.map((title, index) => {
    if (!seen.has(title)) {
      seen.add(title);

      return title;
    }

    const nextTitle = `${title} ${index + 1}`;

    seen.add(nextTitle);

    return nextTitle;
  });
};

export function generateProductTitles(input: ProductTitleInput) {
  const productType = titleCase(normalizeText(input.productType, "Jacket"));
  const colorToken = pickColorToken(input.color);
  const fabricToken = pickFabricToken(input.fabric);
  const styleTokens = pickStyleTokens(input.style);
  const buyerToken = pickBuyerToken(input.targetBuyer);

  return ensureUniqueTitles([
    `${styleTokens[0]} ${productType}`,
    `${colorToken} ${styleTokens[1]} ${productType}`,
    `${buyerToken} ${fabricToken} ${productType}`,
    `${fabricToken} ${styleTokens[2]} ${productType}`,
    `${colorToken} ${buyerToken} ${productType}`,
  ]);
}

export function generateProductDescription(
  input: ProductDescriptionInput,
): ProductDescriptionOutput {
  const productName = normalizeText(input.productName, "Signal Layer");
  const category = normalizeText(input.category, "outerwear").toLowerCase();
  const fabric = normalizeText(input.fabric, "premium technical fabric");
  const fit = normalizeText(input.fit, "relaxed");
  const color = normalizeText(input.color, "obsidian black");
  const styleNotes = normalizeText(
    input.styleNotes,
    "clean linework and sharp futurewear layering",
  );

  return {
    shortDescription: `${productName} is a ${fit.toLowerCase()} ${category} shaped in ${fabric.toLowerCase()} and finished in ${color.toLowerCase()} for a sharp SKXNZ silhouette with ${styleNotes.toLowerCase()}.`,
    highlights: [
      `${titleCase(fit)} fit built to layer cleanly across premium everyday looks.`,
      `${fabric} construction that keeps the hand feel elevated and the shape controlled.`,
      `${titleCase(color)} finish with ${styleNotes.toLowerCase()} for a clear futurewear signal.`,
    ],
    careNote:
      "Cold wash inside out, low heat or hang dry, and confirm final care guidance against the production fabric blend before launch.",
  };
}

export function generateVideoPrompt(input: ProductVideoPromptInput) {
  const productType = normalizeText(input.productType, "jacket").toLowerCase();
  const color = normalizeText(input.color, "obsidian black").toLowerCase();
  const mood = normalizeText(input.mood, "nocturnal and premium").toLowerCase();
  const background = normalizeText(
    input.background,
    "an obsidian studio with soft chrome reflections",
  ).toLowerCase();
  const modelStyle = normalizeText(
    input.modelStyle,
    "a sharp futurewear model",
  ).toLowerCase();

  return `Create a 4-second product video of a ${color} ${productType} with ${mood} energy in ${background}. Use ${modelStyle}, open on a close texture detail, transition into a half-turn silhouette reveal, and end on a clean hero frame that keeps the garment centered, premium, and fully legible.`;
}

const outfitTemplates: OutfitTemplate[] = [
  {
    title: "After Dark Signal",
    productIds: [
      "pearl-signal-crop-jacket",
      "signal-layered-shirt",
      "pearl-white-sneakers",
    ],
    palette: "Liquid Silver, Pearl White, Midnight Navy",
    baseReason:
      "A sharper night-out stack that keeps structure high and visual noise controlled.",
    occasions: ["night", "party", "event", "dinner", "launch"],
    styles: ["futuristic", "statement", "sharp", "editorial", "technical"],
    colors: ["silver", "white", "midnight", "obsidian"],
  },
  {
    title: "Studio Utility",
    productIds: [
      "chrome-trace-hoodie",
      "midnight-cargo-pants",
      "future-runner-crossbody",
    ],
    palette: "Obsidian Black, Midnight Navy, Ultraviolet Bronze",
    baseReason:
      "Built for longer days, movement, and a clean creative uniform with utility depth.",
    occasions: ["travel", "campus", "work", "studio", "day"],
    styles: ["minimal", "utility", "clean", "technical"],
    colors: ["obsidian", "midnight", "ultraviolet", "black", "navy"],
  },
  {
    title: "Clean Motion",
    productIds: [
      "obsidian-signal-oversized-tee",
      "midnight-cargo-pants",
      "pearl-white-sneakers",
    ],
    palette: "Sonic Sangria, Midnight Navy, Pearl White",
    baseReason:
      "A lighter outfit direction with enough energy to feel current without losing polish.",
    occasions: ["casual", "day", "college", "city", "weekend"],
    styles: ["street", "youth", "casual", "athleisure", "gen z"],
    colors: ["sangria", "white", "midnight", "navy"],
  },
  {
    title: "Chrome Minimal",
    productIds: [
      "obsidian-rider-vest",
      "signal-layered-shirt",
      "chrome-district-bracelet",
    ],
    palette: "Liquid Silver, Pearl White, Obsidian Black",
    baseReason:
      "A controlled layered look that stays clean, directional, and easy to style.",
    occasions: ["gallery", "coffee", "creative", "studio", "day"],
    styles: ["minimal", "clean", "tailored", "lightweight"],
    colors: ["silver", "white", "obsidian", "black"],
  },
  {
    title: "Off-Duty Vector",
    productIds: [
      "chrome-trace-hoodie",
      "pearl-white-sneakers",
      "future-runner-crossbody",
    ],
    palette: "Obsidian Black, Pearl White, Liquid Silver",
    baseReason:
      "A relaxed futurewear uniform with comfort at the core and one crisp accessory accent.",
    occasions: ["travel", "off duty", "airport", "weekend", "casual"],
    styles: ["comfort", "street", "minimal", "relaxed"],
    colors: ["obsidian", "white", "silver", "black"],
  },
];

const genderFrame = (gender: string) => {
  const normalized = gender.toLowerCase();

  if (normalized.includes("women")) {
    return "The silhouette direction leans clean and adaptable for womenswear-led styling.";
  }

  if (normalized.includes("men")) {
    return "The silhouette direction stays grounded and adaptable for menswear-led styling.";
  }

  return "The silhouette direction stays open-ended and easy to adapt across unisex styling.";
};

const scoreOutfit = (template: OutfitTemplate, input: StylistInput) => {
  let score = 0;

  if (matchKeyword(input.occasion, template.occasions)) {
    score += 3;
  }

  if (matchKeyword(input.stylePreference, template.styles)) {
    score += 3;
  }

  if (matchKeyword(input.colorPreference, template.colors)) {
    score += 2;
  }

  for (const productId of template.productIds) {
    const product = getProductById(productId);

    if (!product) {
      continue;
    }

    if (
      matchKeyword(
        `${product.colors.join(" ")} ${product.accent} ${product.category}`,
        input.colorPreference
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean),
      )
    ) {
      score += 1;
    }

    if (
      matchKeyword(
        `${product.subtitle} ${product.launchNote} ${product.category}`,
        input.stylePreference
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean),
      )
    ) {
      score += 1;
    }
  }

  return score;
};

export function generateStylistRecommendations(input: StylistInput) {
  const occasion = normalizeText(input.occasion, "private launch event");
  const stylePreference = normalizeText(
    input.stylePreference,
    "clean technical futurewear",
  );
  const colorPreference = normalizeText(input.colorPreference, "obsidian black");

  return [...outfitTemplates]
    .sort((left, right) => scoreOutfit(right, input) - scoreOutfit(left, input))
    .slice(0, 3)
    .map((template) => ({
      title: template.title,
      productIds: template.productIds,
      palette: template.palette,
      reason: `${template.baseReason} Recommended for ${occasion.toLowerCase()} with ${stylePreference.toLowerCase()} energy and a ${colorPreference.toLowerCase()} leaning palette. ${genderFrame(input.gender)}`,
    }));
}

export const stylistCatalog = products;
