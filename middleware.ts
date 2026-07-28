import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  const needsUser =
    path.startsWith('/account') ||
    path.startsWith('/orders') ||
    // /returns is a public policy page (D1-A); the buyer return workspace
    // lives under /account/returns and /orders/[id], both gated above.
    path.startsWith('/wishlist') ||
    path.startsWith('/admin') ||
    path.startsWith('/seller')

  // Allow the role-specific login pages through unauthenticated.
  const isAuthPage = path === '/admin/login' || path === '/seller/login'

  // Fast path for anonymous traffic. supabase.auth.getUser() is a network round
  // trip to Supabase and it ran on EVERY request — including the fully static
  // homepage — putting hundreds of ms in front of every anonymous visitor.
  //
  // This is not a weaker check: Supabase stores the session in an
  // `sb-<ref>-auth-token` cookie, so the absence of that cookie means there is
  // no session and getUser() could only return null. Protected routes still
  // redirect to login; only the pointless round trip is skipped. Any request
  // that does carry an auth cookie falls through to full verification below.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'))

  if (!hasAuthCookie) {
    if (needsUser && !isAuthPage) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', safeRelativePath(path))
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next({ request })
  }

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Route protection ─────────────────────────────────────────────
  // Real server-side gate (replaces the old client-only DemoRoleGate for
  // protection). Role is read from public.users.role, never from headers or
  // localStorage. Login sub-pages are excluded to avoid redirect loops.
  // `path`, `needsUser` and `isAuthPage` are computed at the top of the
  // function so the anonymous fast path can gate on them too.
  if (needsUser && !isAuthPage) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', safeRelativePath(path))
      return NextResponse.redirect(loginUrl)
    }

    // Role-gated areas: /admin -> ADMIN, /seller -> SELLER or ADMIN.
    const needsAdmin = path.startsWith('/admin')
    const needsSeller = path.startsWith('/seller')

    if (needsAdmin || needsSeller) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role ?? null
      const allowed = needsAdmin
        ? role === 'ADMIN'
        : role === 'SELLER' || role === 'ADMIN'

      if (!allowed) {
        // Wrong role: send home, do not leak the protected area.
        // ?denied=role makes the redirect visible for QA instead of silently
        // "staying on the homepage" (roles come from public.users.role).
        const homeUrl = new URL('/', request.url)
        homeUrl.searchParams.set('denied', 'role')
        return NextResponse.redirect(homeUrl)
      }
    }
  }

  return supabaseResponse
}

/** Guarantee a root-relative same-origin path for the ?next= param. */
function safeRelativePath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return '/'
  }
  return path
}

export const config = {
  matcher: [
    // Media and fonts are public static files; running auth logic on them only
    // adds latency (the hero clip is ~16 MB and was matched by the old pattern).
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|mov|woff|woff2|ttf)$).*)',
  ],
}
