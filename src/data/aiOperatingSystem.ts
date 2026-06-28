import aiArchitecture from "@/project-data/processed/ai-architecture.json";

export type AiModuleDefinition = {
  id: string;
  feature: string;
  userType: string;
  purpose: string;
  launchPhase: string;
  needsBackend: string;
  needsImageAi: string;
  needsAdminReview: string;
  status: string;
};

export type AiRouteDefinition = {
  route: string;
  method: string;
  feature: string;
  userType: string;
  purpose: string;
  launchPhase: string;
  status: string;
};

export type AiPromptRule = {
  promptArea: string;
  systemRule: string;
  mustUseDataFrom: string;
  mustNeverDo: string;
  outputStyle: string;
  status: string;
};

export type OutfitBuilderRule = {
  ruleId: string;
  rule: string;
  priority: string;
  dataNeeded: string;
  example: string;
  status: string;
};

export type AiDataSourceDefinition = {
  dataSource: string;
  usedBy: string;
  accessLevel: string;
  examples: string;
  privacyLevel: string;
  notes: string;
};

export type AiTableDefinition = {
  table: string;
  purpose: string;
  keyColumns: string;
  usedBy: string;
  launchPhase: string;
  status: string;
};

export const aiModules = aiArchitecture.ai_modules as AiModuleDefinition[];
export const aiRoutes = aiArchitecture.ai_routes as AiRouteDefinition[];
export const aiPromptRules = aiArchitecture.ai_prompt_rules as AiPromptRule[];
export const outfitBuilderRules =
  aiArchitecture.outfit_builder_rules as OutfitBuilderRule[];
export const aiDataSources = aiArchitecture.ai_data_sources as AiDataSourceDefinition[];
export const aiTables = aiArchitecture.ai_tables as AiTableDefinition[];

export function getAiPromptRule(promptArea: string) {
  return aiPromptRules.find((rule) => rule.promptArea === promptArea) ?? null;
}

export function getAiModule(feature: string) {
  return aiModules.find((module) => module.feature === feature) ?? null;
}
