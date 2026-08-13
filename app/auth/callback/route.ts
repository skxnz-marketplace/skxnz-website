import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-redirect";

// OAuth / email-link callback. Exchanges the code for a session, then redirects
// to a validated same-origin path. On any failure it sends the user to
// /login?auth=error — a GENERIC flag, never the raw Supabase message, so
// nothing leaks and there is no account enumeration.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}/login?auth=error`);
  }

  // No code — the provider appended an error, or the link was malformed.
  return NextResponse.redirect(`${origin}/login?auth=error`);
}
