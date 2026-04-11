import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail, isActivePro } from '@/lib/db/agents'
import { getSubscriptions, createSubscription } from '@/lib/db/subscriptions'

const VALID_TIERS = ['STANDARD', 'PREMIUM', 'LEGENDARY'] as const
type Tier = typeof VALID_TIERS[number]

async function getProAgent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  const agent = await getAgentByEmail(user.email)
  if (!agent || !isActivePro(agent)) return null
  return agent
}

export async function GET() {
  const agent = await getProAgent()
  if (!agent) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const subs = await getSubscriptions(agent.id)
  return NextResponse.json({ success: true, data: subs })
}

export async function POST(req: NextRequest) {
  const agent = await getProAgent()
  if (!agent) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { pack_tier, quantity_per_cycle, cycle_days } = await req.json().catch(() => ({}))

  if (!VALID_TIERS.includes(pack_tier as Tier)) {
    return NextResponse.json({ success: false, error: 'Invalid pack tier' }, { status: 400 })
  }
  const qty  = parseInt(quantity_per_cycle)
  const days = parseInt(cycle_days)
  if (!qty || qty < 1 || qty > 10) {
    return NextResponse.json({ success: false, error: 'quantity_per_cycle must be 1–10' }, { status: 400 })
  }
  if (!days || days < 7 || days > 90) {
    return NextResponse.json({ success: false, error: 'cycle_days must be 7–90' }, { status: 400 })
  }

  const sub = await createSubscription(agent.id, pack_tier as Tier, qty, days)
  return NextResponse.json({ success: true, data: sub }, { status: 201 })
}
