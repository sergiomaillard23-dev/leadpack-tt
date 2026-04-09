import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail } from '@/lib/db/agents'
import { KycUploadForm } from '@/components/kyc/KycUploadForm'

export default async function KycPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')

  const agent = await getAgentByEmail(user.email).catch((err) => {
    console.error('[onboarding/kyc] getAgentByEmail failed', err)
    return null
  })
  if (!agent) redirect('/login')

  // Already approved — send to marketplace
  if (agent.kyc_status === 'APPROVED') redirect('/marketplace')

  // Already submitted — show waiting state server-side (no need to ship the upload form bundle)
  if (agent.kyc_status === 'PENDING') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Verify Your Account</h1>
            <p className="text-gray-400 mt-2 text-sm">
              Upload your insurance licence and two forms of government ID to access the marketplace.
              An admin will review your submission within 48 hours.
            </p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-900 p-8">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-1">Documents submitted</p>
            <p className="text-gray-400 text-sm">Your submission is under review. We will notify you within 48 hours.</p>
          </div>
        </div>
      </div>
    )
  }

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
          kycStatus="REJECTED"
          rejectedReason={agent.kyc_rejected_reason}
        />
      </div>
    </div>
  )
}
