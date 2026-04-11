import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail } from '@/lib/db/agents'
import { getSubscriptions } from '@/lib/db/subscriptions'
import { SubscriptionsManager } from '@/components/pro/SubscriptionsManager'

export default async function SubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')

  const agent = await getAgentByEmail(user.email)
  if (!agent) redirect('/login')

  const raw  = await getSubscriptions(agent.id)
  const subs = raw.map(s => ({ ...s, next_delivery_at: s.next_delivery_at.toISOString() }))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Pack Subscriptions</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Auto-deliver packs on a recurring schedule. Packs are queued
          when your cycle fires and deducted from your wallet.
        </p>
      </div>
      <SubscriptionsManager initialSubs={subs} />
    </div>
  )
}
