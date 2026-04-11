import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail, isActivePro } from '@/lib/db/agents'
import { updatePipelineStatus, PIPELINE_STATUSES } from '@/lib/db/pipeline'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const agent = await getAgentByEmail(user.email)
  if (!agent || !isActivePro(agent)) {
    return NextResponse.json({ success: false, error: 'Pro membership required' }, { status: 403 })
  }

  const { status } = await req.json().catch(() => ({}))
  if (!PIPELINE_STATUSES.includes(status)) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
  }

  await updatePipelineStatus(params.leadId, status)
  return NextResponse.json({ success: true })
}
