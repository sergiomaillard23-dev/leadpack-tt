import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { provisionAgent, getAgentByEmail } from '@/lib/db/agents'

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
      const fullName = user.user_metadata?.full_name as string | undefined
      const phone = user.user_metadata?.phone as string | undefined

      if (!fullName || !phone) {
        return NextResponse.redirect(`${origin}/login?error=missing_profile`)
      }

      try {
        await provisionAgent(user.id, fullName, phone, user.email!)
      } catch (err) {
        console.error('[auth/callback] provisioning failed', err)
        return NextResponse.redirect(`${origin}/login?error=provisioning_failed`)
      }

      const agent = await getAgentByEmail(user.email!).catch(() => null)
      if (agent?.kyc_status === 'APPROVED') {
        return NextResponse.redirect(`${origin}/marketplace`)
      }
      return NextResponse.redirect(`${origin}/onboarding/kyc`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
