'use client'

export default function InventoryCard() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎴</span>
        <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Pack Inventory</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Unopened</span>
          <span className="text-sm font-bold text-white">2 packs</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Active</span>
          <span className="text-sm font-bold text-white">1 pack</span>
        </div>
        <div className="h-px bg-gray-800" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Total Leads</span>
          <span className="text-sm font-black text-emerald-400">40</span>
        </div>
      </div>
    </div>
  )
}
