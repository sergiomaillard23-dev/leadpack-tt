'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Pack } from '@/lib/db/packs'
import type { ScoredLead } from '@/lib/types/leads'
import { formatCurrency } from '@/lib/utils'
import PackReveal from './PackReveal'

// ── Tier key ──────────────────────────────────────────────────────────────────

export type TierKey = 'STANDARD' | 'PREMIUM' | 'LEGENDARY'

// ── Per-tier visual definitions ───────────────────────────────────────────────

const TIER_DEFS = {
  STANDARD: {
    label:       'Standard Pack',
    subtitle:    'Entry-level leads · Shared access',
    icon:        '⚡',
    badgeText:   'STANDARD',
    badgeClass:  'bg-cyan-500/10 text-cyan-400 ring-1 ring-inset ring-cyan-500/30',
    border:      'border-cyan-500/50',
    cardClass:   'from-cyan-950/50 to-gray-900 shadow-[0_0_35px_rgba(6,182,212,0.2)] hover:shadow-[0_0_55px_rgba(6,182,212,0.4)] hover:border-cyan-400/70',
    btnClass:    'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white',
    ringColor:   '#06b6d4',
  },
  PREMIUM: {
    label:       'Premium Pack',
    subtitle:    'High-quality leads · Shared access',
    icon:        '💎',
    badgeText:   'PREMIUM',
    badgeClass:  'bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-violet-500/30',
    border:      'border-violet-500/50',
    cardClass:   'from-violet-950/50 to-gray-900 shadow-[0_0_35px_rgba(139,92,246,0.2)] hover:shadow-[0_0_55px_rgba(139,92,246,0.4)] hover:border-violet-400/70',
    btnClass:    'bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white',
    ringColor:   '#8b5cf6',
  },
  LEGENDARY: {
    label:       'Legendary Pack',
    subtitle:    'Elite high-income leads · Exclusive access',
    icon:        '★',
    badgeText:   '★ LEGENDARY',
    badgeClass:  'bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/40',
    border:      'border-amber-500/60',
    cardClass:   'from-amber-950/60 to-gray-900 shadow-[0_0_45px_rgba(245,158,11,0.25)] hover:shadow-[0_0_70px_rgba(245,158,11,0.5)] hover:border-amber-400/80',
    btnClass:    'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black',
    ringColor:   '#f59e0b',
  },
} as const

// ── Timer ring ────────────────────────────────────────────────────────────────

const TOTAL_SECONDS = 300
const RING_R = 36
const RING_C = 2 * Math.PI * RING_R

function TimerRing({ secondsLeft }: { secondsLeft: number }) {
  const pct   = Math.max(0, Math.min(1, secondsLeft / TOTAL_SECONDS))
  const dash  = pct * RING_C
  const color = secondsLeft > 180 ? '#22c55e' : secondsLeft > 60 ? '#eab308' : '#ef4444'
  const m = Math.floor(secondsLeft / 60)
  const s = secondsLeft % 60

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" className="rotate-[-90deg]">
        <circle cx="44" cy="44" r={RING_R} strokeWidth="5" className="stroke-gray-700 fill-none" />
        <circle
          cx="44" cy="44" r={RING_R}
          strokeWidth="5" fill="none" stroke={color} strokeLinecap="round"
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

// ── Lead preview row ──────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  LEGENDARY: 'text-amber-400',
  GOLD:      'text-yellow-500',
  SILVER:    'text-slate-400',
  BRONZE:    'text-orange-400',
}

function LeadRow({ lead }: { lead: ScoredLead }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
      <span className={`text-sm font-black tabular-nums min-w-[28px] ${TIER_COLORS[lead.tier] ?? 'text-gray-400'}`}>
        {lead.ovr}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300 truncate">{lead.parish || lead.income_bracket || 'Trinidad'}</p>
        <p className="text-[10px] text-gray-500">{lead.tier}</p>
      </div>
      {lead.tier === 'LEGENDARY' && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black">★</span>
      )}
      <span className="text-[10px] text-gray-600 font-mono tracking-widest select-none">████████</span>
    </div>
  )
}

