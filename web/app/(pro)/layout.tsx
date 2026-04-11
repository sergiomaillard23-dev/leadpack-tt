import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail, isActivePro } from '@/lib/db/agents'

/**
 * Guards all /pro/* pages (pipeline, analytics, subscriptions, templates).
 * /pro/upgrade lives outside this group and is accessible to all logged-in agents.
 */
export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) redirect('/login')

  const agent = await getAgentByEmail(user.email).catch(() => null)

  if (!agent || !isActivePro(agent)) {
    redirect('/pro/upgrade')
  }

  return <>{children}</>
}
