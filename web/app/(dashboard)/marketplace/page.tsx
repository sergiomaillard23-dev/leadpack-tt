import { PackCard } from '@/components/packs/PackCard'
import { getAvailablePacks } from '@/lib/db/packs'
import MarketTicker from '@/components/dashboard/MarketTicker'
import NextDropTimer from '@/components/dashboard/NextDropTimer'

export default async function MarketplacePage() {
  const packs = await getAvailablePacks()

  return (
    <div className="max-w-5xl mx-auto">
      <MarketTicker />
      <div className="mt-3 mb-6">
        <NextDropTimer />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Marketplace</h1>
        <p className="text-gray-400 mt-1">
          {packs.length} pack{packs.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {packs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 12h.01" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium">No packs available right now</p>
          <p className="text-gray-600 text-sm mt-1">New packs drop when leads are uploaded. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}
    </div>
  )
}
