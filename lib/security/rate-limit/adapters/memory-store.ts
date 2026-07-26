// In-process sliding-window store.
//
// HONEST SCOPE: this protects ONE Node process. SKXNZ deploys to Vercel, where
// each serverless instance and each region has its own memory, so an attacker
// spreading requests across instances gets `limit` attempts PER INSTANCE. It
// raises the cost of naive burst abuse from one client; it is NOT distributed
// protection and `distributed` is reported false so nothing can claim otherwise.
//
// Swap in a Redis/Upstash adapter to make the guarantee real — the interface is
// designed so no call site changes.
import type { RateLimitStore } from "../types";

/**
 * Sliding window over per-key hit timestamps, rather than a fixed window.
 * A fixed window lets an attacker send `limit` requests at the end of window N
 * and `limit` more at the start of N+1 — a 2x burst across the boundary. The
 * sliding window closes that.
 */
type Bucket = {
  /** Ascending hit timestamps inside the current window. */
  hits: number[];
  /** Last touch, used by the sweeper to drop idle keys. */
  lastSeen: number;
};

/** Hard ceiling on tracked keys so a key-space flood cannot exhaust memory. */
const MAX_TRACKED_KEYS = 20_000;
/** How often to sweep expired buckets, in consume() calls. */
const SWEEP_EVERY_N_CALLS = 500;

export function createMemoryRateLimitStore(): RateLimitStore {
  const buckets = new Map<string, Bucket>();
  let callsSinceSweep = 0;

  function sweep(now: number, windowMs: number) {
    for (const [key, bucket] of buckets) {
      if (now - bucket.lastSeen > windowMs) {
        buckets.delete(key);
      }
    }
  }

  return {
    kind: "memory",
    distributed: false,

    async consume(key, limit, windowMs, now) {
      callsSinceSweep += 1;
      if (callsSinceSweep >= SWEEP_EVERY_N_CALLS) {
        callsSinceSweep = 0;
        sweep(now, windowMs);
      }

      // Resource-exhaustion guard: if the key space is flooded, evict the
      // coldest entry rather than growing without bound.
      if (!buckets.has(key) && buckets.size >= MAX_TRACKED_KEYS) {
        let coldestKey: string | null = null;
        let coldestSeen = Infinity;
        for (const [candidateKey, bucket] of buckets) {
          if (bucket.lastSeen < coldestSeen) {
            coldestSeen = bucket.lastSeen;
            coldestKey = candidateKey;
          }
        }
        if (coldestKey) buckets.delete(coldestKey);
      }

      const windowStart = now - windowMs;
      const bucket = buckets.get(key) ?? { hits: [], lastSeen: now };

      // Drop hits that have slid out of the window.
      let firstLiveIndex = 0;
      while (firstLiveIndex < bucket.hits.length && bucket.hits[firstLiveIndex] <= windowStart) {
        firstLiveIndex += 1;
      }
      if (firstLiveIndex > 0) bucket.hits = bucket.hits.slice(firstLiveIndex);

      bucket.hits.push(now);
      bucket.lastSeen = now;

      // Cap retained timestamps: once over the limit the exact count does not
      // change the decision, so there is no reason to keep growing the array.
      if (bucket.hits.length > limit + 1) {
        bucket.hits = bucket.hits.slice(bucket.hits.length - (limit + 1));
      }

      buckets.set(key, bucket);

      // The window frees up when the oldest retained hit slides out.
      const oldest = bucket.hits[0] ?? now;
      return { count: bucket.hits.length, resetAt: oldest + windowMs };
    },

    async reset() {
      buckets.clear();
      callsSinceSweep = 0;
    },
  };
}
