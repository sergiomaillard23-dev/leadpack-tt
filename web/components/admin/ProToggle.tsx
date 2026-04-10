'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProToggleProps {
  agentId: string
  isPro: boolean
}

export default function ProToggle({ agentId, isPro }: ProToggleProps) {
  const [busy, setBusy] = useState(false)
  const [current, setCurrent] = useState(isPro)
  const router = useRouter()

  const toggle = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: current ? 'REVOKE_PRO' : 'GRANT_PRO' }),
      })
      const json = await res.json()
      if (json.success) {
        setCurrent((p) => !p)
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        current
          ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
      }`}
    >
      {busy ? '…' : current ? 'Pro ✓' : 'Free'}
    </button>
  )
}
