'use client'
import { useState } from 'react'

interface Props {
  defaultName: string
  defaultEmail: string
  kycApproved: boolean
  kycDocs: string[]
}

const DOC_LABELS: Record<string, string> = {
  INSURANCE_LICENSE: 'Insurance Licence',
  GOVERNMENT_ID_1:   'Government ID #1',
  GOVERNMENT_ID_2:   'Government ID #2',
}

const inputClass =
  'w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm ' +
  'placeholder-gray-500 focus:outline-none focus:border-indigo-500'

export function UpgradeForm({ defaultName, defaultEmail, kycApproved, kycDocs }: Props) {
  const [step, setStep]     = useState(1)
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [fullName, setFullName]   = useState(defaultName)
  const [email, setEmail]         = useState(defaultEmail)
  const [line1, setLine1]         = useState('')
  const [line2, setLine2]         = useState('')
  const [city, setCity]           = useState('')
  const [country, setCountry]     = useState('Trinidad and Tobago')

  async function handlePay() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/pro/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, billingLine1: line1, billingLine2: line2, city, country }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      // Redirect to WiPay (or mock) checkout page.
      window.location.href = json.checkoutUrl
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-6">
        {['Account', 'Identity', 'Billing', 'Review'].map((label, i) => {
          const n = i + 1
          const active = step === n
          const done   = step > n
          return (
            <div key={label} className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${done   ? 'bg-amber-500 text-gray-950'  : ''}
                ${active ? 'bg-indigo-600 text-white'     : ''}
                ${!done && !active ? 'bg-gray-800 text-gray-500' : ''}`}>
                {done ? '✓' : n}
              </div>
              <span className={`text-xs ${active ? 'text-white' : 'text-gray-500'}`}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* Step 1 — Account info */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Full name</label>
            <input className={inputClass} value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Email</label>
            <input className={inputClass} type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <button
            onClick={() => { if (fullName.trim() && email.trim()) setStep(2) }}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors mt-2">
            Continue
          </button>
        </div>
      )}

      {/* Step 2 — Identity / KYC */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          {kycApproved ? (
            <>
              <div className="rounded-lg bg-green-950/40 border border-green-800/40 px-4 py-3">
                <p className="text-green-400 text-sm font-semibold mb-1">Identity already verified</p>
                <p className="text-gray-400 text-xs">Your KYC documents on file will be used for this application.</p>
              </div>
              <ul className="space-y-2">
                {kycDocs.map(doc => (
                  <li key={doc} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-green-400">✓</span> {DOC_LABELS[doc] ?? doc}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="rounded-lg bg-yellow-950/40 border border-yellow-800/40 px-4 py-3">
              <p className="text-yellow-400 text-sm font-semibold mb-1">KYC not yet approved</p>
              <p className="text-gray-400 text-xs">
                Please complete identity verification before upgrading.{' '}
                <a href="/onboarding/kyc" className="text-indigo-400 underline">Go to verification</a>
              </p>
            </div>
          )}
          <div className="flex gap-3 mt-2">
            <button onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-300 text-sm hover:border-gray-500 transition-colors">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!kycApproved}
              className="flex-1 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-sm transition-colors">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Billing address */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Address line 1</label>
            <input className={inputClass} placeholder="123 Main Street" value={line1} onChange={e => setLine1(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Address line 2 <span className="text-gray-600">(optional)</span></label>
            <input className={inputClass} placeholder="Apartment, suite, etc." value={line2} onChange={e => setLine2(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">City / Town</label>
            <input className={inputClass} placeholder="Port of Spain" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Country</label>
            <input className={inputClass} value={country} onChange={e => setCountry(e.target.value)} />
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-300 text-sm hover:border-gray-500 transition-colors">
              Back
            </button>
            <button
              onClick={() => { if (line1.trim() && city.trim()) setStep(4) }}
              className="flex-1 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Review & Pay */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-gray-800/60 border border-gray-700 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Name</span><span className="text-white">{fullName}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Email</span><span className="text-white">{email}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Address</span>
              <span className="text-white text-right">
                {line1}{line2 ? `, ${line2}` : ''}<br />{city}, {country}
              </span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between font-semibold">
              <span className="text-gray-300">Total</span>
              <span className="text-amber-400 text-base">TT$5,000.00</span>
            </div>
            <p className="text-gray-600 text-xs">Annual membership · 365 days from activation · No auto-renewal</p>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} disabled={loading}
              className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-300 text-sm hover:border-gray-500 transition-colors disabled:opacity-40">
              Back
            </button>
            <button onClick={handlePay} disabled={loading}
              className="flex-1 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-bold text-sm transition-colors">
              {loading ? 'Redirecting\u2026' : 'Pay with WiPay'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