// ── State machine ─────────────────────────────────────────────────────────────

type CardState =
  | { phase: 'idle' }
  | { phase: 'cracking' }
  | { phase: 'cracked'; expiresAt: number; secondsLeft: number }
  | { phase: 'purchasing' }
  | { phase: 'purchased' }
  | { phase: 'error'; message: string }

// ── PackCard ──────────────────────────────────────────────────────────────────

interface PackCardProps {
  pack:    Pack | null
  tierKey: TierKey
}

export function PackCard({ pack, tierKey }: PackCardProps) {
  const router = useRouter()
  const [state, setState]         = useState<CardState>({ phase: 'idle' })
  const [revealMode, setRevealMode] = useState<'none' | 'preview' | 'full'>('none')
  const [crackedLeads, setCrackedLeads] = useState<ScoredLead[]>([])

  const def       = TIER_DEFS[tierKey]
  const spotsLeft = pack ? pack.max_buyers - pack.buyer_count : 0

  // Countdown tick
  useEffect(() => {
    if (state.phase !== 'cracked') return
    const id = setInterval(() => {
      setState(prev => {
        if (prev.phase !== 'cracked') return prev
        const next = prev.secondsLeft - 1
        if (next <= 0) { setRevealMode('none'); return { phase: 'idle' } }
        return { ...prev, secondsLeft: next }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [state.phase])

  const handleCrack = useCallback(async () => {
    if (!pack) return
    setState({ phase: 'cracking' })
    try {
      const res  = await fetch('/api/packs/crack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: pack.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setState({ phase: 'error', message: json.error ?? 'Could not crack pack.' })
        return
      }
      setCrackedLeads(json.data.leads ?? [])
      setState({
        phase:       'cracked',
        expiresAt:   Date.now() + json.data.remaining_seconds * 1000,
        secondsLeft: json.data.remaining_seconds,
      })
      setRevealMode('preview')
    } catch {
      setState({ phase: 'error', message: 'Network error. Please try again.' })
    }
  }, [pack])

  const handlePurchase = useCallback(async () => {
    if (!pack) return
    setState(prev => prev.phase !== 'cracked' ? prev : { phase: 'purchasing' })
    try {
      const res  = await fetch('/api/packs/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: pack.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setState({ phase: 'error', message: json.error ?? 'Purchase failed.' })
        setRevealMode('none')
        return
      }
      setState({ phase: 'purchased' })
      setRevealMode('full')
    } catch {
      setState({ phase: 'error', message: 'Network error. Please try again.' })
      setRevealMode('none')
    }
  }, [pack])

  const handleRevealClose = useCallback(() => {
    setRevealMode('none')
    router.refresh()
  }, [router])

  // ── PackReveal modal ──────────────────────────────────────────────────────────

  if (revealMode === 'preview' && state.phase === 'cracked') {
    return (
      <PackReveal
        packId={pack!.id} packLabel={def.label} priceTTD={pack!.price_ttd}
        leads={crackedLeads} mode="preview" timerSeconds={state.secondsLeft}
        onPurchase={handlePurchase} purchasing={false} onClose={handleRevealClose}
      />
    )
  }

  if (revealMode === 'preview' && state.phase === 'purchasing') {
    return (
      <PackReveal
        packId={pack!.id} packLabel={def.label} priceTTD={pack!.price_ttd}
        leads={crackedLeads} mode="preview" timerSeconds={0}
        onPurchase={() => {}} purchasing={true} onClose={handleRevealClose}
      />
    )
  }

  if (revealMode === 'full') {
    return (
      <PackReveal
        packId={pack!.id} packLabel={def.label} priceTTD={pack!.price_ttd}
        leads={crackedLeads} mode="full" onClose={handleRevealClose}
      />
    )
  }

  // ── No pack available for this tier ──────────────────────────────────────────

  if (!pack) {
    return (
      <div
        className={`relative flex flex-col gap-5 rounded-2xl border p-6 bg-gradient-to-br ${def.border} ${def.cardClass} min-h-[340px] opacity-50 transition-all duration-300`}
      >
        <div className="flex items-center justify-between">
          <span className="text-4xl">{def.icon}</span>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${def.badgeClass}`}>
            {def.badgeText}
          </span>
        </div>
        <div>
          <p className="text-2xl font-black text-white">{def.label}</p>
          <p className="text-xs text-gray-500 mt-1">{def.subtitle}</p>
        </div>
        <div className="mt-auto flex items-center justify-center py-4 rounded-xl border border-gray-700/50 bg-gray-900/40">
          <p className="text-sm text-gray-600 font-medium">No packs available right now</p>
        </div>
      </div>
    )
  }

  // ── Purchased ─────────────────────────────────────────────────────────────────

  if (state.phase === 'purchased') {
    return (
      <div className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-green-500/40 p-6 bg-gray-900 min-h-[340px]">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-400 font-semibold text-sm">Pack Purchased</p>
        <p className="text-gray-500 text-xs text-center">Check your Journal for lead details</p>
      </div>
    )
  }

  // ── Purchasing spinner ────────────────────────────────────────────────────────

  if (state.phase === 'purchasing') {
    return (
      <div className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 bg-gray-900 min-h-[340px] ${def.border}`}>
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Processing purchase…</p>
      </div>
    )
  }

  // ── Cracked — timer active, modal dismissed ───────────────────────────────────

  if (state.phase === 'cracked') {
    return (
      <div className={`relative flex flex-col gap-4 rounded-2xl border p-5 bg-gradient-to-br ${def.border} ${def.cardClass} transition-all duration-300`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-black text-white">{def.label}</span>
            <p className="text-xs text-gray-500 mt-0.5">{pack.pack_size} leads · {formatCurrency(pack.price_ttd)}</p>
          </div>
          <TimerRing secondsLeft={state.secondsLeft} />
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-1">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest py-1.5 font-semibold">
            Preview — {crackedLeads.length} leads
          </p>
          {crackedLeads.map(lead => <LeadRow key={lead.id} lead={lead} />)}
        </div>
        <button
          onClick={() => setRevealMode('preview')}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${def.btnClass}`}
        >
          View Preview & Purchase
        </button>
      </div>
    )
  }

  // ── Idle / cracking / error ───────────────────────────────────────────────────

  return (
    <div
      className={`relative flex flex-col gap-5 rounded-2xl border p-6 bg-gradient-to-br ${def.border} ${def.cardClass} transition-all duration-300 min-h-[340px]`}
    >
      {/* Icon + tier badge */}
      <div className="flex items-center justify-between">
        <span className="text-4xl leading-none">{def.icon}</span>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${def.badgeClass}`}>
          {def.badgeText}
        </span>
      </div>

      {/* Pack name + subtitle */}
      <div>
        <p className="text-2xl font-black text-white leading-tight">{def.label}</p>
        <p className="text-xs text-gray-500 mt-1">{def.subtitle}</p>
      </div>

      {/* Price */}
      <div>
        <p className="text-5xl font-black text-white tabular-nums">{formatCurrency(pack.price_ttd)}</p>
        <p className="text-sm text-gray-400 mt-1">{pack.pack_size} leads</p>
      </div>

      {/* Spots */}
      {pack.pack_type === 'COMMUNITY' ? (
        <p className="text-sm text-gray-500">
          {spotsLeft < pack.max_buyers
            ? <span className="text-amber-400">{spotsLeft} of {pack.max_buyers} spots remaining</span>
            : `${pack.max_buyers} spots available`}
        </p>
      ) : (
        <p className="text-sm text-gray-500">1 buyer only — full exclusive access</p>
      )}

      {/* Error */}
      {state.phase === 'error' && (
        <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
          {state.message}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={handleCrack}
        disabled={state.phase === 'cracking'}
        className={`mt-auto w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg ${def.btnClass}`}
      >
        {state.phase === 'cracking' ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Opening…
          </>
        ) : state.phase === 'error' ? (
          'Try Again'
        ) : (
          'Crack Pack'
        )}
      </button>
    </div>
  )
}
