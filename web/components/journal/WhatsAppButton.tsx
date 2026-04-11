'use client'
import { useState } from 'react'
import { WhatsAppModal } from '@/components/pro/WhatsAppModal'

interface Props {
  phone: string
  fullName: string
  isPro: boolean
}

export default function WhatsAppButton({ phone, fullName, isPro }: Props) {
  const [showModal, setShowModal] = useState(false)

  if (!isPro) {
    return (
      <span title="Upgrade to Pro to send WhatsApp messages"
        className="text-xs text-gray-600 cursor-not-allowed select-none">
        WA ↑Pro
      </span>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-xs px-2.5 py-1 rounded-lg bg-green-700 hover:bg-green-600 text-white font-medium transition-colors"
      >
        📱 WhatsApp
      </button>
      {showModal && (
        <WhatsAppModal
          lead={{ phone, full_name: fullName }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
