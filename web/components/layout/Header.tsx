'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface HeaderProps {
  agentEmail: string
  walletBalanceCents: number
}

export function Header({ agentEmail, walletBalanceCents }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-gray-950 shrink-0">
      <Link href="/marketplace" className="text-lg font-bold text-white tracking-tight">
        LeadPack <span className="text-indigo-400">T&amp;T</span>
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700">
          <span className="text-xs text-gray-400">Wallet</span>
          <span className="text-sm font-semibold text-white">
            {formatCurrency(walletBalanceCents)}
          </span>
        </div>
        <span className="text-sm text-gray-400 hidden sm:block">{agentEmail}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
