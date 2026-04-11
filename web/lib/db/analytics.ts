import pool from '@/lib/db/client'

export type PipelineFunnelRow = {
  status: string
  count: number
}

export type OvrBucket = {
  bucket: string   // e.g. "50-59"
  count: number
}

export type AnalyticsData = {
  totalLeads: number
  totalSpentTTD: number          // TTD (not cents)
  closedWonCommissionTTD: number // summed from trader_journal
  closeRate: number              // 0-100 percentage
  funnel: PipelineFunnelRow[]
  ovrBuckets: OvrBucket[]
}

const STATUSES = ['NEW', 'CONTACTED', 'QUOTED', 'CLOSED_WON', 'CLOSED_LOST']

export async function getAnalytics(agentId: string): Promise<AnalyticsData> {
  const [spendRow, funnelRows, ovrRows, commissionRow] = await Promise.all([
    // Total leads + spend
    pool.query<{ total_leads: number; total_spent_ttd: number }>(
      `SELECT
         COUNT(DISTINCT l.id)::int                   AS total_leads,
         COALESCE(SUM(pp.amount_ttd), 0)::int        AS total_spent_ttd
       FROM pack_purchases pp
       JOIN packs        p  ON p.id  = pp.pack_id
       JOIN pack_leads   pl ON pl.pack_id = p.id
       JOIN leads        l  ON l.id  = pl.lead_id
       WHERE pp.agent_id = $1`,
      [agentId]
    ),

    // Pipeline funnel counts (only leads owned by this agent)
    pool.query<{ pipeline_status: string; cnt: number }>(
      `SELECT l.pipeline_status, COUNT(DISTINCT l.id)::int AS cnt
       FROM pack_purchases pp
       JOIN packs        p  ON p.id  = pp.pack_id
       JOIN pack_leads   pl ON pl.pack_id = p.id
       JOIN leads        l  ON l.id  = pl.lead_id
       WHERE pp.agent_id = $1
       GROUP BY l.pipeline_status`,
      [agentId]
    ),

    // OVR distribution in 10-point buckets
    pool.query<{ bucket: string; cnt: number }>(
      `SELECT
         (FLOOR(COALESCE(l.calculated_ovr, 0) / 10) * 10)::text || '-' ||
         (FLOOR(COALESCE(l.calculated_ovr, 0) / 10) * 10 + 9)::text AS bucket,
         COUNT(DISTINCT l.id)::int AS cnt
       FROM pack_purchases pp
       JOIN packs        p  ON p.id  = pp.pack_id
       JOIN pack_leads   pl ON pl.pack_id = p.id
       JOIN leads        l  ON l.id  = pl.lead_id
       WHERE pp.agent_id = $1
       GROUP BY 1
       ORDER BY MIN(l.calculated_ovr)`,
      [agentId]
    ),

    // Closed-won commission from trader_journal
    pool.query<{ total_commission: number }>(
      `SELECT COALESCE(SUM(commission_earned_ttd), 0)::int AS total_commission
       FROM trader_journal
       WHERE agent_id = $1 AND status = 'CLOSED_WON'`,
      [agentId]
    ),
  ])

  const spend = spendRow.rows[0] ?? { total_leads: 0, total_spent_ttd: 0 }

  // Build funnel with all statuses present (zero-fill missing)
  const funnelMap = new Map(funnelRows.rows.map(r => [r.pipeline_status, r.cnt]))
  const funnel: PipelineFunnelRow[] = STATUSES.map(s => ({
    status: s,
    count: funnelMap.get(s) ?? 0,
  }))

  const wonCount  = funnelMap.get('CLOSED_WON')  ?? 0
  const lostCount = funnelMap.get('CLOSED_LOST') ?? 0
  const closeRate = (wonCount + lostCount) > 0
    ? Math.round((wonCount / (wonCount + lostCount)) * 100)
    : 0

  const ovrBuckets: OvrBucket[] = ovrRows.rows.map(r => ({
    bucket: r.bucket,
    count: r.cnt,
  }))

  return {
    totalLeads: spend.total_leads,
    totalSpentTTD: spend.total_spent_ttd,
    closedWonCommissionTTD: commissionRow.rows[0]?.total_commission ?? 0,
    closeRate,
    funnel,
    ovrBuckets,
  }
}
