import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user: { email?: string } | null = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // If Supabase is unreachable, treat as unauthenticated
  }
  const { pathname } = request.nextUrl

  const isAuthRoute     = pathname.startsWith('/login') ||
                          pathname.startsWith('/register') ||
                          pathname.startsWith('/auth/')
  const isOnboarding    = pathname.startsWith('/onboarding')
  const isAdminRoute    = pathname.startsWith('/admin')
  const isLandingPage   = pathname === '/'

  // 1. Unauthenticated — send to login (except auth routes and the public landing page)
  if (!user && !isAuthRoute && !isLandingPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Admin routes — only ADMIN_EMAILS allowed
  if (isAdminRoute && user) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim())
    if (!adminEmails.includes(user.email ?? '')) {
      const url = request.nextUrl.clone()
      url.pathname = '/marketplace'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
