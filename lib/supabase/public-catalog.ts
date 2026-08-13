// SERVER ONLY — read-only client for PUBLIC catalog data (active brands,
// active products). Uses the same publishable (anon) key as lib/supabase/server.ts,
// so RLS is enforced exactly the same way. This is NOT the service-role key and
// must never be used for anything user-scoped or write-shaped.
//
// Why this exists, rather than reusing lib/supabase/server.ts:
// that client reads cookies() to carry the signed-in session. Touching cookies()
// opts the whole route into dynamic rendering, which silently defeats
// `export const revalidate` on the homepage — every visitor paid a round trip to
// Supabase before seeing anything. Public catalog rows are identical for every
// visitor and carry no session, so reading them without cookies lets those pages
// be cached and served without hitting the database at all.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createPublicCatalogClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        // No session to persist or refresh: this client is anonymous by design.
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
