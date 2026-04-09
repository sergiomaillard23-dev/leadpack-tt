'use client'

import { useState, useEffect } from 'react'

// Mock balance — replaced with real wallet query after Migration 010
const MOCK_BALANCE_CENTS = 0

const QUICK_ADD_AMOUNTS = [
  { label: '+$100', cents: 10000 },
  { label: '+$250', cents: 25000 },
  { label: '+$500', cents: 50000 },
]

function formatBalance(cents: number): string {
  return `TT$${(cents / 100).toLocaleString('en-TT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Slot-machine roll: animates digits from a high number down to the real value
function useRolledValue(target: number, durationMs = 800): number {
  const [displayed, setDisplayed] = useState(target + 9999)

  useEffect(() => {
    const start = performance.now()
    const from = target + 9999

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / durationMs, 1)
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(from - (from - target) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    const raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return displayed
}

export default function WalletCard() {
  const displayedBalance = useRolledValue(MOCK_BALANCE_CENTS)
  const [toast, setToast] = useState(false)

  function handleQuickAdd() {
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  return (
    <div className="relative flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
      {/* Toast */}
      {toast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg animate-fade-in">
          Coming Soon — WiPay integration launching soon!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">💰</span>
        <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Wallet Balance</span>
      </div>

      {/* Balance */}
      <p className="text-3xl font-black text-white tabular-nums tracking-tight font-mono">
        {formatBalance(displayedBalance)}
      </p>

      {/* Quick Add */}
      <div className="flex gap-2">
        {QUICK_ADD_AMOUNTS.map(({ label }) => (
          <button
            key={label}
            onClick={handleQuickAdd}
            className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-300 hover:text-white text-xs font-bold transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
