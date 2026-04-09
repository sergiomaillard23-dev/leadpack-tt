'use client'

import { useState, useEffect } from 'react'
import { TIMEZONE, DROP_TIME_HOUR } from '@/lib/constants'

function getSecondsUntilNextDrop(): number {
  const now = new Date()
  // Current time in Port of Spain
  const pos = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))

  const next = new Date(pos)
  next.setHours(DROP_TIME_HOUR, 0, 0, 0)

  // If 9AM has already passed today, aim for tomorrow
  if (pos >= next) next.setDate(next.getDate() + 1)

  return Math.max(0, Math.floor((next.getTime() - pos.getTime()) / 1000))
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

export default function NextDropTimer() {
  const [seconds, setSeconds] = useState<number | null>(null)

  useEffect(() => {
    setSeconds(getSecondsUntilNextDrop())
    const id = setInterval(() => {
      setSeconds(getSecondsUntilNextDrop())
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const isLive = seconds === 0

  return (
    <div className={`flex items-center justify-between rounded-lg border px-5 py-3 transition-colors ${
      isLive
        ? 'border-yellow-500/60 bg-yellow-500/10 animate-pulse-slow'
        : 'border-gray-800 bg-gray-900'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm font-semibold uppercase tracking-widest">
          Next Drop
        </span>
        <span className="text-[10px] text-gray-600 font-mono">
          (9:00 AM AST daily)
        </span>
      </div>

      {seconds === null ? (
        <span className="text-gray-600 font-mono text-lg">--:--:--</span>
      ) : isLive ? (
        <span className="text-yellow-400 font-black text-lg tracking-widest uppercase animate-pulse">
          DROP LIVE NOW
        </span>
      ) : (
        <span className="text-emerald-400 font-black text-lg font-mono tabular-nums tracking-widest">
          {formatTime(seconds)}
        </span>
      )}
    </div>
  )
}
