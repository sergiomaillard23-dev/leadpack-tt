import pool from '@/lib/db/client'
import redis, {
  packTimerKey,
  packLockoutKey,
  PRIORITY_WINDOW_SECONDS,
  LOCKOUT_SECONDS,
} from '@/lib/redis'

export type PackCrack = {
  agent_id: string
  pack_id: string
  expires_at: Date
  purchased: boolean
}

/**
 * Start (or refresh) a 5-minute priority window.
 * Redis holds the live TTL; DB holds the audit record.
 */
export async function crackPack(
  agent_id: string,
  pack_id: string
): Promise<{ expires_at: Date }> {
  const expiresAt = new Date(Date.now() + PRIORITY_WINDOW_SECONDS * 1000)

  // Set Redis key with 5-min TTL (overwrites any existing key)
  await redis.set(packTimerKey(pack_id, agent_id), expiresAt.toISOString(), {
    ex: PRIORITY_WINDOW_SECONDS,
  })

  // Upsert DB audit record
  await pool.query(
    `INSERT INTO pack_cracks (agent_id, pack_id)
     VALUES ($1, $2)
     ON CONFLICT (agent_id, pack_id) DO UPDATE
       SET cracked_at = CURRENT_TIMESTAMP,
           expires_at = $3,
           purchased  = false`,
    [agent_id, pack_id, expiresAt]
  )

  return { expires_at: expiresAt }
}

/**
 * Returns the active crack window if still open, else null.
 * Checks Redis TTL first (fast path); falls back to DB.
 */
export async function getActiveCrack(
  agent_id: string,
  pack_id: string
): Promise<{ expires_at: Date } | null> {
  const ttl = await redis.ttl(packTimerKey(pack_id, agent_id))

  if (ttl > 0) {
    return { expires_at: new Date(Date.now() + ttl * 1000) }
  }

  // Redis key gone (expired or never set) — fall back to DB
  const { rows } = await pool.query<{ expires_at: Date }>(
    `SELECT expires_at FROM pack_cracks
     WHERE agent_id = $1 AND pack_id = $2
       AND expires_at > CURRENT_TIMESTAMP
       AND purchased = false`,
    [agent_id, pack_id]
  )
  return rows[0] ?? null
}

/**
 * Seconds remaining on an active crack window, or 0 if none.
 * Primary source: Redis TTL (O(1), no DB hit).
 */
export async function getCrackRemainingSeconds(
  agent_id: string,
  pack_id: string
): Promise<number> {
  const ttl = await redis.ttl(packTimerKey(pack_id, agent_id))
  if (ttl > 0) return ttl

  // Fall back to DB for sessions that pre-date Redis
  const { rows } = await pool.query<{ result: number | null }>(
    'SELECT get_crack_remaining_seconds($1, $2) AS result',
    [agent_id, pack_id]
  )
  return rows[0]?.result ?? 0
}

/**
 * Clear the Redis timer and mark the DB record as purchased.
 */
export async function markPurchased(
  agent_id: string,
  pack_id: string
): Promise<void> {
  await Promise.all([
    redis.del(packTimerKey(pack_id, agent_id)),
    pool.query(
      `UPDATE pack_cracks SET purchased = true
       WHERE agent_id = $1 AND pack_id = $2`,
      [agent_id, pack_id]
    ),
  ])
}

/**
 * Check if agent is locked out of this pack (previewed, didn't buy, within 24 h).
 * Redis key is set when a crack expires without purchase; falls back to DB function.
 */
export async function isLockedOut(
  agent_id: string,
  pack_id: string
): Promise<boolean> {
  const locked = await redis.exists(packLockoutKey(pack_id, agent_id))
  if (locked) return true

  // Fall back to DB for pre-Redis cracks
  const { rows } = await pool.query<{ result: boolean }>(
    'SELECT agent_is_locked_out($1, $2) AS result',
    [agent_id, pack_id]
  )
  return rows[0]?.result ?? false
}

/**
 * Called by the timer worker when a crack window expires without purchase.
 * Sets a 24-hour lockout key so the agent cannot re-crack the same pack.
 */
export async function expireCrack(
  agent_id: string,
  pack_id: string
): Promise<void> {
  await Promise.all([
    redis.del(packTimerKey(pack_id, agent_id)),
    redis.set(packLockoutKey(pack_id, agent_id), '1', { ex: LOCKOUT_SECONDS }),
  ])
}
