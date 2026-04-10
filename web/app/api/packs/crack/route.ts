import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import pool from '@/lib/db/client'
import { getAgentByEmail } from '@/lib/db/agents'
import { crackPack, getActiveCrack, isLockedOut } from '@/lib/db/cracks'
import { calculateLeadStats, calculateLeadOVR, applyLegendaryGate, getLeadTier } from '@/lib/utils/scoring'
import type { ScoredLead, LeadStats } from '@/lib/types/leads'

type LeadRow = {
  id: string
  source: string
  income_bracket: string | null
  is_legendary: boolean
  lead_stats: Record<string, number> | null
  calculated_ovr: number
  fact_find: Record<string, unknown>
  created_at: Date
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
    const leads = await getScoredLeads(pack_id)
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

  const leads = await getScoredLeads(pack_id)

  return NextResponse.json({
    success: true,
    data: { pack, expires_at: crack.expires_at, remaining_seconds, leads },
  })
}

async function getScoredLeads(pack_id: string): Promise<ScoredLead[]> {
  const { rows } = await pool.query<LeadRow>(
    `SELECT l.id, l.source, l.income_bracket, l.is_legendary,
            l.lead_stats, l.calculated_ovr, l.fact_find, l.created_at
     FROM leads l
     JOIN pack_leads pl ON pl.lead_id = l.id
     WHERE pl.pack_id = $1
     ORDER BY pl.position ASC`,
    [pack_id]
  )

  const now = Date.now()
  return rows.map(row => {
    const ff = row.fact_find || {}
    const hoursSinceGenerated = Math.floor((now - new Date(row.created_at).getTime()) / 3600000)

    let stats: LeadStats
    let ovr: number

    if (row.lead_stats && Object.keys(row.lead_stats).length === 6 && row.calculated_ovr > 0) {
      stats = row.lead_stats as unknown as LeadStats
      ovr = row.calculated_ovr
    } else {
      stats = calculateLeadStats({
        hoursSinceGenerated,
        intentSource: typeof ff.intent_source === 'string' ? ff.intent_source : row.source,
        parish: typeof ff.parish === 'string' ? ff.parish : '',
        monthlyIncomeTTD: typeof ff.monthly_income === 'number' ? ff.monthly_income : 0,
        employerType: typeof ff.employer_type === 'string' ? ff.employer_type : 'Private',
        age: typeof ff.age === 'number' ? ff.age : 35,
      })
      const rawOvr = calculateLeadOVR(stats)
      ovr = applyLegendaryGate(rawOvr, stats)
    }

    return {
      id: row.id,
      first_name: typeof ff.first_name === 'string' ? ff.first_name : 'Lead',
      last_name: typeof ff.last_name === 'string' ? ff.last_name : '',
      parish: typeof ff.parish === 'string' ? ff.parish : (row.income_bracket ?? 'Trinidad'),
      income_bracket: row.income_bracket ?? '',
      employer_type: typeof ff.employer_type === 'string' ? ff.employer_type : 'Private',
      age: typeof ff.age === 'number' ? ff.age : 35,
      intent_source: typeof ff.intent_source === 'string' ? ff.intent_source : row.source,
      hours_since_generated: hoursSinceGenerated,
      stats,
      ovr,
      tier: getLeadTier(ovr),
    }
  })
}
