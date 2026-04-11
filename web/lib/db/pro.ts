import pool from '@/lib/db/client'
import { DEFAULT_WHATSAPP_TEMPLATE_BODY } from '@/lib/constants'

export type ProApplication = {
  id: string
  agent_id: string
  full_name: string
  email: string
  billing_address_line1: string
  billing_address_line2: string | null
  city: string
  country: string
  status: 'PENDING_PAYMENT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
  wipay_transaction_id: string | null
  created_at: Date
  reviewed_at: Date | null
}

/** Create or replace a PENDING_PAYMENT application for an agent. */
export async function upsertProApplication(data: {
  agentId: string
  fullName: string
  email: string
  billingLine1: string
  billingLine2: string | null
  city: string
  country: string
}): Promise<string> {
  // Replace any existing non-approved application for this agent.
  await pool.query(
    `DELETE FROM pro_applications
     WHERE agent_id = $1 AND status IN ('PENDING_PAYMENT', 'REJECTED')`,
    [data.agentId]
  )
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO pro_applications
       (agent_id, full_name, email, billing_address_line1, billing_address_line2, city, country)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [data.agentId, data.fullName, data.email,
     data.billingLine1, data.billingLine2 ?? null, data.city, data.country]
  )
  return rows[0].id
}

export async function getProApplication(applicationId: string): Promise<ProApplication | null> {
  const { rows } = await pool.query<ProApplication>(
    `SELECT * FROM pro_applications WHERE id = $1`,
    [applicationId]
  )
  return rows[0] ?? null
}

/**
 * Activate a Pro membership.
 * Runs in a single transaction:
 *   1. Mark application APPROVED with the WiPay transaction ID.
 *   2. Set agent is_legendary_pro + expiry + activated_at.
 *   3. Seed the default WhatsApp template (skipped if one already exists).
 */
export async function activateProApplication(
  applicationId: string,
  wipayTransactionId: string
): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query<{ agent_id: string }>(
      `UPDATE pro_applications
       SET status = 'APPROVED', wipay_transaction_id = $2, reviewed_at = now()
       WHERE id = $1
       RETURNING agent_id`,
      [applicationId, wipayTransactionId]
    )
    if (rows.length === 0) throw new Error(`Pro application not found: ${applicationId}`)

    const agentId = rows[0].agent_id

    await client.query(
      `UPDATE agents
       SET is_legendary_pro = true,
           pro_activated_at = now(),
           pro_membership_expires_at = now() + interval '365 days'
       WHERE id = $1`,
      [agentId]
    )

    // Seed default template only if the agent has none yet.
    await client.query(
      `INSERT INTO whatsapp_templates (agent_id, name, body, is_default)
       SELECT $1, 'Default Outreach', $2, true
       WHERE NOT EXISTS (
         SELECT 1 FROM whatsapp_templates WHERE agent_id = $1
       )`,
      [agentId, DEFAULT_WHATSAPP_TEMPLATE_BODY]
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
