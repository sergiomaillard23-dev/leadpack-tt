import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail, isActivePro } from '@/lib/db/agents'
import pool from '@/lib/db/client'

type ExportRow = {
  lead_id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  ovr: number
  pack_source: string
  pipeline_status: string
  last_note: string
  acquired_at: Date
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agent = await getAgentByEmail(user.email)
  if (!agent || !isActivePro(agent)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { rows } = await pool.query<ExportRow>(
    `SELECT DISTINCT ON (l.id)
       l.id                                                          AS lead_id,
       COALESCE(l.fact_find->>'first_name', '')                     AS first_name,
       COALESCE(l.fact_find->>'last_name',  '')                     AS last_name,
       COALESCE(l.fact_find->>'phone', '')                          AS phone,
       COALESCE(l.fact_find->>'email', '')                          AS email,
       COALESCE(l.calculated_ovr, 0)                                AS ovr,
       p.pack_name                                                   AS pack_source,
       l.pipeline_status,
       COALESCE(
         (SELECT body FROM lead_notes
          WHERE lead_id = l.id AND agent_id = $1
          ORDER BY created_at DESC LIMIT 1),
         ''
       )                                                             AS last_note,
       pp.purchased_at                                               AS acquired_at
     FROM pack_purchases pp
     JOIN packs        p  ON p.id  = pp.pack_id
     JOIN pack_leads   pl ON pl.pack_id = p.id
     JOIN leads        l  ON l.id  = pl.lead_id
     WHERE pp.agent_id = $1
     ORDER BY l.id, pp.purchased_at DESC`,
    [agent.id]
  )

  const headers = [
    'lead_id', 'first_name', 'last_name', 'phone', 'email',
    'ovr', 'pack_source', 'pipeline_status', 'last_note', 'acquired_at',
  ]

  const lines = [
    headers.join(','),
    ...rows.map(r =>
      [
        r.lead_id,
        r.first_name,
        r.last_name,
        r.phone,
        r.email,
        r.ovr,
        r.pack_source,
        r.pipeline_status,
        r.last_note,
        new Date(r.acquired_at).toISOString(),
      ]
        .map(escapeCsv)
        .join(',')
    ),
  ]

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leadpack-export-${Date.now()}.csv"`,
    },
  })
}
