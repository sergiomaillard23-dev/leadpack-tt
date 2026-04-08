'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      router.push('/marketplace')
      router.refresh()
    }
    setLoading(false)
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors'

  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Create your account</h1>
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input type="email" placeholder="Email address" value={email}
          onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
        <input type="password" placeholder="Password (min 6 characters)" value={password}
          onChange={(e) => setPassword(e.target.value)} minLength={6} required className={inputClass} />
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
