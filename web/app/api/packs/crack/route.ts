import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import pool from '@/lib/db/client'
import { getAgentByEmail } from '@/lib/db/agents'
import { crackPack, getActiveCrack, isLockedOut } from '@/lib/db/cracks'

type LeadPreview = {
  id: string
  source: string
  income_bracket: string | null
  intent_niche: string | null
  is_legendary: boolean
}

type PackRow = {
  id: string
  lead_batch_id: string
  pack_size: number
  status: string
  pack_name: string
  pack_type: string
  price_ttd: number
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.pack_id || typeof body.pack_id !== 'string') {
    return NextResponse.json({ success: false, error: 'pack_id is required' }, { status: 400 })
  }
  const { pack_id } = body

  const agent = await getAgentByEmail(user.email)
  if (!agent) {
    return NextResponse.json(
      { success: false, error: 'Agent account not found. Please complete registration.' },
      { status: 403 }
    )
  }

  // Load the pack
  const { rows: packRows } = await pool.query<PackRow>(
    `SELECT id, lead_batch_id, pack_size, status, pack_name, pack_type, price_ttd
     FROM packs WHERE id = $1`,
    [pack_id]
  )
  const pack = packRows[0]
  if (!pack) {
    return NextResponse.json({ success: false, error: 'Pack not found' }, { status: 404 })
  }

  if (!['AVAILABLE', 'CRACKED'].includes(pack.status)) {
    return NextResponse.json(
      { success: false, error: `Pack is not available (status: ${pack.status})` },
      { status: 409 }
    )
  }

  // Check if this agent already has an active crack window (idempotent re-crack)
  const existingCrack = await getActiveCrack(agent.id, pack_id)
  if (existingCrack) {
    const remaining_seconds = Math.max(
      0,
      Math.floor((existingCrack.expires_at.getTime() - Date.now()) / 1000)
    )
    const leads = await getLeadPreviews(pack.lead_batch_id, pack.pack_size)
    return NextResponse.json({
      success: true,
      data: { pack, expires_at: existingCrack.expires_at, remaining_seconds, leads },
    })
  }

  // Check if agent is locked out (cracked, didn't purchase, within 24 h)
  if (await isLockedOut(agent.id, pack_id)) {
    return NextResponse.json(
      { success: false, error: 'You already previewed this pack and your window expired.' },
      { status: 423 }
    )
  }

  // Set pack to CRACKED and create/refresh the crack record
  await pool.query("UPDATE packs SET status = 'CRACKED' WHERE id = $1 AND status = 'AVAILABLE'", [pack_id])
  const crack = await crackPack(agent.id, pack_id)
  const remaining_seconds = Math.max(
    0,
    Math.floor((crack.expires_at.getTime() - Date.now()) / 1000)
  )

  const leads = await getLeadPreviews(pack.lead_batch_id, pack.pack_size)

  return NextResponse.json({
    success: true,
    data: { pack, expires_at: crack.expires_at, remaining_seconds, leads },
  })
}

async function getLeadPreviews(lead_batch_id: string, limit: number): Promise<LeadPreview[]> {
  const { rows } = await pool.query<LeadPreview>(
    `SELECT id, source, income_bracket, intent_niche, is_legendary
     FROM leads
     WHERE lead_batch_id = $1
     ORDER BY created_at ASC
     LIMIT $2`,
    [lead_batch_id, limit]
  )
  return rows
}
