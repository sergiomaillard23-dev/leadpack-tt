import { PackCard } from '@/components/packs/PackCard'
import { getAvailablePacks } from '@/lib/db/packs'

export default async function MarketplacePage() {
  const packs = await getAvailablePacks()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Marketplace</h1>
        <p className="text-gray-400 mt-1">
          {packs.length} pack{packs.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {packs.map((pack) => (
          <PackCard key={pack.id} pack={pack} />
        ))}
      </div>
    </div>
  )
}
