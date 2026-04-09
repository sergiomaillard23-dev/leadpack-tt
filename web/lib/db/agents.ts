import pool from '@/lib/db/client'

export type Agent = {
  id: string
  email: string
  wallet_balance: number
  is_subscribed: boolean
  kyc_status: 'PENDING' | 'APPROVED' | 'REJECTED'
  kyc_rejected_reason: string | null
}

export async function getAgentByEmail(email: string): Promise<Agent | null> {
  const { rows } = await pool.query<Agent>(
    `SELECT id, email, wallet_balance, is_subscribed, kyc_status, kyc_rejected_reason
     FROM agents WHERE email = $1`,
    [email]
  )
  return rows[0] ?? null
}

export async function provisionAgent(
  id: string,
  fullName: string,
  phone: string,
  email: string
): Promise<void> {
  await pool.query(
    `INSERT INTO agents (id, full_name, phone, email, kyc_status)
     VALUES ($1, $2, $3, $4, 'PENDING')
     ON CONFLICT (email) DO NOTHING`,
    [id, fullName, phone, email]
  )
}
