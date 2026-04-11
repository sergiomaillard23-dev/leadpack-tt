import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail } from '@/lib/db/agents'
import { getTemplates } from '@/lib/db/templates'
import { TemplatesManager } from '@/components/pro/TemplatesManager'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')

  const agent = await getAgentByEmail(user.email)
  if (!agent) redirect('/login')

  const templates = await getTemplates(agent.id)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">WhatsApp Templates</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Saved messages used when reaching out to leads. Supports{' '}
          <code className="text-indigo-400 text-xs bg-gray-800 px-1 py-0.5 rounded">{'{{firstName}}'}</code>,{' '}
          <code className="text-indigo-400 text-xs bg-gray-800 px-1 py-0.5 rounded">{'{{lastName}}'}</code>,{' '}
          <code className="text-indigo-400 text-xs bg-gray-800 px-1 py-0.5 rounded">{'{{policyInterest}}'}</code>
        </p>
      </div>
      <TemplatesManager initialTemplates={templates} />
    </div>
  )
}
