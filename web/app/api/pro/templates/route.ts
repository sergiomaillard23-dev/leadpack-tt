import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail, isActivePro } from '@/lib/db/agents'
import { getTemplates, createTemplate } from '@/lib/db/templates'

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

  const templates = await getTemplates(agent.id)
  return NextResponse.json({ success: true, data: templates })
}

export async function POST(req: NextRequest) {
  const agent = await getProAgent()
  if (!agent) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { name, body } = await req.json().catch(() => ({}))
  if (!name?.trim() || !body?.trim()) {
    return NextResponse.json({ success: false, error: 'Name and body are required' }, { status: 400 })
  }

  const template = await createTemplate(agent.id, name.trim(), body.trim())
  return NextResponse.json({ success: true, data: template }, { status: 201 })
}
