import {
  createTryOnJobStub,
  runBuyerAssistantEngine,
  runOutfitBuilderEngine,
  runSellerProductCheckEngine,
} from "@/src/lib/ai/engines";
import { getAiProviderConfig } from "@/src/lib/ai/provider";
import {
  appendAiAuditLog,
  appendAiUsageLog,
  getOutfitResult,
  getTryOnJob,
  saveOutfitResult,
  saveTryOnJob,
} from "@/src/lib/ai/runtime-store";
import type {
  BuyerAssistantRequest,
  OutfitBuilderRequest,
  SellerProductCheckRequest,
} from "@/src/lib/ai/types";

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function estimateTokenCount(value: string) {
  return Math.max(12, Math.ceil(value.trim().length / 4));
}

function resolveActorRole(
  role: string | null,
  fallback: "BUYER" | "SELLER" | "ADMIN" | "SYSTEM",
) {
  if (role === "buyer") return "BUYER";
  if (role === "seller") return "SELLER";
  if (role === "admin") return "ADMIN";

  return fallback;
}

function recordAiUsage(params: {
  feature: string;
  actorRole: "BUYER" | "SELLER" | "ADMIN" | "SYSTEM";
  actorId: string | null;
  inputSummary: string;
  outputSummary: string;
}) {
  const provider = getAiProviderConfig();
  const inputTokens = estimateTokenCount(params.inputSummary);
  const outputTokens = estimateTokenCount(params.outputSummary);

  appendAiUsageLog({
    id: createId("usage"),
    feature: params.feature,
    actorRole: params.actorRole,
    actorId: params.actorId,
    model: provider.model,
    inputTokens,
    outputTokens,
    costEstimate: provider.mode === "provider-ready" ? 0.001 : 0,
    createdAt: new Date().toISOString(),
  });

  appendAiAuditLog({
    id: createId("audit"),
    feature: params.feature,
    actorType:
      params.actorRole === "SELLER"
        ? "SELLER"
        : params.actorRole === "ADMIN"
          ? "ADMIN"
          : params.actorRole === "BUYER"
            ? "USER"
            : "SYSTEM",
    actorId: params.actorId,
    inputSummary: params.inputSummary,
    outputSummary: params.outputSummary,
    actionTaken: `${params.feature} handled with structured SKXNZ data only.`,
    riskScore: 0.2,
    createdAt: new Date().toISOString(),
  });
}

export async function handleBuyerAssistantRequest(
  payload: BuyerAssistantRequest,
  actorId: string | null,
) {
  const response = runBuyerAssistantEngine(payload);

  recordAiUsage({
    feature: "Buyer AI Assistant",
    actorRole: resolveActorRole(actorId, "BUYER"),
    actorId,
    inputSummary: payload.question,
    outputSummary: response.answer,
  });

  return response;
}

export async function handleOutfitBuilderRequest(
  payload: OutfitBuilderRequest,
  actorId: string | null,
) {
  const response = runOutfitBuilderEngine(payload);

  saveOutfitResult({
    id: response.requestId,
    createdAt: new Date().toISOString(),
    summary: response.summary,
    options: response.options,
  });

  recordAiUsage({
    feature: "AI Outfit Builder",
    actorRole: resolveActorRole(actorId, "BUYER"),
    actorId,
    inputSummary: JSON.stringify(payload),
    outputSummary: response.summary,
  });

  return response;
}

export async function handleSellerProductCheckRequest(
  payload: SellerProductCheckRequest,
  actorId: string | null,
) {
  const response = runSellerProductCheckEngine(payload);

  recordAiUsage({
    feature: "Seller Product Validation",
    actorRole: resolveActorRole(actorId, "SELLER"),
    actorId,
    inputSummary: JSON.stringify({
      name: payload.name,
      category: payload.category,
      stock: payload.stock,
      imageProvided: Boolean(payload.imageUrl.trim()),
    }),
    outputSummary: `${response.reviewState} with ${response.missingFields.length} missing field(s).`,
  });

  return response;
}

export function getStoredOutfitResult(id: string) {
  return getOutfitResult(id);
}

export async function createTryOnJob(actorId: string | null) {
  const job = createTryOnJobStub();

  saveTryOnJob(job);
  recordAiUsage({
    feature: "Future Try-On",
    actorRole: actorId ? resolveActorRole(actorId, "BUYER") : "SYSTEM",
    actorId,
    inputSummary: "Try-on job requested.",
    outputSummary: job.message,
  });

  return job;
}

export function getStoredTryOnJob(id: string) {
  return getTryOnJob(id);
}
