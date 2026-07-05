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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Route protection ─────────────────────────────────────────────
  // Real server-side gate (replaces the old client-only DemoRoleGate for
  // protection). Role is read from public.users.role, never from headers or
  // localStorage. Login sub-pages are excluded to avoid redirect loops.
  const path = request.nextUrl.pathname

  const needsUser =
    path.startsWith('/account') ||
    path.startsWith('/orders') ||
    path.startsWith('/returns') ||
    path.startsWith('/wishlist') ||
    path.startsWith('/admin') ||
    path.startsWith('/seller')

  // Allow the role-specific login pages through unauthenticated.
  const isAuthPage = path === '/admin/login' || path === '/seller/login'

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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
