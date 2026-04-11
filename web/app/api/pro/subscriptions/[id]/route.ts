import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail, isActivePro } from '@/lib/db/agents'
import { toggleSubscription, deleteSubscription } from '@/lib/db/subscriptions'

async function getProAgent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  const agent = await getAgentByEmail(user.email)
  if (!agent || !isActivePro(agent)) return null
  return agent
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const agent = await getProAgent()
  if (!agent) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { active } = await req.json().catch(() => ({}))
  if (typeof active !== 'boolean') {
    return NextResponse.json({ success: false, error: 'active (boolean) required' }, { status: 400 })
  }

  await toggleSubscription(params.id, agent.id, active)
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const agent = await getProAgent()
  if (!agent) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  await deleteSubscription(params.id, agent.id)
  return NextResponse.json({ success: true })
}
