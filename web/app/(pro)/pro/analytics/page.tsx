import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail } from '@/lib/db/agents'
import { getAnalytics } from '@/lib/db/analytics'
import { AnalyticsDashboard } from '@/components/pro/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')

  const agent = await getAgentByEmail(user.email)
  if (!agent) redirect('/login')

  const data = await getAnalytics(agent.id)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Your pipeline performance and lead ROI at a glance.
        </p>
      </div>
      <AnalyticsDashboard data={data} />
    </div>
  )
}
