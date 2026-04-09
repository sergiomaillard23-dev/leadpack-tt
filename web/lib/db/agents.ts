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
