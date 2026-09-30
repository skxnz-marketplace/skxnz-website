// SERVER ONLY — never import into a client component or any file with 'use client'.
// Uses the publishable (anon) key + cookies for SSR auth. NOT the service-role key.
// For admin/service-role operations, use lib/supabase/admin.ts instead.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { fetchWithRetry } from '@/lib/net/fetch-with-retry'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Components cannot write cookies — Middleware handles refresh
          }
        },
      },
      global: {
        // Retries transient connection-level failures before a read/auth
        // call gives up — never retries an actual HTTP error response.
        fetch: (input, init) => fetchWithRetry(input, init),
      },
    },
  )
}
