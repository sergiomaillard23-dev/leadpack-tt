import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllAgents } from '@/lib/db/agents'
import ProToggle from '@/components/admin/ProToggle'
import Link from 'next/link'

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .includes(email)
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-TT', {
    timeZone: 'America/Port_of_Spain',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatBalance(cents: number) {
  return `TT$${(cents / 100).toLocaleString('en-TT', { minimumFractionDigits: 2 })}`
}

const KYC_COLORS: Record<string, string> = {
  APPROVED: 'text-green-400',
  PENDING:  'text-yellow-400',
  REJECTED: 'text-red-400',
}

export default async function AdminAgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) redirect('/marketplace')

  const agents = await getAllAgents()

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Agents</h1>
            <p className="text-gray-400 text-sm mt-1">{agents.length} registered</p>
          </div>
          <Link
            href="/admin/kyc"
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            ← KYC Review
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-5 py-3 text-left text-gray-400 font-medium">Name</th>
                <th className="px-5 py-3 text-left text-gray-400 font-medium">Email</th>
                <th className="px-5 py-3 text-left text-gray-400 font-medium">KYC</th>
                <th className="px-5 py-3 text-left text-gray-400 font-medium">Balance</th>
                <th className="px-5 py-3 text-left text-gray-400 font-medium">Joined</th>
                <th className="px-5 py-3 text-center text-gray-400 font-medium">Subscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 text-white font-medium">{agent.full_name}</td>
                  <td className="px-5 py-3 text-gray-400">{agent.email}</td>
                  <td className={`px-5 py-3 font-medium ${KYC_COLORS[agent.kyc_status] ?? 'text-gray-400'}`}>
                    {agent.kyc_status}
                  </td>
                  <td className="px-5 py-3 text-gray-300">{formatBalance(agent.wallet_balance)}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(agent.created_at)}</td>
                  <td className="px-5 py-3 text-center">
                    <ProToggle agentId={agent.id} isPro={agent.is_subscribed} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
