'use client'
import { useState, useRef } from 'react'

interface Props {
  kycStatus: 'REJECTED'
  rejectedReason: string | null
}

const DOCS = [
  { field: 'INSURANCE_LICENSE', label: 'Insurance Licence',  hint: "Current, valid T&T insurance licence" },
  { field: 'GOVERNMENT_ID_1',   label: 'Government ID #1',   hint: "Passport, driver's permit, or national ID" },
  { field: 'GOVERNMENT_ID_2',   label: 'Government ID #2',   hint: 'A second form of photo ID' },
] as const

type Phase = 'idle' | 'submitting' | 'approved' | 'pending' | 'rejected'

export function KycUploadForm({ kycStatus, rejectedReason }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  // Holds the rejection reason returned by the AI (distinct from the initial prop)
  const [aiRejectionReason, setAiRejectionReason] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  if (phase === 'approved') {
    return (
      <div className="rounded-xl border border-green-800/40 bg-green-950/30 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white font-semibold mb-1">Verification approved</p>
        <p className="text-gray-400 text-sm mb-5">Your account is active. Welcome to LeadPack T&T.</p>
        <a href="/marketplace"
          className="inline-block px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
          Go to Marketplace
        </a>
      </div>
    )
  }

  if (phase === 'pending') {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-white font-semibold mb-1">Under manual review</p>
        <p className="text-gray-400 text-sm">Your documents have been flagged for a manual check. An admin will review your submission and notify you within 48 hours.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPhase('submitting')

    try {
      const formData = new FormData(formRef.current!)
      const res = await fetch('/api/kyc/submit', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error ?? 'Upload failed. Please try again.')
        setPhase('idle')
        return
      }

      if (json.kycStatus === 'APPROVED') {
        setPhase('approved')
      } else if (json.kycStatus === 'REJECTED') {
        setAiRejectionReason(json.reason ?? null)
        setPhase('idle')
      } else {
        // PENDING — manual review
        setPhase('pending')
      }
    } catch {
      setError('Network error. Please try again.')
      setPhase('idle')
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}
      className="rounded-xl border border-gray-700 bg-gray-900 p-6 flex flex-col gap-5">

      {/* Initial rejection reason (from server — shown before first resubmission) */}
      {kycStatus === 'REJECTED' && !aiRejectionReason && phase === 'idle' && (
        <div className="rounded-lg bg-red-950/40 border border-red-800/40 px-4 py-3">
          <p className="text-red-400 text-sm font-semibold mb-0.5">Submission rejected</p>
          {rejectedReason
            ? <p className="text-red-300 text-xs">{rejectedReason}</p>
            : null}
          <p className="text-gray-500 text-xs mt-1">Please re-upload corrected documents below.</p>
        </div>
      )}

      {/* AI rejection reason (from latest resubmission) */}
      {aiRejectionReason && phase === 'idle' && (
        <div className="rounded-lg bg-red-950/40 border border-red-800/40 px-4 py-3">
          <p className="text-red-400 text-sm font-semibold mb-0.5">Verification failed</p>
          <p className="text-red-300 text-xs">{aiRejectionReason}</p>
          <p className="text-gray-500 text-xs mt-1">Please correct the issue above and re-upload.</p>
        </div>
      )}

      {DOCS.map(({ field, label, hint }) => (
        <div key={field} className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-300">{label}</label>
          <p className="text-xs text-gray-600">{hint}</p>
          <input
            type="file"
            name={field}
            accept=".pdf,.jpg,.jpeg,.png"
            required
            className="block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-600 file:text-white
              hover:file:bg-indigo-500
              file:cursor-pointer cursor-pointer"
          />
        </div>
      ))}

      {error && (
        <p className="text-red-400 text-sm bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button type="submit" disabled={phase === 'submitting'}
        className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-colors">
        {phase === 'submitting' ? 'Verifying\u2026' : 'Submit for Verification'}
      </button>

      <p className="text-center text-xs text-gray-600">PDF, JPG, or PNG · Max 5MB per file</p>
    </form>
  )
}
