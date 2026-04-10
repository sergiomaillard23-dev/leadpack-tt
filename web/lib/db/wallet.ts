import pool from '@/lib/db/client'

export type WalletTransaction = {
  id: string
  amount: number
  tx_type: string
  balance_after: number
  created_at: Date
}

export async function getTransactions(agent_id: string): Promise<WalletTransaction[]> {
  const { rows } = await pool.query<WalletTransaction>(
    `SELECT id, amount, tx_type, balance_after, created_at
     FROM wallet_transactions
     WHERE agent_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [agent_id]
  )
  return rows
}
