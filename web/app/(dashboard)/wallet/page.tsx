import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail } from '@/lib/db/agents'
import { getTransactions } from '@/lib/db/wallet'

function formatCents(cents: number) {
  return `TT$${(cents / 100).toLocaleString('en-TT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString('en-TT', {
    timeZone: 'America/Port_of_Spain',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const TX_LABELS: Record<string, string> = {
  TOP_UP: 'Top Up',
  SUBSCRIPTION_GRANT: 'Pro Credits',
  PACK_PURCHASE: 'Pack Purchase',
  DISPUTE_REFUND: 'Dispute Refund',
}

const TX_COLORS: Record<string, string> = {
  TOP_UP: 'text-green-400',
  SUBSCRIPTION_GRANT: 'text-blue-400',
  PACK_PURCHASE: 'text-red-400',
  DISPUTE_REFUND: 'text-yellow-400',
}

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const agent = await getAgentByEmail(user.email!).catch(() => null)
  if (!agent) redirect('/login')

  const transactions = await getTransactions(agent.id).catch(() => [])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Wallet</h1>
        <p className="text-gray-400 mt-1">Your credit balance and transaction history</p>
      </div>

      {/* Balance card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Available Balance</p>
        <p className="text-4xl font-bold text-white">{formatCents(agent.wallet_balance)}</p>
        <div className="mt-4 flex gap-3">
          <button
            disabled
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium opacity-50 cursor-not-allowed"
            title="WiPay top-up coming soon"
          >
            Top Up Credits
          </button>
          <span className="text-xs text-gray-500 self-center">WiPay / FAC top-up coming soon</span>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Transaction History</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {transactions.map((tx) => {
              const isDebit = tx.amount < 0
              const label = TX_LABELS[tx.tx_type] ?? tx.tx_type
              const color = TX_COLORS[tx.tx_type] ?? 'text-gray-400'
              return (
                <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className={`font-medium ${color}`}>{label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{formatDate(tx.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isDebit ? 'text-red-400' : 'text-green-400'}`}>
                      {isDebit ? '-' : '+'}{formatCents(Math.abs(tx.amount))}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Balance: {formatCents(tx.balance_after)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
