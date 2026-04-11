import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Lightweight middleware — no network calls, no Supabase SDK.
 * Only checks for the presence of a Supabase auth cookie so the edge
 * function stays fast and never times out.
 *
 * Full session verification (including admin gate) happens inside each
 * server component / route handler via createClient().
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthRoute  = pathname.startsWith('/login') ||
                       pathname.startsWith('/register') ||
                       pathname.startsWith('/auth/')
  const isLandingPage = pathname === '/'
  const isPublicAsset = pathname.startsWith('/_next') ||
                        pathname.startsWith('/favicon')
  const isPublicProPage = pathname === '/pro/upgrade'

  if (isAuthRoute || isLandingPage || isPublicAsset || isPublicProPage) {
    return NextResponse.next()
  }

  // Supabase SSR stores the session in a cookie named
  // `sb-<project-ref>-auth-token`. Check for any sb-*-auth-token cookie.
  const hasSession = request.cookies.getAll().some(
    ({ name }) => name.startsWith('sb-') && name.endsWith('-auth-token')
  )

  if (!hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
