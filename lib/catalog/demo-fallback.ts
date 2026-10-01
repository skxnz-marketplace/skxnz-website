// The ONLY switch that may put demo/generated catalogue data (src/data/*) on a
// buyer-facing surface. Off unless explicitly enabled, and impossible in a
// production build: a failed Supabase query, an RLS error or a missing
// relation must never be papered over with fabricated merchandise.
//
// Safe to import from server and client code (no server-only dependencies).
// Enable for local work without a configured backend:
//   NEXT_PUBLIC_SKXNZ_DEMO_CATALOGUE=1 pnpm dev
export function isDemoCatalogueEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_SKXNZ_DEMO_CATALOGUE === "1";
}
