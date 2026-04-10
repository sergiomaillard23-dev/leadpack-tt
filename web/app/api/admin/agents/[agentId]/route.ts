import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { setProStatus } from '@/lib/db/agents'

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .includes(email)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !isAdmin(user?.email)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.action || !['GRANT_PRO', 'REVOKE_PRO'].includes(body.action)) {
    return NextResponse.json(
      { success: false, error: 'action must be GRANT_PRO or REVOKE_PRO' },
      { status: 400 }
    )
  }

  try {
    await setProStatus(params.agentId, body.action === 'GRANT_PRO')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/agents]', err)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}
