import {
  getAiPromptRule,
  outfitBuilderRules,
  type AiPromptRule,
} from "@/src/data/aiOperatingSystem";

function formatPromptRule(rule: AiPromptRule | null) {
  if (!rule) {
    return {
      systemRule: "Use only structured SKXNZ marketplace data.",
      mustUseDataFrom: "Structured product, brand, category, collection, and search data.",
      mustNeverDo: "Never invent products, partnerships, fit guarantees, or delivery promises.",
      outputStyle: "Clear, premium, concise.",
    };
  }

  return rule;
}

export function getBuyerAssistantPromptRule() {
  return formatPromptRule(getAiPromptRule("Buyer Assistant"));
}

export function getOutfitBuilderPromptRule() {
  return formatPromptRule(getAiPromptRule("Outfit Builder"));
}

export function getSellerValidationPromptRule() {
  return formatPromptRule(getAiPromptRule("Seller Validation"));
}

export function getTryOnPromptRule() {
  return formatPromptRule(getAiPromptRule("Try-On"));
}

export function buildPromptLibrarySnapshot() {
  return {
    buyerAssistant: getBuyerAssistantPromptRule(),
    outfitBuilder: getOutfitBuilderPromptRule(),
    sellerValidation: getSellerValidationPromptRule(),
    tryOn: getTryOnPromptRule(),
    outfitRules: outfitBuilderRules,
  };
}
