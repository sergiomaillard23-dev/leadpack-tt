import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail } from '@/lib/db/agents'
import { getCrackRemainingSeconds } from '@/lib/db/cracks'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const agent = await getAgentByEmail(user.email)
  if (!agent) {
    return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 403 })
  }

  const remaining_seconds = await getCrackRemainingSeconds(agent.id, params.id)
  return NextResponse.json({ success: true, data: { remaining_seconds } })
}
