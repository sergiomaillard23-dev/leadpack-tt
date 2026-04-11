import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail, isActivePro } from '@/lib/db/agents'
import { updateTemplate, deleteTemplate, setDefaultTemplate } from '@/lib/db/templates'

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

  const body = await req.json().catch(() => ({}))

  if (body.setDefault === true) {
    await setDefaultTemplate(params.id, agent.id)
    return NextResponse.json({ success: true })
  }

  const fields: { name?: string; body?: string } = {}
  if (typeof body.name === 'string') fields.name = body.name.trim()
  if (typeof body.body === 'string') fields.body = body.body.trim()

  await updateTemplate(params.id, agent.id, fields)
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const agent = await getProAgent()
  if (!agent) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  await deleteTemplate(params.id, agent.id)
  return NextResponse.json({ success: true })
}
