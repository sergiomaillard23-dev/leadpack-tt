import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail } from '@/lib/db/agents'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const agent = user?.email
    ? await getAgentByEmail(user.email).catch(() => null)
    : null

  // Gate non-approved agents to KYC flow
  if (agent && agent.kyc_status !== 'APPROVED') {
    redirect('/onboarding/kyc')
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        agentEmail={user.email ?? ''}
        walletBalanceCents={agent?.wallet_balance ?? 0}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  )
}
