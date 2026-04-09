'use client'

import { useState } from 'react'

interface StatFilter {
  stat: string
  label: string
  value: number
}

const DEFAULT_FILTERS: StatFilter[] = [
  { stat: 'fin', label: 'FIN (Income)',   value: 90 },
  { stat: 'loc', label: 'LOC (Location)', value: 80 },
]

interface ScoutFiltersProps {
  isPro: boolean
}

export default function ScoutFilters({ isPro }: ScoutFiltersProps) {
  const [filters, setFilters] = useState<StatFilter[]>(DEFAULT_FILTERS)
  const [saved, setSaved] = useState<StatFilter[] | null>(null)
  const [toast, setToast] = useState(false)

  function updateValue(stat: string, value: number) {
    setFilters(prev => prev.map(f => f.stat === stat ? { ...f, value } : f))
  }

  function handleSave() {
    setSaved(filters)
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  if (!isPro) {
    return (
      <div className="relative rounded-xl border border-gray-800 bg-gray-900 p-5 overflow-hidden">
        <div className="blur-sm pointer-events-none select-none">
          <ScoutFiltersContent
            filters={filters}
            saved={null}
            toast={false}
            onUpdate={() => {}}
            onSave={() => {}}
          />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950/70">
          <p className="text-sm font-bold text-white">Pro feature</p>
          <a
            href="/pro"
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-colors"
          >
            Upgrade to Pro →
          </a>
        </div>
      </div>
    )
  }

  return (
    <ScoutFiltersContent
      filters={filters}
      saved={saved}
      toast={toast}
      onUpdate={updateValue}
      onSave={handleSave}
    />
  )
}

// ── Inner content (shared between pro and blurred locked view) ────────────────

interface ContentProps {
  filters: StatFilter[]
  saved: StatFilter[] | null
  toast: boolean
  onUpdate: (stat: string, value: number) => void
  onSave: () => void
}

function ScoutFiltersContent({ filters, saved, toast, onUpdate, onSave }: ContentProps) {
  return (
    <div className="relative rounded-xl border border-gray-800 bg-gray-900 p-5 flex flex-col gap-4">
      {toast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          Alert saved
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-base">🔍</span>
        <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">
          The Scout — Alert Filters
        </span>
      </div>

      <p className="text-xs text-gray-500">Alert me when a lead matches:</p>

      <div className="flex flex-col gap-3">
        {filters.map(({ stat, label, value }) => (
          <div key={stat} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-32 shrink-0">{label}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={value}
              onChange={e => onUpdate(stat, Number(e.target.value))}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-xs font-mono font-bold text-white w-8 text-right tabular-nums">
              ≥{value}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onSave}
        className="self-start px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
      >
        Save Alert
      </button>

      {saved && (
        <div className="border-t border-gray-800 pt-3 flex flex-col gap-1">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
            Active Alerts: 1
          </p>
          <p className="text-xs text-gray-400">
            — {saved.map(f => `${f.label.split(' ')[0]} ≥ ${f.value}`).join(' AND ')}
          </p>
        </div>
      )}
    </div>
  )
}
