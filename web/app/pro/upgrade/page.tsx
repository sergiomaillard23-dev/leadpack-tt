import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail, isActivePro } from '@/lib/db/agents'
import { getDocuments } from '@/lib/db/kyc'
import { UpgradeForm } from '@/components/pro/UpgradeForm'

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')

  const agent = await getAgentByEmail(user.email)
  if (!agent) redirect('/login')
  if (isActivePro(agent)) redirect('/pro/pipeline')

  const kycDocs = await getDocuments(agent.id)
  const kycApproved = agent.kyc_status === 'APPROVED'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-3">
            LEGENDARY PRO
          </span>
          <h1 className="text-2xl font-bold text-white">Upgrade to Legendary Pro</h1>
          <p className="text-gray-400 mt-2 text-sm">TT$5,000 / year · Billed annually</p>
        </div>
        <UpgradeForm
          defaultName={agent.full_name}
          defaultEmail={agent.email}
          kycApproved={kycApproved}
          kycDocs={kycDocs.map(d => d.doc_type)}
        />
      </div>
    </div>
  )
}
