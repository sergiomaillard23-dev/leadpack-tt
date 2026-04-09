import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import pool from '@/lib/db/client'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const { user } = data.session
      const name  = user.user_metadata?.full_name ?? 'Agent'
      const phone = user.user_metadata?.phone ?? '1-868-000-0000'

      // Provision agents row — ON CONFLICT DO NOTHING is safe to call on every login
      await pool.query(
        `INSERT INTO agents (name, phone, email, kyc_status)
         VALUES ($1, $2, $3, 'PENDING')
         ON CONFLICT (email) DO NOTHING`,
        [name, phone, user.email]
      ).catch((err) => console.error('[auth/callback] agent provisioning failed:', err))

      return NextResponse.redirect(`${origin}/onboarding/kyc`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
