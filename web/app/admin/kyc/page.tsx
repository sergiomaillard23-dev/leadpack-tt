import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import pool from '@/lib/db/client'
import { getSignedUrl } from '@/lib/supabase/storage'
import { AdminKycTable } from '@/components/admin/AdminKycTable'

type PendingAgent = {
  id: string
  full_name: string
  email: string
  phone: string
  kyc_status: string
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) redirect('/marketplace')

  const { rows } = await pool.query<{
    id: string; full_name: string; email: string; phone: string;
    kyc_status: string; doc_type: string | null; storage_path: string | null;
  }>(`
    SELECT a.id, a.full_name, a.email, a.phone, a.kyc_status,
           d.doc_type, d.storage_path
    FROM agents a
    LEFT JOIN kyc_documents d ON d.agent_id = a.id
    WHERE a.kyc_status IN ('PENDING', 'REJECTED')
    ORDER BY a.created_at DESC, d.doc_type ASC
  `)

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
        <h1 className="text-2xl font-bold text-white mb-2">KYC Review</h1>
        <p className="text-gray-400 text-sm mb-8">
          {agents.length} submission{agents.length !== 1 ? 's' : ''} pending
        </p>
        <AdminKycTable agents={agents} />
      </div>
    </div>
  )
}
