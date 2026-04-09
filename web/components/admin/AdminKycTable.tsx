'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Doc = { doc_type: string; signed_url: string }
type Agent = { id: string; full_name: string; email: string; phone: string; kyc_status: string; created_at: Date | string; docs: Doc[] }

const DOC_LABELS: Record<string, string> = {
  INSURANCE_LICENSE: 'Licence',
  GOVERNMENT_ID_1: 'ID #1',
  GOVERNMENT_ID_2: 'ID #2',
}

export function AdminKycTable({ agents }: { agents: Agent[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleAction(agentId: string, action: 'APPROVE' | 'REJECT', rejectReason?: string) {
    setBusy(agentId)
    setActionError(null)
    try {
      const res = await fetch(`/api/admin/kyc/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: rejectReason }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setActionError(json.error ?? 'Action failed. Please try again.')
        return
      }
      setRejectTarget(null)
      setReason('')
      router.refresh()
    } catch {
      setActionError('Network error. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  if (agents.length === 0) {
    return <p className="text-gray-500 text-sm">No pending submissions.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {actionError && (
        <div className="mb-4 rounded-lg bg-red-950/40 border border-red-800/40 px-4 py-3 flex items-center justify-between">
          <p className="text-red-400 text-sm">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-gray-500 hover:text-gray-300 text-xs ml-4">Dismiss</button>
        </div>
      )}
      {agents.map((agent) => (
        <div key={agent.id}
          className="rounded-xl border border-gray-700 bg-gray-900 p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white font-semibold">{agent.full_name}</p>
              <p className="text-gray-400 text-sm">{agent.email} · {agent.phone}</p>
              <p className="text-gray-600 text-xs mt-0.5">
                Submitted {new Date(agent.created_at).toLocaleDateString('en-TT', { timeZone: 'America/Port_of_Spain', year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
              agent.kyc_status === 'REJECTED'
                ? 'bg-red-900/50 text-red-400'
                : 'bg-yellow-900/50 text-yellow-400'
            }`}>
              {agent.kyc_status}
            </span>
          </div>

          <div className="flex gap-3 flex-wrap">
            {agent.docs.map((doc) => (
              <a key={doc.doc_type} href={doc.signed_url} target="_blank" rel="noreferrer"
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 text-indigo-400 hover:text-indigo-300 border border-gray-700 transition-colors">
                View {DOC_LABELS[doc.doc_type] ?? doc.doc_type} ↗
              </a>
            ))}
            {agent.docs.length === 0 && (
              <p className="text-xs text-gray-600">No documents uploaded yet.</p>
            )}
          </div>

          {rejectTarget === agent.id ? (
            <div className="flex flex-col gap-2">
              <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for rejection (shown to agent)…"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => handleAction(agent.id, 'REJECT', reason)}
                  disabled={!reason.trim() || busy === agent.id}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                  {busy === agent.id ? 'Saving…' : 'Confirm Reject'}
                </button>
                <button onClick={() => { setRejectTarget(null); setReason('') }}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => handleAction(agent.id, 'APPROVE')}
                disabled={busy === agent.id}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {busy === agent.id ? 'Saving…' : 'Approve'}
              </button>
              <button onClick={() => setRejectTarget(agent.id)}
                disabled={busy === agent.id}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
