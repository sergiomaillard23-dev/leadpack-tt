'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PHONE_REGEX } from '@/lib/constants'

export default function RegisterPage() {
  const supabase = createClient()
  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!PHONE_REGEX.test(phone)) {
      setError('Phone must be in format 1-868-XXX-XXXX')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, phone },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors'

  if (sent) {
    return (
      <div className="text-center">
        <p className="text-white font-semibold text-lg mb-2">Check your email</p>
        <p className="text-gray-400 text-sm">
          We sent a confirmation link to <span className="text-white">{email}</span>.
          Click it to activate your account.
        </p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Create your account</h1>
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input type="text" placeholder="Full name" value={name}
          onChange={(e) => setName(e.target.value)} required minLength={2} className={inputClass} />
        <div>
          <input type="text" placeholder="Phone (1-868-XXX-XXXX)" value={phone}
            onChange={(e) => setPhone(e.target.value)} required className={inputClass} />
          <p className="text-xs text-gray-600 mt-1 ml-1">T&T numbers only</p>
        </div>
        <input type="email" placeholder="Email address" value={email}
          onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
        <input type="password" placeholder="Password (min 8 characters)" value={password}
          onChange={(e) => setPassword(e.target.value)} minLength={8} required className={inputClass} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold disabled:opacity-50 transition-colors">
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <p className="text-center text-gray-500 text-sm mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
      </p>
    </>
  )
}
