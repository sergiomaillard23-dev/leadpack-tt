import ScoutFilters from '@/components/pro/ScoutFilters'
import FreemiumHeatMap from '@/components/marketplace/FreemiumHeatMap'

export default function ProToolsPage() {
  // TODO (Phase 8 — Real DB): replace with agent.subscription_tier from session
  const mockIsPro = false

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Pro Tools</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Advanced features for serious agents.
        </p>
      </div>

      <ScoutFilters isPro={mockIsPro} />
      <FreemiumHeatMap isPro={mockIsPro} />
    </div>
  )
}
