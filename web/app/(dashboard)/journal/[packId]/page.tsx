import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail, isActivePro } from '@/lib/db/agents'
import { getLeadsForPack, getPurchasedPacks } from '@/lib/db/journal'
import WhatsAppButton from '@/components/journal/WhatsAppButton'
import Link from 'next/link'

function formatIncome(cents: number | null) {
  if (!cents) return '—'
  return `TT$${(cents).toLocaleString('en-TT')}/mo`
}

export default async function PackLeadsPage({ params }: { params: { packId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const agent = await getAgentByEmail(user.email!).catch(() => null)
  if (!agent) redirect('/login')

  // Verify this agent owns this pack
  const packs = await getPurchasedPacks(agent.id).catch(() => [])
  const pack = packs.find((p) => p.pack_id === params.packId)
  if (!pack) notFound()

  const leads = await getLeadsForPack(params.packId).catch(() => [])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/journal" className="text-indigo-400 hover:text-indigo-300 text-sm">
          ← Back to Journal
        </Link>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-900 border border-indigo-700 flex items-center justify-center">
          <span className="text-indigo-300 font-bold text-xl">{pack.pack_label}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Pack {pack.pack_label} — {pack.pack_type.toUpperCase()}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{leads.length} leads</p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-16 text-center">
          <p className="text-gray-500">No leads found for this pack.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-5 py-3 text-left text-gray-400 font-medium">#</th>
                <th className="px-5 py-3 text-left text-gray-400 font-medium">Name</th>
                <th className="px-5 py-3 text-left text-gray-400 font-medium">Phone</th>
                <th className="px-5 py-3 text-left text-gray-400 font-medium">Parish</th>
                <th className="px-5 py-3 text-left text-gray-400 font-medium">Est. Income</th>
                <th className="px-5 py-3 text-left text-gray-400 font-medium">Source</th>
                <th className="px-5 py-3 text-right text-gray-400 font-medium">Outreach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {leads.map((lead, i) => (
                <tr key={lead.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3 text-gray-600">{i + 1}</td>
                  <td className="px-5 py-3 text-white font-medium">{lead.full_name}</td>
                  <td className="px-5 py-3 text-gray-300">{lead.phone}</td>
                  <td className="px-5 py-3 text-gray-400">{lead.parish ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-400">
                    {lead.estimated_income_ttd
                      ? <span className={lead.estimated_income_ttd >= 25000 ? 'text-amber-400 font-medium' : ''}>
                          {formatIncome(lead.estimated_income_ttd)}
                        </span>
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{lead.source ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <WhatsAppButton phone={lead.phone} fullName={lead.full_name} isPro={isActivePro(agent)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
