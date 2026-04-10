import pool from '@/lib/db/client'

export type PurchasedPack = {
  purchase_id: string
  purchased_at: Date
  amount_ttd: number
  purchase_type: string
  pack_id: string
  pack_label: string
  pack_type: string
  lead_batch_id: string
  lead_count: number
}

export type PackLead = {
  id: string
  full_name: string
  phone: string
  email: string | null
  parish: string | null
  estimated_income_ttd: number | null
  source: string | null
}

export async function getPurchasedPacks(agent_id: string): Promise<PurchasedPack[]> {
  const { rows } = await pool.query<PurchasedPack>(
    `SELECT
       pp.id AS purchase_id,
       pp.purchased_at,
       pp.amount_ttd,
       pp.purchase_type,
       p.id AS pack_id,
       p.pack_label,
       p.pack_type,
       p.lead_batch_id,
       (SELECT COUNT(*) FROM pack_leads pl WHERE pl.pack_id = p.id)::int AS lead_count
     FROM pack_purchases pp
     JOIN packs p ON p.id = pp.pack_id
     WHERE pp.agent_id = $1
     ORDER BY pp.purchased_at DESC`,
    [agent_id]
  )
  return rows
}

export async function getLeadsForPack(pack_id: string): Promise<PackLead[]> {
  const { rows } = await pool.query<PackLead>(
    `SELECT
       l.id,
       COALESCE(
         NULLIF(TRIM(
           COALESCE(l.fact_find->>'first_name', '') || ' ' ||
           COALESCE(l.fact_find->>'last_name',  '')
         ), ''),
         'Unknown'
       )                                                       AS full_name,
       l.fact_find->>'phone'                                   AS phone,
       l.fact_find->>'email'                                   AS email,
       l.fact_find->>'parish'                                  AS parish,
       NULLIF(l.fact_find->>'monthly_income', '')::integer     AS estimated_income_ttd,
       l.source
     FROM pack_leads pl
     JOIN leads l ON l.id = pl.lead_id
     WHERE pl.pack_id = $1
     ORDER BY pl.position`,
    [pack_id]
  )
  return rows
}

export type JournalStats = {
  total_spent_ttd: number
  packs_purchased: number
  total_leads: number
}

export async function getJournalStats(agent_id: string): Promise<JournalStats> {
  const { rows } = await pool.query<JournalStats>(
    `SELECT
       COALESCE(SUM(pp.amount_ttd), 0)::int AS total_spent_ttd,
       COUNT(pp.id)::int AS packs_purchased,
       COALESCE(SUM(
         (SELECT COUNT(*) FROM pack_leads pl WHERE pl.pack_id = p.id)
       ), 0)::int AS total_leads
     FROM pack_purchases pp
     JOIN packs p ON p.id = pp.pack_id
     WHERE pp.agent_id = $1`,
    [agent_id]
  )
  return rows[0] ?? { total_spent_ttd: 0, packs_purchased: 0, total_leads: 0 }
}
