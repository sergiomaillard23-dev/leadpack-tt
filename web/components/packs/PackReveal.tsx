'use client'

import { useState, useCallback } from 'react'
import type { ScoredLead } from '@/lib/types/leads'
import { LEGENDARY_OVR_THRESHOLD } from '@/lib/constants'
import LeadCard from '@/components/leads/LeadCard'

// ── Timer ring (same constants as PackCard) ───────────────────────────────────
const TOTAL_SECONDS = 300
const RING_R = 36
const RING_C = 2 * Math.PI * RING_R

function TimerRing({ secondsLeft }: { secondsLeft: number }) {
  const pct = Math.max(0, Math.min(1, secondsLeft / TOTAL_SECONDS))
  const dash = pct * RING_C
  const color =
    secondsLeft > 180 ? '#22c55e' : secondsLeft > 60 ? '#eab308' : '#ef4444'
  const m = Math.floor(secondsLeft / 60)
  const s = secondsLeft % 60

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" className="rotate-[-90deg]">
        <circle cx="36" cy="36" r={RING_R} strokeWidth="5" className="stroke-gray-700 fill-none" />
        <circle
          cx="36" cy="36" r={RING_R}
          strokeWidth="5"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${RING_C}`}
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <span className="text-xs font-mono font-bold tabular-nums" style={{ color }}>
        {m}:{String(s).padStart(2, '0')}
      </span>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface PackRevealProps {
  packId: string
  packLabel: string
  priceTTD: number
  leads: ScoredLead[]
  mode: 'preview' | 'full'
  // preview mode props
  timerSeconds?: number
  onPurchase?: () => void
  purchasing?: boolean
  // shared
  onClose: () => void
}

type TierCount = { LEGENDARY: number; GOLD: number; SILVER: number; BRONZE: number }

// ── Preview mode — single card teaser + purchase CTA ─────────────────────────

function PreviewMode({
  leads,
  packLabel,
  priceTTD,
  timerSeconds,
  onPurchase,
  purchasing,
  onClose,
}: {
  leads: ScoredLead[]
  packLabel: string
  priceTTD: number
  timerSeconds: number
  onPurchase: () => void
  purchasing: boolean
  onClose: () => void
}) {
  const previewLead = leads[0]
  const [revealed, setRevealed] = useState(false)
  const [flashActive, setFlashActive] = useState(false)

  const handleFlip = useCallback(() => {
    if (revealed) return
    if (previewLead.ovr >= LEGENDARY_OVR_THRESHOLD) {
      setFlashActive(true)
      setTimeout(() => {
        setFlashActive(false)
        setRevealed(true)
      }, 400)
    } else {
      setRevealed(true)
    }
  }, [revealed, previewLead])

  const formatPrice = (cents: number) => {
    return `TT$${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950/97 backdrop-blur-sm">
      {/* LEGENDARY gold flash */}
      {flashActive && (
        <div className="fixed inset-0 z-[60] bg-yellow-400 opacity-30 pointer-events-none animate-pulse" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Pack {packLabel} — Preview</h2>
          <p className="text-xs text-gray-500 mt-0.5">Flip the card to preview one lead</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors text-sm font-semibold"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-8">
        {/* Single card */}
        <div onClick={handleFlip} className={!revealed ? 'cursor-pointer' : ''}>
          <LeadCard lead={previewLead} revealed={revealed} onReveal={handleFlip} />
        </div>

        {!revealed && (
          <p className="text-gray-500 text-sm animate-pulse">Tap the card to preview</p>
        )}

        {/* Timer + purchase CTA */}
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <div className="flex items-center gap-3">
            <TimerRing secondsLeft={timerSeconds} />
            <div className="text-sm text-gray-400">
              <p className="font-semibold text-white">Priority window active</p>
              <p className="text-xs text-gray-500">Purchase before time runs out</p>
            </div>
          </div>

          <button
            onClick={onPurchase}
            disabled={purchasing}
            className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {purchasing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              `Purchase Pack · ${formatPrice(priceTTD)}`
            )}
          </button>

          <p className="text-[10px] text-gray-600 text-center">
            {leads.length} leads · Contact details revealed after purchase
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Full mode — all leads, flip one-by-one or reveal all ─────────────────────

function FullMode({
  leads,
  onClose,
}: {
  leads: ScoredLead[]
  onClose: () => void
}) {
  const [revealed, setRevealed] = useState<boolean[]>(() => leads.map(() => false))
  const [flashActive, setFlashActive] = useState(false)
  const [revealingAll, setRevealingAll] = useState(false)

  const allRevealed = revealed.every(Boolean)

  const revealWithFlash = useCallback((index: number): Promise<void> => {
    return new Promise(resolve => {
      const lead = leads[index]
      if (lead.ovr >= LEGENDARY_OVR_THRESHOLD) {
        setFlashActive(true)
        setTimeout(() => {
          setFlashActive(false)
          setRevealed(prev => { const n = [...prev]; n[index] = true; return n })
          setTimeout(resolve, 300)
        }, 400)
      } else {
        setRevealed(prev => { const n = [...prev]; n[index] = true; return n })
        setTimeout(resolve, 300)
      }
    })
  }, [leads])

  const handleRevealAll = useCallback(async () => {
    if (revealingAll) return
    setRevealingAll(true)
    for (let i = 0; i < leads.length; i++) {
      if (!revealed[i]) await revealWithFlash(i)
    }
    setRevealingAll(false)
  }, [leads, revealed, revealingAll, revealWithFlash])

  const tierCounts = leads.reduce<TierCount>(
    (acc, lead) => { acc[lead.tier]++; return acc },
    { LEGENDARY: 0, GOLD: 0, SILVER: 0, BRONZE: 0 }
  )

  const revealedCount = revealed.filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950/97 backdrop-blur-sm overflow-y-auto">
      {/* LEGENDARY gold flash */}
      {flashActive && (
        <div className="fixed inset-0 z-[60] bg-yellow-400 opacity-30 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0 sticky top-0 bg-gray-950/95 backdrop-blur-sm z-10">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Pack Reveal</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {revealedCount} / {leads.length} revealed
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors text-sm font-semibold"
        >
          ✕ Close
        </button>
      </div>

      {/* Cards grid */}
      <div className="flex-1 flex flex-wrap justify-center gap-4 p-6">
        {leads.map((lead, i) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            revealed={revealed[i]}
            onReveal={() => !revealed[i] && revealWithFlash(i)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 py-4 border-t border-gray-800 flex flex-col items-center gap-3 sticky bottom-0 bg-gray-950/95 backdrop-blur-sm">
        {allRevealed ? (
          <>
            <div className="flex gap-3 flex-wrap justify-center">
              {tierCounts.LEGENDARY > 0 && (
                <span className="px-3 py-1 rounded-full bg-yellow-500 text-black text-xs font-black uppercase tracking-wider">
                  ★ {tierCounts.LEGENDARY} Legendary
                </span>
              )}
              {tierCounts.GOLD > 0 && (
                <span className="px-3 py-1 rounded-full bg-yellow-700 text-yellow-100 text-xs font-bold uppercase tracking-wider">
                  {tierCounts.GOLD} Gold
                </span>
              )}
              {tierCounts.SILVER > 0 && (
                <span className="px-3 py-1 rounded-full bg-slate-500 text-white text-xs font-bold uppercase tracking-wider">
                  {tierCounts.SILVER} Silver
                </span>
              )}
              {tierCounts.BRONZE > 0 && (
                <span className="px-3 py-1 rounded-full bg-orange-800 text-orange-100 text-xs font-bold uppercase tracking-wider">
                  {tierCounts.BRONZE} Bronze
                </span>
              )}
            </div>
            <p className="text-emerald-400 font-bold text-sm">Pack Complete — Check your Journal for contact details</p>
            <button
              onClick={onClose}
              className="px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
            >
              Go to Journal
            </button>
          </>
        ) : (
          <button
            onClick={handleRevealAll}
            disabled={revealingAll}
            className="px-8 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm transition-colors"
          >
            {revealingAll ? 'Revealing…' : `Reveal All ${leads.length} Leads`}
          </button>
        )}
      </div>
    </div>
  )
}

// ── PackReveal — routes to the correct mode ───────────────────────────────────

export default function PackReveal({
  packLabel,
  priceTTD,
  leads,
  mode,
  timerSeconds = 0,
  onPurchase,
  purchasing = false,
  onClose,
}: PackRevealProps) {
  if (mode === 'preview') {
    return (
      <PreviewMode
        leads={leads}
        packLabel={packLabel}
        priceTTD={priceTTD}
        timerSeconds={timerSeconds}
        onPurchase={onPurchase ?? (() => {})}
        purchasing={purchasing}
        onClose={onClose}
      />
    )
  }

  return (
    <FullMode
      leads={leads}
      onClose={onClose}
    />
  )
}
