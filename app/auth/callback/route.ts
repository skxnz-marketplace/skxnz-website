import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Only allow same-origin, absolute-path redirects. Anything that could be
// read as an external target (protocol-relative "//", backslash tricks, or a
// value that is not a plain "/..." path) falls back to the home page. This
// blocks open-redirect via the `next` query param.
function safeNextPath(raw: string | null): string {
  if (!raw) return "/"
  // Must be a root-relative path and not a protocol-relative "//host".
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/"
  // Reject backslash variants that some browsers normalize to "//".
  if (raw.includes("\\")) return "/"
  return raw
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = safeNextPath(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    )
  }

  // No code param — forward any error Supabase appended to the URL
  const errorDescription =
    searchParams.get("error_description") ??
    searchParams.get("error") ??
    "Authentication link invalid or expired."

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(errorDescription)}`,
  )
}
