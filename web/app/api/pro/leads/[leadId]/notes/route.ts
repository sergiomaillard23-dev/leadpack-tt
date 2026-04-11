import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail, isActivePro } from '@/lib/db/agents'
import { getLeadNotes, addLeadNote } from '@/lib/db/pipeline'

async function resolveAgent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  const agent = await getAgentByEmail(user.email)
  if (!agent || !isActivePro(agent)) return null
  return agent
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  const agent = await resolveAgent()
  if (!agent) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const notes = await getLeadNotes(params.leadId, agent.id)
  return NextResponse.json({ success: true, data: notes })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  const agent = await resolveAgent()
  if (!agent) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { body } = await req.json().catch(() => ({}))
  if (!body?.trim()) {
    return NextResponse.json({ success: false, error: 'Note body is required' }, { status: 400 })
  }

  const note = await addLeadNote(params.leadId, agent.id, body.trim())
  return NextResponse.json({ success: true, data: note })
}
