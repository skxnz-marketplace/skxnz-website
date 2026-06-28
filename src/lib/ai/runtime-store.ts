import type {
  AiAuditRecord,
  AiUsageRecord,
  OutfitBuilderOption,
  TryOnJobResponse,
} from "@/src/lib/ai/types";

type StoredOutfitResult = {
  id: string;
  createdAt: string;
  summary: string;
  options: OutfitBuilderOption[];
};

type RuntimeStore = {
  usageLogs: AiUsageRecord[];
  auditLogs: AiAuditRecord[];
  outfitResults: Map<string, StoredOutfitResult>;
  tryOnJobs: Map<string, TryOnJobResponse>;
};

function createRuntimeStore(): RuntimeStore {
  return {
    usageLogs: [],
    auditLogs: [],
    outfitResults: new Map(),
    tryOnJobs: new Map(),
  };
}

function getRuntimeStore() {
  const globalScope = globalThis as typeof globalThis & {
    __skxnzAiRuntimeStore?: RuntimeStore;
  };

  if (!globalScope.__skxnzAiRuntimeStore) {
    globalScope.__skxnzAiRuntimeStore = createRuntimeStore();
  }

  return globalScope.__skxnzAiRuntimeStore;
}

export function appendAiUsageLog(log: AiUsageRecord) {
  const store = getRuntimeStore();

  store.usageLogs.unshift(log);
  store.usageLogs = store.usageLogs.slice(0, 100);
}

export function appendAiAuditLog(log: AiAuditRecord) {
  const store = getRuntimeStore();

  store.auditLogs.unshift(log);
  store.auditLogs = store.auditLogs.slice(0, 100);
}

export function listAiUsageLogs() {
  return getRuntimeStore().usageLogs;
}

export function listAiAuditLogs() {
  return getRuntimeStore().auditLogs;
}

export function saveOutfitResult(record: StoredOutfitResult) {
  getRuntimeStore().outfitResults.set(record.id, record);
}

export function getOutfitResult(id: string) {
  return getRuntimeStore().outfitResults.get(id) ?? null;
}

export function saveTryOnJob(job: TryOnJobResponse) {
  getRuntimeStore().tryOnJobs.set(job.id, job);
}

export function getTryOnJob(id: string) {
  return getRuntimeStore().tryOnJobs.get(id) ?? null;
}
