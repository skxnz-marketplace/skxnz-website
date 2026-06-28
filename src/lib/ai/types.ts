export type AiFeatureKey =
  | "buyer-assistant"
  | "outfit-builder"
  | "seller-product-check"
  | "try-on";

export type AiExecutionMode = "local-sheet-data" | "provider-ready";

export type AiUsageRecord = {
  id: string;
  feature: string;
  actorRole: "BUYER" | "SELLER" | "ADMIN" | "SYSTEM";
  actorId: string | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costEstimate: number;
  createdAt: string;
};

export type AiAuditRecord = {
  id: string;
  feature: string;
  actorType: "USER" | "SELLER" | "ADMIN" | "SYSTEM" | "AI";
  actorId: string | null;
  inputSummary: string;
  outputSummary: string;
  actionTaken: string;
  riskScore: number | null;
  createdAt: string;
};

export type BuyerAssistantRequest = {
  question: string;
  budget?: number | null;
  category?: string;
  stylePreference?: string;
  size?: string;
};

export type BuyerAssistantSuggestion = {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  category: string;
  price: number;
  image: string;
  stockStatus: string;
  availableSizes: string[];
  whyItMatches: string;
};

export type BuyerAssistantResponse = {
  mode: AiExecutionMode;
  answer: string;
  suggestions: BuyerAssistantSuggestion[];
  appliedSignals: string[];
  disclaimer: string;
};

export type OutfitBuilderRequest = {
  budget: number;
  occasion?: string;
  style?: string;
  size?: string;
  gender?: string;
  colorPreference?: string;
  query?: string;
};

export type OutfitBuilderItem = {
  slot: "topwear" | "bottomwear" | "footwear" | "accessory";
  id: string;
  slug: string;
  name: string;
  brandName: string;
  price: number;
  image: string;
};

export type OutfitBuilderOption = {
  id: string;
  title: string;
  items: OutfitBuilderItem[];
  totalPrice: number;
  withinBudget: boolean;
  explanation: string;
  sizeMatched: boolean;
};

export type OutfitBuilderResponse = {
  mode: AiExecutionMode;
  requestId: string;
  options: OutfitBuilderOption[];
  summary: string;
  disclaimer: string;
};

export type SellerProductCheckRequest = {
  name: string;
  category: string;
  price: number | null;
  salePrice?: number | null;
  sizes: string[];
  colors: string[];
  stock: number | null;
  fabric: string;
  fit: string;
  description: string;
  imageUrl: string;
  tags?: string[];
};

export type SellerProductCheckResponse = {
  mode: AiExecutionMode;
  publishReady: boolean;
  reviewState: "READY_FOR_ADMIN_REVIEW" | "NEEDS_SELLER_FIXES";
  missingFields: string[];
  warnings: string[];
  suggestedTags: string[];
  duplicateRisk: {
    level: "low" | "medium" | "high";
    matches: Array<{ id: string; name: string; slug: string }>;
  };
  adminReviewRequired: true;
  checklist: Array<{
    label: string;
    status: "pass" | "warn" | "fail";
    detail: string;
  }>;
  disclaimer: string;
};

export type TryOnJobResponse = {
  id: string;
  status: "CONSENT_REQUIRED" | "QUEUED";
  message: string;
  consentNotice: string;
  createdAt: string;
};
