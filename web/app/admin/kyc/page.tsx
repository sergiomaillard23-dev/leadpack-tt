import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPendingAgents } from '@/lib/db/kyc'
import { getSignedUrl } from '@/lib/supabase/storage'
import { AdminKycTable } from '@/components/admin/AdminKycTable'
import Link from 'next/link'

type PendingAgent = {
  id: string
  full_name: string
  email: string
  phone: string
  kyc_status: string
  created_at: Date
  docs: { doc_type: string; signed_url: string }[]
}

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .includes(email)
}

export default async function AdminKycPage() {
  let userEmail: string | undefined
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userEmail = user?.email
  } catch {
    redirect('/login')
  }
  if (!isAdmin(userEmail)) redirect('/marketplace')

  const rows = await getPendingAgents()

  // Group rows by agent, generate signed URLs
  const agentMap = new Map<string, PendingAgent>()
  for (const row of rows) {
    if (!agentMap.has(row.id)) {
      agentMap.set(row.id, {
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        kyc_status: row.kyc_status,
        created_at: row.created_at,
        docs: [],
      })
    }
    if (row.doc_type && row.storage_path) {
      const signed_url = await getSignedUrl(row.storage_path).catch(() => '#')
      agentMap.get(row.id)!.docs.push({ doc_type: row.doc_type, signed_url })
    }
  }

  const agents = Array.from(agentMap.values())

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">KYC Review</h1>
          <Link
            href="/admin/agents"
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Manage Agents →
          </Link>
        </div>
        <p className="text-gray-400 text-sm mb-8">
          {agents.length} submission{agents.length !== 1 ? 's' : ''} awaiting review
        </p>
        <AdminKycTable agents={agents} />
      </div>
    </div>
  )
}
