'use client'

interface FreemiumHeatMapProps {
  isPro: boolean
}

const MOCK_PARISH_DOTS = [
  { parish: 'Port of Spain', x: 42, y: 38, count: 18 },
  { parish: 'San Fernando',  x: 35, y: 72, count: 24 },
  { parish: 'Chaguanas',     x: 48, y: 55, count: 31 },
  { parish: 'Arima',         x: 62, y: 40, count: 14 },
  { parish: 'Diego Martin',  x: 30, y: 33, count: 9  },
  { parish: 'Maraval',       x: 37, y: 30, count: 7  },
  { parish: 'Sangre Grande', x: 74, y: 36, count: 5  },
  { parish: 'Tobago',        x: 88, y: 22, count: 11 },
]

function dot(count: number): string {
  if (count >= 25) return 'bg-emerald-400 w-5 h-5'
  if (count >= 15) return 'bg-emerald-500 w-4 h-4'
  if (count >= 8)  return 'bg-emerald-600 w-3 h-3'
  return 'bg-emerald-700 w-2 h-2'
}

export default function FreemiumHeatMap({ isPro }: FreemiumHeatMapProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🗺️</span>
          <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">
            Scout&apos;s Map — Today&apos;s Leads
          </span>
        </div>
        {isPro && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase tracking-wider">
            Pro
          </span>
        )}
      </div>

      <div className="relative h-48">
        {/* CSS gradient blob "heat map" */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-gray-900 to-indigo-900/30" />
        <div className="absolute top-1/4 left-1/3 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-emerald-400/10 blur-xl" />
        <div className="absolute bottom-1/4 right-1/3 w-20 h-20 rounded-full bg-teal-500/10 blur-xl" />

        {isPro ? (
          /* Pro: show parish dots */
          <>
            {MOCK_PARISH_DOTS.map(({ parish, x, y, count }) => (
              <div
                key={parish}
                className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
                title={`${parish}: ${count} leads`}
              >
                <div className={`rounded-full opacity-80 ${dot(count)}`} />
                <span className="text-[9px] text-emerald-400/70 font-medium whitespace-nowrap hidden sm:block">
                  {parish}
                </span>
              </div>
            ))}
            <div className="absolute bottom-2 right-3 text-[10px] text-gray-500">
              Mock data — real distribution after Migration 010
            </div>
          </>
        ) : (
          /* Free: blur + upgrade overlay */
          <>
            <div className="absolute inset-0 backdrop-blur-md" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
              <p className="text-sm font-bold text-white">
                70 leads active across T&amp;T today
              </p>
              <a
                href="/pro"
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-colors"
              >
                Upgrade to Pro to See the Map →
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
