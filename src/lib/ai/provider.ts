import type { AiExecutionMode } from "@/src/lib/ai/types";

export type AiProviderConfig = {
  mode: AiExecutionMode;
  provider: "local" | "openai";
  model: string;
  externalProviderConfigured: boolean;
};

export function getAiProviderConfig(): AiProviderConfig {
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase() === "openai" && hasOpenAiKey
    ? "openai"
    : "local";

  if (provider === "openai") {
    return {
      mode: "provider-ready",
      provider,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
      externalProviderConfigured: true,
    };
  }

  return {
    mode: "local-sheet-data",
    provider: "local",
    model: "skxnz-sheet-engine-v1",
    externalProviderConfigured: false,
  };
}
