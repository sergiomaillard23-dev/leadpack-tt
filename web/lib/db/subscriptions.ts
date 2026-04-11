import pool from '@/lib/db/client'

export type PackSubscription = {
  id: string
  agent_id: string
  pack_tier: 'STANDARD' | 'PREMIUM' | 'LEGENDARY'
  quantity_per_cycle: number
  cycle_days: number
  next_delivery_at: Date
  active: boolean
  created_at: Date
}

export async function getSubscriptions(agentId: string): Promise<PackSubscription[]> {
  const { rows } = await pool.query<PackSubscription>(
    `SELECT id, agent_id, pack_tier, quantity_per_cycle, cycle_days,
            next_delivery_at, active, created_at
     FROM pack_subscriptions
     WHERE agent_id = $1
     ORDER BY created_at DESC`,
    [agentId]
  )
  return rows
}

export async function createSubscription(
  agentId: string,
  packTier: PackSubscription['pack_tier'],
  quantityPerCycle: number,
  cycleDays: number
): Promise<PackSubscription> {
  const { rows } = await pool.query<PackSubscription>(
    `INSERT INTO pack_subscriptions
       (agent_id, pack_tier, quantity_per_cycle, cycle_days, next_delivery_at)
     VALUES ($1, $2, $3, $4, now() + ($4 || ' days')::interval)
     RETURNING id, agent_id, pack_tier, quantity_per_cycle, cycle_days,
               next_delivery_at, active, created_at`,
    [agentId, packTier, quantityPerCycle, cycleDays]
  )
  return rows[0]
}

export async function toggleSubscription(id: string, agentId: string, active: boolean): Promise<void> {
  await pool.query(
    `UPDATE pack_subscriptions SET active = $3
     WHERE id = $1 AND agent_id = $2`,
    [id, agentId, active]
  )
}

export async function deleteSubscription(id: string, agentId: string): Promise<void> {
  await pool.query(
    `DELETE FROM pack_subscriptions WHERE id = $1 AND agent_id = $2`,
    [id, agentId]
  )
}

/** Called by cron: returns subscriptions due now and advances their next_delivery_at. */
export async function claimDueSubscriptions(): Promise<PackSubscription[]> {
  const { rows } = await pool.query<PackSubscription>(
    `UPDATE pack_subscriptions
     SET next_delivery_at = next_delivery_at + (cycle_days || ' days')::interval
     WHERE active = true AND next_delivery_at <= now()
     RETURNING id, agent_id, pack_tier, quantity_per_cycle, cycle_days,
               next_delivery_at, active, created_at`
  )
  return rows
}
