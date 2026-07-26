// Store resolution and honest capability reporting.
//
// Today exactly one adapter exists: in-process memory. When a distributed
// adapter is added (Redis/Upstash), wire it here behind an env check and the
// capability string below starts telling a different, true story. No call site
// changes.
import { createMemoryRateLimitStore } from "./memory-store";
import type { RateLimiterCapability, RateLimitStore } from "../types";

const PROCESS_LOCAL_GUARANTEE =
  "Process-local only. Each server instance keeps its own counters, so a caller " +
  "spread across instances or regions gets the configured limit PER INSTANCE. " +
  "This raises the cost of naive burst abuse from a single client; it is not " +
  "distributed protection.";

// Module-level singleton. In Next.js dev the module graph can be re-evaluated,
// so the instance is parked on globalThis to keep counters stable across HMR.
// Without this, editing a file would silently reset every limit.
const GLOBAL_KEY = "__skxnz_rate_limit_store__";

type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: RateLimitStore };

export function getRateLimitStore(): RateLimitStore {
  const globalRef = globalThis as GlobalWithStore;
  if (!globalRef[GLOBAL_KEY]) {
    globalRef[GLOBAL_KEY] = createMemoryRateLimitStore();
  }
  return globalRef[GLOBAL_KEY];
}

/**
 * What the framework can truthfully claim right now. Intended for docs, an
 * ops health view, and incident review. Never phrase this optimistically —
 * `distributed` must stay false until a shared store is actually wired.
 */
export function getRateLimiterCapability(): RateLimiterCapability {
  const store = getRateLimitStore();
  return {
    storeKind: store.kind,
    distributed: store.distributed,
    guarantee: store.distributed
      ? "Shared store: limits apply across every instance and region."
      : PROCESS_LOCAL_GUARANTEE,
  };
}

/**
 * Clear the shared store. TEST/MAINTENANCE ONLY.
 *
 * Counters are process-wide by design, so a suite that exercises a guarded
 * action repeatedly would otherwise exhaust the real limit and see
 * RATE_LIMITED where it expected the action's own result. Tests call this
 * between cases to isolate them; production never does.
 */
export async function resetRateLimitStore(): Promise<void> {
  await getRateLimitStore().reset();
}

export { createMemoryRateLimitStore };
