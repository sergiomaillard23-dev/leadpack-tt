import { PackCard } from '@/components/packs/PackCard'
import { getAvailablePacks } from '@/lib/db/packs'
import MarketTicker from '@/components/dashboard/MarketTicker'
import NextDropTimer from '@/components/dashboard/NextDropTimer'

export default async function MarketplacePage() {
  const packs = await getAvailablePacks()

  // Always show exactly 3 tier slots — one per pack type
  const standard  = packs.find(p => p.pack_name === 'STANDARD')   ?? null
  const premium   = packs.find(p => p.pack_name === 'PREMIUM')     ?? null
  const legendary = packs.find(p => p.pack_name === 'LEGENDARY')   ?? null

  return (
    <div className="max-w-5xl mx-auto">
      <MarketTicker />
      <div className="mt-3 mb-6">
        <NextDropTimer />
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Marketplace</h1>
        <p className="text-gray-400 mt-1 text-sm">Choose your pack — crack it to preview leads before you buy.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <PackCard pack={standard}  tierKey="STANDARD"  />
        <PackCard pack={premium}   tierKey="PREMIUM"   />
        <PackCard pack={legendary} tierKey="LEGENDARY" />
      </div>
    </div>
  )
}
