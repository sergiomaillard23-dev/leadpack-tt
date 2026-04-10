'use client'

import { useState } from 'react'

interface WhatsAppButtonProps {
  leadId: string
  isPro: boolean
}

export default function WhatsAppButton({ leadId, isPro }: WhatsAppButtonProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  if (!isPro) {
    return (
      <span
        title="Upgrade to Pro to send WhatsApp messages"
        className="text-xs text-gray-600 cursor-not-allowed select-none"
      >
        WA ↑Pro
      </span>
    )
  }

  if (status === 'sent') {
    return <span className="text-xs text-green-400 font-medium">Sent ✓</span>
  }

  const handleSend = async () => {
    setStatus('sending')
    setError(null)
    try {
      const res = await fetch('/api/outreach/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Send failed')
        setStatus('error')
      } else {
        setStatus('sent')
      }
    } catch {
      setError('Network error')
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSend}
        disabled={status === 'sending'}
        className="text-xs px-2.5 py-1 rounded-lg bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
      >
        {status === 'sending' ? 'Sending…' : status === 'error' ? 'Retry' : '📱 WhatsApp'}
      </button>
      {error && <p className="text-[10px] text-red-400 max-w-[120px] text-right">{error}</p>}
    </div>
  )
}
