import pool from '@/lib/db/client'

export type WhatsAppTemplate = {
  id: string
  name: string
  body: string
  is_default: boolean
  created_at: Date
  updated_at: Date
}

export async function getTemplates(agentId: string): Promise<WhatsAppTemplate[]> {
  const { rows } = await pool.query<WhatsAppTemplate>(
    `SELECT id, name, body, is_default, created_at, updated_at
     FROM whatsapp_templates
     WHERE agent_id = $1
     ORDER BY is_default DESC, created_at ASC`,
    [agentId]
  )
  return rows
}

export async function createTemplate(
  agentId: string,
  name: string,
  body: string
): Promise<WhatsAppTemplate> {
  const { rows } = await pool.query<WhatsAppTemplate>(
    `INSERT INTO whatsapp_templates (agent_id, name, body)
     VALUES ($1, $2, $3)
     RETURNING id, name, body, is_default, created_at, updated_at`,
    [agentId, name, body]
  )
  return rows[0]
}

export async function updateTemplate(
  id: string,
  agentId: string,
  fields: { name?: string; body?: string }
): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  let i = 1

  if (fields.name !== undefined) { updates.push(`name = $${i++}`); values.push(fields.name) }
  if (fields.body !== undefined) { updates.push(`body = $${i++}`); values.push(fields.body) }
  if (updates.length === 0) return

  updates.push(`updated_at = now()`)
  values.push(id, agentId)

  await pool.query(
    `UPDATE whatsapp_templates SET ${updates.join(', ')}
     WHERE id = $${i++} AND agent_id = $${i}`,
    values
  )
}

export async function deleteTemplate(id: string, agentId: string): Promise<void> {
  await pool.query(
    `DELETE FROM whatsapp_templates WHERE id = $1 AND agent_id = $2`,
    [id, agentId]
  )
}

/** Sets one template as default, clearing any existing default for this agent. */
export async function setDefaultTemplate(id: string, agentId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `UPDATE whatsapp_templates SET is_default = false WHERE agent_id = $1`,
      [agentId]
    )
    await client.query(
      `UPDATE whatsapp_templates SET is_default = true WHERE id = $1 AND agent_id = $2`,
      [id, agentId]
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
