'use client'

interface StatBarProps {
  label: string
  value: number  // 0–100
}

export default function StatBar({ label, value }: StatBarProps) {
  const color =
    value >= 90 ? 'bg-emerald-400' :
    value >= 70 ? 'bg-yellow-400' :
                  'bg-red-500'

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-7 text-[10px] font-bold text-gray-300 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-6 text-right text-[10px] font-mono font-bold text-white shrink-0">
        {value}
      </span>
    </div>
  )
}
