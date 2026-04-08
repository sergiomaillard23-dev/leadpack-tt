'use client'
import type { Pack } from '@/lib/db/packs'
import { formatCurrency } from '@/lib/utils'

interface PackCardProps {
  pack: Pack
  onCrack?: (packId: string) => void
}

export function PackCard({ pack, onCrack }: PackCardProps) {
  const isLegendary = pack.income_tier === 'LEGENDARY'
  const isExclusive = pack.pack_type === 'EXCLUSIVE'
  const spotsLeft = pack.max_buyers - pack.buyer_count

  return (
    <div
      className={`relative flex flex-col gap-5 rounded-xl border p-6 bg-gray-900 transition-colors ${
        isLegendary
          ? 'border-amber-500/60 shadow-lg shadow-amber-900/20'
          : 'border-gray-700 hover:border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-5xl font-black text-white tracking-tight">
          {pack.pack_label}
        </span>
        {isLegendary && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500 text-black uppercase tracking-wider">
            Legendary
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
            isExclusive ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
          }`}
        >
          {pack.pack_type}
        </span>
        {!isLegendary && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-700 text-gray-300 uppercase tracking-wide">
            Standard
          </span>
        )}
      </div>

      <p className="text-3xl font-bold text-white">{formatCurrency(pack.price_ttd)}</p>

      <p className="text-sm text-gray-400">
        {isExclusive
          ? 'Exclusive — 1 buyer only'
          : `${spotsLeft} of ${pack.max_buyers} spots remaining`}
      </p>

      <button
        onClick={() => onCrack?.(pack.id)}
        className="mt-auto w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-colors"
      >
        Crack Pack
      </button>
    </div>
  )
}
