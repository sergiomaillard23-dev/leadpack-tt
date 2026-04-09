'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Tab = 'password' | 'magic-link'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  const supabase = createClient()

  function switchTab(t: Tab) {
    setTab(t)
    setError(null)
    setMagicSent(false)
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/marketplace')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      setMagicSent(true)
    }
    setLoading(false)
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors'
  const btnClass =
    'w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold disabled:opacity-50 transition-colors'

  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Sign in to LeadPack</h1>

      <div className="flex rounded-lg bg-gray-800 p-1 mb-6">
        {(['password', 'magic-link'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'password' ? 'Password' : 'Magic Link'}
          </button>
        ))}
      </div>

      {tab === 'password' ? (
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
          <input type="email" placeholder="Email address" value={email}
            onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
          <input type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required className={inputClass} />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className={btnClass}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
          {magicSent ? (
            <p className="text-green-400 text-center py-4">
              Check your inbox — we sent a sign-in link to <strong>{email}</strong>.
            </p>
          ) : (
            <>
              <input type="email" placeholder="Email address" value={email}
                onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? 'Sending…' : 'Send Magic Link'}
              </button>
            </>
          )}
        </form>
      )}

      <p className="text-center text-gray-500 text-sm mt-6">
        No account?{' '}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
          Create one
        </Link>
      </p>
    </>
  )
}
