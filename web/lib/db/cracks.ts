import pool from '@/lib/db/client'

export type PackCrack = {
  agent_id: string
  pack_id: string
  expires_at: Date
  purchased: boolean
}

/**
 * Insert or refresh a crack record for (agent, pack).
 * ON CONFLICT resets the 5-minute window so re-cracking is idempotent.
 */
export async function crackPack(
  agent_id: string,
  pack_id: string
): Promise<{ expires_at: Date }> {
  const { rows } = await pool.query<{ expires_at: Date }>(
    `INSERT INTO pack_cracks (agent_id, pack_id)
     VALUES ($1, $2)
     ON CONFLICT (agent_id, pack_id) DO UPDATE
       SET cracked_at = CURRENT_TIMESTAMP,
           expires_at = CURRENT_TIMESTAMP + INTERVAL '5 minutes',
           purchased  = false
     RETURNING expires_at`,
    [agent_id, pack_id]
  )
  return rows[0]
}

/**
 * Returns the active crack record if the window is still open, else null.
 */
export async function getActiveCrack(
  agent_id: string,
  pack_id: string
): Promise<{ expires_at: Date } | null> {
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
 * Mark a crack as purchased — called inside the purchase transaction.
 */
export async function markPurchased(
  agent_id: string,
  pack_id: string
): Promise<void> {
  await pool.query(
    `UPDATE pack_cracks SET purchased = true
     WHERE agent_id = $1 AND pack_id = $2`,
    [agent_id, pack_id]
  )
}

/**
 * Check if agent is locked out of this pack (cracked + expired without purchase, within 24 h).
 * Uses the DB function from migration 007.
 */
export async function isLockedOut(
  agent_id: string,
  pack_id: string
): Promise<boolean> {
  const { rows } = await pool.query<{ result: boolean }>(
    'SELECT agent_is_locked_out($1, $2) AS result',
    [agent_id, pack_id]
  )
  return rows[0]?.result ?? false
}

/**
 * Seconds remaining on an active crack window, or 0 if none.
 * Uses the DB function from migration 007.
 */
export async function getCrackRemainingSeconds(
  agent_id: string,
  pack_id: string
): Promise<number> {
  const { rows } = await pool.query<{ result: number | null }>(
    'SELECT get_crack_remaining_seconds($1, $2) AS result',
    [agent_id, pack_id]
  )
  return rows[0]?.result ?? 0
}
