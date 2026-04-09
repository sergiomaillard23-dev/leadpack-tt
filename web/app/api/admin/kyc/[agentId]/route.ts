import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { setKycStatus } from '@/lib/db/kyc'

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
  if (!body?.action || !['APPROVE', 'REJECT'].includes(body.action)) {
    return NextResponse.json({ success: false, error: 'action must be APPROVE or REJECT' }, { status: 400 })
  }

  if (body.action === 'REJECT' && !body.reason?.trim()) {
    return NextResponse.json({ success: false, error: 'reason is required for REJECT' }, { status: 400 })
  }

  try {
    await setKycStatus(
      params.agentId,
      body.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      body.reason
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/kyc]', err)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}
