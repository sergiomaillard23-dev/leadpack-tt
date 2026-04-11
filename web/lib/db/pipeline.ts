import pool from '@/lib/db/client'

export type PipelineStatus = 'NEW' | 'CONTACTED' | 'QUOTED' | 'CLOSED_WON' | 'CLOSED_LOST'

export const PIPELINE_STATUSES: PipelineStatus[] = [
  'NEW', 'CONTACTED', 'QUOTED', 'CLOSED_WON', 'CLOSED_LOST',
]

export type PipelineLead = {
  id: string
  full_name: string
  phone: string
  parish: string | null
  pipeline_status: PipelineStatus
  calculated_ovr: number
  note_count: number
  last_note_at: Date | null
  pack_name: string
}

export type LeadNote = {
  id: string
  body: string
  created_at: Date
}

/**
 * Returns all leads owned by this agent across all their packs,
 * deduplicated by lead id (most recent purchase wins for pack_name).
 *
 * pipeline_status is stored globally on the lead row (v1 design).
 * Notes are scoped per agent.
 */
export async function getPipelineLeads(agentId: string): Promise<PipelineLead[]> {
  const { rows } = await pool.query<PipelineLead>(
    `SELECT DISTINCT ON (l.id)
       l.id,
       COALESCE(NULLIF(TRIM(
         COALESCE(l.fact_find->>'first_name', '') || ' ' ||
         COALESCE(l.fact_find->>'last_name', '')
       ), ''), 'Unknown')                                              AS full_name,
       COALESCE(l.fact_find->>'phone', '')                            AS phone,
       l.fact_find->>'parish'                                         AS parish,
       l.pipeline_status,
       COALESCE(l.calculated_ovr, 0)                                  AS calculated_ovr,
       (SELECT COUNT(*)::int FROM lead_notes
        WHERE lead_id = l.id AND agent_id = $1)                       AS note_count,
       (SELECT MAX(created_at) FROM lead_notes
        WHERE lead_id = l.id AND agent_id = $1)                       AS last_note_at,
       p.pack_name
     FROM pack_purchases pp
     JOIN packs        p  ON p.id  = pp.pack_id
     JOIN pack_leads   pl ON pl.pack_id = p.id
     JOIN leads        l  ON l.id  = pl.lead_id
     WHERE pp.agent_id = $1
     ORDER BY l.id, pp.purchased_at DESC`,
    [agentId]
  )
  return rows
}

export async function getLeadDetail(leadId: string, agentId: string): Promise<PipelineLead | null> {
  const { rows } = await pool.query<PipelineLead>(
    `SELECT DISTINCT ON (l.id)
       l.id,
       COALESCE(NULLIF(TRIM(
         COALESCE(l.fact_find->>'first_name', '') || ' ' ||
         COALESCE(l.fact_find->>'last_name', '')
       ), ''), 'Unknown')                                              AS full_name,
       COALESCE(l.fact_find->>'phone', '')                            AS phone,
       l.fact_find->>'parish'                                         AS parish,
       l.pipeline_status,
       COALESCE(l.calculated_ovr, 0)                                  AS calculated_ovr,
       (SELECT COUNT(*)::int FROM lead_notes
        WHERE lead_id = l.id AND agent_id = $2)                       AS note_count,
       (SELECT MAX(created_at) FROM lead_notes
        WHERE lead_id = l.id AND agent_id = $2)                       AS last_note_at,
       p.pack_name
     FROM pack_purchases pp
     JOIN packs        p  ON p.id  = pp.pack_id
     JOIN pack_leads   pl ON pl.pack_id = p.id
     JOIN leads        l  ON l.id  = pl.lead_id
     WHERE pp.agent_id = $2 AND l.id = $1
     ORDER BY l.id, pp.purchased_at DESC`,
    [leadId, agentId]
  )
  return rows[0] ?? null
}

/** Update the global pipeline status of a lead. */
export async function updatePipelineStatus(
  leadId: string,
  status: PipelineStatus
): Promise<void> {
  await pool.query(
    `UPDATE leads SET pipeline_status = $2 WHERE id = $1`,
    [leadId, status]
  )
}

export async function getLeadNotes(leadId: string, agentId: string): Promise<LeadNote[]> {
  const { rows } = await pool.query<LeadNote>(
    `SELECT id, body, created_at
     FROM lead_notes
     WHERE lead_id = $1 AND agent_id = $2
     ORDER BY created_at ASC`,
    [leadId, agentId]
  )
  return rows
}

export async function addLeadNote(
  leadId: string,
  agentId: string,
  body: string
): Promise<LeadNote> {
  const { rows } = await pool.query<LeadNote>(
    `INSERT INTO lead_notes (lead_id, agent_id, body)
     VALUES ($1, $2, $3)
     RETURNING id, body, created_at`,
    [leadId, agentId, body]
  )
  return rows[0]
}
