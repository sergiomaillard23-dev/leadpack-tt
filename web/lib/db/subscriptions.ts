import pool from '@/lib/db/client'
import { PoolClient } from 'pg'

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

export type DeliveryResult = {
  subscription_id: string
  agent_id: string
  pack_tier: string
  delivered: number   // packs successfully purchased
  skipped: number     // packs skipped (no available pack or insufficient funds)
  skip_reasons: string[]
}

/**
 * Called by cron. For each due subscription:
 *  1. Advances next_delivery_at (claims the cycle).
 *  2. For each unit in quantity_per_cycle, finds an available pack of the right
 *     tier and purchases it on behalf of the agent — debiting their wallet and
 *     recording pack_purchase + wallet_transaction rows.
 *
 * Skips gracefully if the agent has insufficient funds or no packs are available,
 * so one bad subscription never blocks the rest.
 */
export async function deliverSubscriptions(): Promise<DeliveryResult[]> {
  // Step 1: atomically claim all due subscriptions and advance their timestamps.
  const { rows: due } = await pool.query<PackSubscription>(
    `UPDATE pack_subscriptions
     SET next_delivery_at = next_delivery_at + (cycle_days || ' days')::interval
     WHERE active = true AND next_delivery_at <= now()
     RETURNING id, agent_id, pack_tier, quantity_per_cycle, cycle_days,
               next_delivery_at, active, created_at`
  )

  const results: DeliveryResult[] = []

  for (const sub of due) {
    const result: DeliveryResult = {
      subscription_id: sub.id,
      agent_id: sub.agent_id,
      pack_tier: sub.pack_tier,
      delivered: 0,
      skipped: 0,
      skip_reasons: [],
    }

    for (let i = 0; i < sub.quantity_per_cycle; i++) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const purchased = await purchaseOnePack(client, sub.agent_id, sub.pack_tier)
        if (purchased.success) {
          await client.query('COMMIT')
          result.delivered++
        } else {
          await client.query('ROLLBACK')
          result.skipped++
          if (!result.skip_reasons.includes(purchased.reason)) {
            result.skip_reasons.push(purchased.reason)
          }
        }
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {})
        result.skipped++
        result.skip_reasons.push('internal error')
        console.error('[deliverSubscriptions] unexpected error', err)
      } finally {
        client.release()
      }
    }

    results.push(result)
  }

  return results
}

type PurchaseOutcome =
  | { success: true }
  | { success: false; reason: string }

async function purchaseOnePack(
  client: PoolClient,
  agentId: string,
  packTier: string
): Promise<PurchaseOutcome> {
  // Find the oldest available pack of this tier, lock it, skip any locked by other transactions.
  const { rows: packRows } = await client.query<{
    id: string; price_ttd: number; pack_type: string; buyer_count: number; max_buyers: number
  }>(
    `SELECT p.id, p.price_ttd, p.pack_type, p.buyer_count, p.max_buyers
     FROM packs p
     JOIN lead_batches lb ON lb.id = p.lead_batch_id
     WHERE p.pack_name = $1
       AND p.status = 'AVAILABLE'
       AND p.buyer_count < p.max_buyers
       AND (p.release_at IS NULL OR p.release_at <= now())
     ORDER BY lb.created_at ASC
     LIMIT 1
     FOR UPDATE SKIP LOCKED`,
    [packTier]
  )

  if (!packRows[0]) {
    return { success: false, reason: `no ${packTier} pack available` }
  }
  const pack = packRows[0]

  // Debit wallet — fails silently if balance insufficient.
  const { rowCount } = await client.query(
    `UPDATE agents
     SET wallet_balance = wallet_balance - $1
     WHERE id = $2 AND wallet_balance >= $1`,
    [pack.price_ttd, agentId]
  )
  if (!rowCount || rowCount === 0) {
    return { success: false, reason: 'insufficient wallet balance' }
  }

  // Increment buyer_count and flip status if now full.
  await client.query(
    `UPDATE packs
     SET buyer_count = buyer_count + 1,
         status = CASE WHEN buyer_count + 1 >= max_buyers THEN 'PURCHASED' ELSE 'AVAILABLE' END
     WHERE id = $1`,
    [pack.id]
  )

  // Record purchase.
  const { rows: purchaseRows } = await client.query<{ id: string }>(
    `INSERT INTO pack_purchases (pack_id, agent_id, purchase_type, amount_ttd)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [pack.id, agentId, pack.pack_type.toLowerCase(), pack.price_ttd]
  )

  // Record wallet transaction.
  const { rows: agentRows } = await client.query<{ wallet_balance: number }>(
    `SELECT wallet_balance FROM agents WHERE id = $1`,
    [agentId]
  )
  await client.query(
    `INSERT INTO wallet_transactions (agent_id, amount, tx_type, reference_id, balance_after)
     VALUES ($1, $2, 'PACK_PURCHASE', $3, $4)`,
    [agentId, -pack.price_ttd, purchaseRows[0].id, agentRows[0].wallet_balance]
  )

  return { success: true }
}
