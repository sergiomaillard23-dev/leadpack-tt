import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail, isActivePro } from '@/lib/db/agents'
import { upsertProApplication } from '@/lib/db/pro'
import { getProWiPayService } from '@/lib/payments/wipay'
import { LEGENDARY_PRO_ANNUAL_PRICE_CENTS } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const agent = await getAgentByEmail(user.email)
  if (!agent) {
    return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 403 })
  }
  if (isActivePro(agent)) {
    return NextResponse.json({ success: false, error: 'Already a Legendary Pro member' }, { status: 409 })
  }

  const body = await req.json().catch(() => null)
  const { fullName, email, billingLine1, billingLine2, city, country } = body ?? {}

  if (!fullName?.trim() || !email?.trim() || !billingLine1?.trim() || !city?.trim()) {
    return NextResponse.json({ success: false, error: 'Missing required billing fields' }, { status: 400 })
  }

  const applicationId = await upsertProApplication({
    agentId: agent.id,
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    billingLine1: billingLine1.trim(),
    billingLine2: billingLine2?.trim() || null,
    city: city.trim(),
    country: (country?.trim()) || 'Trinidad and Tobago',
  })

  const wipay = getProWiPayService()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const { checkoutUrl } = await wipay.createCheckoutSession({
    amountTTD: LEGENDARY_PRO_ANNUAL_PRICE_CENTS / 100,
    orderId: applicationId,
    customerEmail: email,
    returnUrl: `${appUrl}/pro/upgrade/success`,
  })

  return NextResponse.json({ success: true, checkoutUrl })
}
