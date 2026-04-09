import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail } from '@/lib/db/agents'
import { KycUploadForm } from '@/components/kyc/KycUploadForm'

export default async function KycPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')

  const agent = await getAgentByEmail(user.email).catch(() => null)
  if (!agent) redirect('/login')

  // Already approved — send to marketplace
  if (agent.kyc_status === 'APPROVED') redirect('/marketplace')

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Verify Your Account</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Upload your insurance licence and two forms of government ID to access the marketplace.
            An admin will review your submission within 48 hours.
          </p>
        </div>
        <KycUploadForm
          kycStatus={agent.kyc_status}
          rejectedReason={agent.kyc_rejected_reason}
        />
      </div>
    </div>
  )
}
