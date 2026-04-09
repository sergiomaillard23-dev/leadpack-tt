'use client'
import { useState, useRef } from 'react'

interface Props {
  kycStatus: 'PENDING' | 'REJECTED'
  rejectedReason: string | null
}

const DOCS = [
  { field: 'INSURANCE_LICENSE', label: 'Insurance Licence',  hint: "Current, valid T&T insurance licence" },
  { field: 'GOVERNMENT_ID_1',   label: 'Government ID #1',   hint: "Passport, driver's permit, or national ID" },
  { field: 'GOVERNMENT_ID_2',   label: 'Government ID #2',   hint: 'A second form of photo ID' },
] as const

export function KycUploadForm({ kycStatus, rejectedReason }: Props) {
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'submitted'>(
    kycStatus === 'PENDING' ? 'submitted' : 'idle'
  )
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  if (phase === 'submitted') {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-white font-semibold mb-1">Documents submitted</p>
        <p className="text-gray-400 text-sm">Your submission is under review. We will notify you within 48 hours.</p>
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
      } else {
        setPhase('submitted')
      }
    } catch {
      setError('Network error. Please try again.')
      setPhase('idle')
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}
      className="rounded-xl border border-gray-700 bg-gray-900 p-6 flex flex-col gap-5">

      {kycStatus === 'REJECTED' && rejectedReason && (
        <div className="rounded-lg bg-red-950/40 border border-red-800/40 px-4 py-3">
          <p className="text-red-400 text-sm font-semibold mb-0.5">Submission rejected</p>
          <p className="text-red-300 text-xs">{rejectedReason}</p>
          <p className="text-gray-500 text-xs mt-1">Please re-upload corrected documents below.</p>
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
        {phase === 'submitting' ? 'Uploading\u2026' : 'Submit for Review'}
      </button>

      <p className="text-center text-xs text-gray-600">PDF, JPG, or PNG · Max 5MB per file</p>
    </form>
  )
}
