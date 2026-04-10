import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail } from '@/lib/db/agents'
import { getPurchasedPacks, getJournalStats } from '@/lib/db/journal'

function formatCents(cents: number) {
  return `TT$${(cents / 100).toLocaleString('en-TT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-TT', {
    timeZone: 'America/Port_of_Spain',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const PACK_TYPE_BADGE: Record<string, string> = {
  EXCLUSIVE: 'bg-purple-900 text-purple-300 border border-purple-700',
  COMMUNITY: 'bg-blue-900 text-blue-300 border border-blue-700',
  exclusive: 'bg-purple-900 text-purple-300 border border-purple-700',
  community: 'bg-blue-900 text-blue-300 border border-blue-700',
}

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const agent = await getAgentByEmail(user.email!).catch(() => null)
  if (!agent) redirect('/login')

  const [packs, stats] = await Promise.all([
    getPurchasedPacks(agent.id).catch(() => []),
    getJournalStats(agent.id).catch(() => ({ total_spent_ttd: 0, packs_purchased: 0, total_leads: 0 })),
  ])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Journal</h1>
        <p className="text-gray-400 mt-1">Your purchased packs and leads</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-white">{formatCents(stats.total_spent_ttd)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Packs Purchased</p>
          <p className="text-2xl font-bold text-white">{stats.packs_purchased}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Leads</p>
          <p className="text-2xl font-bold text-white">{stats.total_leads}</p>
        </div>
      </div>

      {/* Pack list */}
      {packs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-20 text-center">
          <p className="text-gray-400 font-medium">No packs purchased yet</p>
          <p className="text-gray-600 text-sm mt-1">Head to the marketplace to crack your first pack.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {packs.map((pack) => (
            <div key={pack.purchase_id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-900 border border-indigo-700 flex items-center justify-center">
                    <span className="text-indigo-300 font-bold text-lg">{pack.pack_label}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">Pack {pack.pack_label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PACK_TYPE_BADGE[pack.pack_type] ?? 'bg-gray-800 text-gray-400'}`}>
                        {pack.pack_type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Purchased {formatDate(pack.purchased_at)} · {pack.lead_count} leads
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{formatCents(pack.amount_ttd)}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {pack.purchase_type.charAt(0).toUpperCase() + pack.purchase_type.slice(1).toLowerCase()} purchase
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                <span className="text-gray-600 text-xs">Pack ID: {pack.pack_id.slice(0, 8)}…</span>
                <a
                  href={`/journal/${pack.pack_id}`}
                  className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                >
                  View {pack.lead_count} leads →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
