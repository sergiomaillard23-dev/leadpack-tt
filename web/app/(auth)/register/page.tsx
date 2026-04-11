'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { normalizePhone } from '@/lib/utils'

// ── Document config ───────────────────────────────────────────────────────────

const DOCS = [
  {
    field: 'INSURANCE_LICENSE',
    label: 'State Insurance License',
    hint:  'Current, valid T&T state insurance license (CLICO, Sagicor, Guardian, etc.)',
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 10c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    field: 'GOVERNMENT_ID_1',
    label: 'Government ID #1',
    hint:  "Passport, driver's permit, or national ID card",
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
      </svg>
    ),
  },
  {
    field: 'GOVERNMENT_ID_2',
    label: 'Government ID #2',
    hint:  'A second form of government-issued photo ID',
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
      </svg>
    ),
  },
] as const

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [step, setStep]         = useState<1 | 2>(1)
  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany]   = useState('')
  const [companyOther, setCompanyOther] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)
  const formRef                 = useRef<HTMLFormElement>(null)

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white ' +
    'placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors'

  // Step 1 → 2: validate account fields only
  function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!normalizePhone(phone)) {
      setError('Enter a valid T&T number — e.g. 18681234567 or 868-123-4567')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step 2 submit: send everything to the server
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('name',     name)
      formData.append('phone',    phone)
      formData.append('email',    email)
      formData.append('password', password)
      formData.append('company',  company === 'Other' ? companyOther.trim() : company)

      // Collect files from the current form's file inputs
      const form = formRef.current!
      for (const { field } of DOCS) {
        const input = form.querySelector<HTMLInputElement>(`input[name="${field}"]`)
        const file  = input?.files?.[0]
        if (file) formData.append(field, file)
      }

      const res  = await fetch('/api/auth/register', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error ?? 'Registration failed. Please try again.')
        setLoading(false)
      } else {
        setSent(true)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-indigo-500/15 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-lg">Check your email</p>
          <p className="text-gray-400 text-sm mt-1">
            We sent a confirmation link to{' '}
            <span className="text-white font-medium">{email}</span>.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Click it to activate your account.
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-left">
          <p className="text-xs font-semibold text-gray-300 mb-1">Documents submitted</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Your insurance license and government IDs have been uploaded.
            An admin will review your submission within 48 hours of you confirming your email.
          </p>
        </div>
      </div>
    )
  }

  // ── Step indicator ────────────────────────────────────────────────────────

  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-6">
      {([1, 2] as const).map(n => (
        <div key={n} className="flex items-center gap-2 flex-1">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
              step >= n ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-500'
            }`}
          >
            {step > n ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : n}
          </div>
          {n < 2 && <div className={`flex-1 h-0.5 rounded ${step > n ? 'bg-indigo-600' : 'bg-gray-700'}`} />}
        </div>
      ))}
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <StepIndicator />

      <h1 className="text-2xl font-bold text-white mb-1 text-center">
        {step === 1 ? 'Create your account' : 'Verify your identity'}
      </h1>
      <p className="text-center text-gray-500 text-sm mb-6">
        {step === 1
          ? 'Step 1 of 2 — Account details'
          : 'Step 2 of 2 — Required to access the marketplace'}
      </p>

      <form
        ref={formRef}
        onSubmit={step === 1 ? handleContinue : handleSubmit}
        className="flex flex-col gap-4"
      >
        {/* ── Step 1: Account details ─────────────────────────────────── */}
        {step === 1 && (
          <>
            <input
              type="text" placeholder="Full name" value={name}
              onChange={e => setName(e.target.value)}
              required minLength={2} className={inputClass}
            />
            <div>
              <input
                type="tel" placeholder="Phone (e.g. 18681234567 or 868-123-4567)" value={phone}
                onChange={e => setPhone(e.target.value)}
                required className={inputClass}
              />
              <p className="text-xs text-gray-600 mt-1 ml-1">Any T&T format accepted — we&apos;ll normalise it</p>
            </div>
            <input
              type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)}
              required className={inputClass}
            />
            <input
              type="password" placeholder="Password (min 8 characters)" value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8} required className={inputClass}
            />
            <div className="flex flex-col gap-2">
              <select
                value={company}
                onChange={e => { setCompany(e.target.value); setCompanyOther('') }}
                required
                className={`${inputClass} appearance-none`}
              >
                <option value="" disabled>Select your company / employer</option>
                <option value="Guardian Life">Guardian Life</option>
                <option value="Maritime Insurance">Maritime Insurance</option>
                <option value="Pan American Life Insurance Co. TT">Pan American Life Insurance Co. TT</option>
                <option value="Sagicor">Sagicor</option>
                <option value="TATIL">TATIL</option>
                <option value="Broker">Broker (Independent)</option>
                <option value="Other">Other — type below</option>
              </select>
              {company === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter your company name"
                  value={companyOther}
                  onChange={e => setCompanyOther(e.target.value)}
                  required
                  className={inputClass}
                />
              )}
              <p className="text-xs text-gray-600 ml-1">The insurance company or brokerage you represent</p>
            </div>
          </>
        )}

        {/* ── Step 2: KYC documents ───────────────────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              Upload your documents below. All files are stored securely and reviewed only by
              LeadPack admins. Accepted formats: PDF, JPG, PNG · Max 5 MB per file.
            </p>

            {DOCS.map(({ field, label, hint, icon }) => (
              <div
                key={field}
                className="rounded-xl border border-gray-700 bg-gray-800/40 p-4 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{hint}</p>
                  </div>
                </div>
                <input
                  type="file"
                  name={field}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="block w-full text-sm text-gray-400
                    file:mr-3 file:py-2 file:px-3
                    file:rounded-md file:border-0
                    file:text-xs file:font-semibold
                    file:bg-indigo-600 file:text-white
                    hover:file:bg-indigo-500
                    file:cursor-pointer cursor-pointer
                    file:transition-colors"
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────── */}
        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className={`flex gap-3 ${step === 2 ? 'mt-1' : ''}`}>
          {step === 2 && (
            <button
              type="button"
              onClick={() => { setStep(1); setError(null) }}
              className="flex-none px-5 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 font-semibold transition-colors text-sm"
            >
              ← Back
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold disabled:opacity-50 transition-colors text-sm"
          >
            {step === 1
              ? 'Continue →'
              : loading
                ? 'Creating account…'
                : 'Create Account'}
          </button>
        </div>
      </form>

      {step === 1 && (
        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      )}
    </>
  )
}
