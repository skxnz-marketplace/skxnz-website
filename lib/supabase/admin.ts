// SERVER ONLY — never import into a client component or any file with 'use client'.
// Service-role client: bypasses RLS. Use only for trusted server-side admin ops
// (webhooks, triggers, background jobs). Never expose to the browser.
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
