import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail } from '@/lib/db/agents'
import { getPipelineLeads } from '@/lib/db/pipeline'
import { PipelineBoard } from '@/components/pro/PipelineBoard'
import { ExportCsvButton } from '@/components/pro/ExportCsvButton'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')

  const agent = await getAgentByEmail(user.email)
  if (!agent) redirect('/login')

  const leads = await getPipelineLeads(agent.id)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {leads.length} lead{leads.length !== 1 ? 's' : ''} across all your packs
          </p>
        </div>
        <ExportCsvButton />
      </div>
      <PipelineBoard initialLeads={leads} />
    </div>
  )
}
