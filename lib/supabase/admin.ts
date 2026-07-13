// SERVER ONLY — never import into a client component or any file with 'use client'.
// Service-role client: bypasses RLS. Use only for trusted server-side admin ops
// (webhooks, triggers, background jobs). Never expose to the browser.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase admin client is not configured.")
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
