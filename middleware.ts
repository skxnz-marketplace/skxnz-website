import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refreshes the session and rotates the token if needed.
  // Do not add any logic between createServerClient and getUser() — it breaks token refresh.
  await supabase.auth.getUser()

  // Route protection: add getClaims()-based checks here when guarding server routes.
  // getClaims() validates the JWT locally (no network call) and is faster than getUser().
  // Example:
  //   const { data: { claims } } = await supabase.auth.getClaims()
  //   if (!claims && request.nextUrl.pathname.startsWith('/account')) {
  //     return NextResponse.redirect(new URL('/login', request.url))
  //   }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
