'use client'

const TICKER_ITEMS = [
  'Agent X just cracked a Gold Pack in Chaguanas',
  'New Legendary Pack dropped — San Fernando area',
  '3 packs cracked in the last hour',
  'Pack B just cracked — 2 spots left!',
  'Agent Y closed a deal from a Westmoorings lead',
  'Fresh batch incoming — Port of Spain leads',
  'Exclusive Pack sold in under 60 seconds',
  '5 new leads added to the Community Pool',
]

export default function MarketTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS] // duplicate for seamless loop

  return (
    <div className="relative flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 overflow-hidden">
      {/* LIVE dot */}
      <div className="flex items-center gap-1.5 shrink-0 z-10 pr-3 border-r border-gray-700">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[11px] font-black text-red-400 uppercase tracking-widest">Live</span>
      </div>

      {/* Scrolling text */}
      <div className="overflow-hidden flex-1">
        <div className="flex gap-12 animate-[marquee_30s_linear_infinite] whitespace-nowrap">
          {items.map((item, i) => (
            <span key={i} className="text-xs text-emerald-400 font-medium shrink-0">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Fade edges */}
      <div className="absolute left-[88px] top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none" />
    </div>
  )
}
