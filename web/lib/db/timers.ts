import pool from '@/lib/db/client'
import { PRIORITY_WINDOW_SECONDS } from '@/lib/constants'

export type PackTimer = {
  lead_batch_id: string
  agent_id: string
  cracked_pack_id: string
  expires_at: Date
}

/**
 * Create a 5-minute priority timer for a lead batch.
 * Fails silently if a timer already exists for this batch (ON CONFLICT DO NOTHING).
 * Callers should check getTimer first and handle the conflict explicitly.
 */
export async function createTimer(
  lead_batch_id: string,
  agent_id: string,
  cracked_pack_id: string
): Promise<PackTimer> {
  const expires_at = new Date(Date.now() + PRIORITY_WINDOW_SECONDS * 1000)
  const { rows } = await pool.query<PackTimer>(
    `INSERT INTO pack_timers (lead_batch_id, agent_id, cracked_pack_id, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [lead_batch_id, agent_id, cracked_pack_id, expires_at]
  )
  return rows[0]
}

/**
 * Get the active timer for a lead batch, or null if none exists.
 */
export async function getTimer(lead_batch_id: string): Promise<PackTimer | null> {
  const { rows } = await pool.query<PackTimer>(
    'SELECT * FROM pack_timers WHERE lead_batch_id = $1',
    [lead_batch_id]
  )
  return rows[0] ?? null
}

/**
 * Delete a timer — called when a pack is purchased or the timer expires.
 */
export async function deleteTimer(lead_batch_id: string): Promise<void> {
  await pool.query('DELETE FROM pack_timers WHERE lead_batch_id = $1', [lead_batch_id])
}

/**
 * Returns seconds remaining on a timer, or 0 if expired / no timer found.
 */
export async function getRemainingSeconds(lead_batch_id: string): Promise<number> {
  const timer = await getTimer(lead_batch_id)
  if (!timer) return 0
  const remaining = Math.floor((timer.expires_at.getTime() - Date.now()) / 1000)
  return Math.max(0, remaining)
}
