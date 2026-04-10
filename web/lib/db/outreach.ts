import pool from '@/lib/db/client'

export type OutreachLog = {
  id: string
  lead_id: string
  channel: string
  recipient_phone: string
  message: string
  status: 'SENT' | 'FAILED'
  whatsapp_message_id: string | null
  sent_at: Date
}

export async function logOutreach(params: {
  agent_id: string
  lead_id: string
  recipient_phone: string
  message: string
  status: 'SENT' | 'FAILED'
  whatsapp_message_id?: string
  error_message?: string
}): Promise<void> {
  await pool.query(
    `INSERT INTO outreach_logs
       (agent_id, lead_id, recipient_phone, message, status, whatsapp_message_id, error_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      params.agent_id,
      params.lead_id,
      params.recipient_phone,
      params.message,
      params.status,
      params.whatsapp_message_id ?? null,
      params.error_message ?? null,
    ]
  )
}

export async function hasRecentOutreach(
  agent_id: string,
  lead_id: string,
  withinHours = 24
): Promise<boolean> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM outreach_logs
     WHERE agent_id = $1 AND lead_id = $2
       AND status = 'SENT'
       AND sent_at > NOW() - ($3 || ' hours')::interval`,
    [agent_id, lead_id, withinHours]
  )
  return parseInt(rows[0]?.count ?? '0') > 0
}
