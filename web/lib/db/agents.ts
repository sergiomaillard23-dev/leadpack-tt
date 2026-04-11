import pool from '@/lib/db/client'

export type Agent = {
  id: string
  full_name: string
  email: string
  wallet_balance: number
  is_subscribed: boolean
  kyc_status: 'PENDING' | 'APPROVED' | 'REJECTED'
  kyc_rejected_reason: string | null
  is_legendary_pro: boolean
  pro_membership_expires_at: Date | null
  company: string | null
}

/** Returns true only when the agent has an active, unexpired Pro membership. */
export function isActivePro(agent: Agent): boolean {
  return (
    agent.is_legendary_pro &&
    agent.pro_membership_expires_at !== null &&
    new Date(agent.pro_membership_expires_at) > new Date()
  )
}

export async function getAgentByEmail(email: string): Promise<Agent | null> {
  const { rows } = await pool.query<Agent>(
    `SELECT id, full_name, email, wallet_balance, is_subscribed, kyc_status, kyc_rejected_reason,
            is_legendary_pro, pro_membership_expires_at, company
     FROM agents WHERE email = $1`,
    [email]
  )
  return rows[0] ?? null
}

export type AgentRow = {
  id: string
  full_name: string
  email: string
  phone: string
  wallet_balance: number
  is_subscribed: boolean
  kyc_status: string
  created_at: Date
}

export async function getAllAgents(): Promise<AgentRow[]> {
  const { rows } = await pool.query<AgentRow>(
    `SELECT id, full_name, email, phone, wallet_balance, is_subscribed, kyc_status, created_at
     FROM agents
     ORDER BY created_at DESC`
  )
  return rows
}

export async function setProStatus(agent_id: string, isPro: boolean): Promise<void> {
  await pool.query(
    `UPDATE agents
     SET is_subscribed  = $2,
         sub_expires_at = CASE WHEN $2 THEN NULL ELSE NULL END
     WHERE id = $1`,
    [agent_id, isPro]
  )
}

export async function provisionAgent(
  id: string,
  fullName: string,
  phone: string,
  email: string,
  company: string | null = null
): Promise<void> {
  await pool.query(
    `INSERT INTO agents (id, full_name, phone, email, company, kyc_status)
     VALUES ($1, $2, $3, $4, $5, 'PENDING')
     ON CONFLICT (email) DO NOTHING`,
    [id, fullName, phone, email, company]
  )
}
