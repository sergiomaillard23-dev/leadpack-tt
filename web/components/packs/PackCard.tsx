'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Pack } from '@/lib/db/packs'
import type { ScoredLead } from '@/lib/types/leads'
import { formatCurrency } from '@/lib/utils'
import PackReveal from './PackReveal'

// ── Types ─────────────────────────────────────────────────────────────────────

type CardState =
  | { phase: 'idle' }
  | { phase: 'cracking' }
  | { phase: 'cracked'; expiresAt: number; secondsLeft: number }
  | { phase: 'purchasing' }
  | { phase: 'purchased' }
  | { phase: 'error'; message: string }

// ── Timer ring (SVG) ──────────────────────────────────────────────────────────

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
      <svg width="88" height="88" className="rotate-[-90deg]">
        <circle cx="44" cy="44" r={RING_R} strokeWidth="5" className="stroke-gray-700 fill-none" />
        <circle
          cx="44" cy="44" r={RING_R}
          strokeWidth="5"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${RING_C}`}
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <span
        className="text-xs font-mono font-bold tabular-nums"
        style={{ color }}
      >
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
        <p className="text-xs text-gray-300 truncate">
          {lead.parish || lead.income_bracket || 'Trinidad'}
        </p>
        <p className="text-[10px] text-gray-500">{lead.tier}</p>
      </div>
      {lead.tier === 'LEGENDARY' && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black uppercase">
          ★
        </span>
      )}
      {/* Contact info is intentionally redacted at preview stage */}
      <span className="text-[10px] text-gray-600 font-mono tracking-widest select-none">
        ████████
      </span>
    </div>
  )
}

// ── Pack display name map ─────────────────────────────────────────────────────

const PACK_NAMES: Record<string, string> = {
  STARTER:           'Starter Pack',
  EXCLUSIVE_STARTER: 'Exclusive Starter',
  COMMUNITY:         'Community Pack',
  EXCLUSIVE:         'Exclusive Pack',
}

// ── PackCard ──────────────────────────────────────────────────────────────────

interface PackCardProps {
  pack: Pack
}

export function PackCard({ pack }: PackCardProps) {
  const router = useRouter()
  const [state, setState] = useState<CardState>({ phase: 'idle' })
  // 'none' | 'preview' = cracked state modal | 'full' = post-purchase reveal
  const [revealMode, setRevealMode] = useState<'none' | 'preview' | 'full'>('none')
  // Persists through purchase so full reveal can display real leads
  const [crackedLeads, setCrackedLeads] = useState<ScoredLead[]>([])

  const isLegendary = pack.income_tier === 'LEGENDARY'
  const isExclusive = pack.pack_type === 'EXCLUSIVE'
  const spotsLeft = pack.max_buyers - pack.buyer_count

  // Tick the countdown when in cracked state.
  // Does NOT call router.refresh() on expiry — that would remount and close the modal.
  // The marketplace will refresh naturally when the modal is closed.
  useEffect(() => {
    if (state.phase !== 'cracked') return

    const id = setInterval(() => {
      setState((prev) => {
        if (prev.phase !== 'cracked') return prev
        const next = prev.secondsLeft - 1
        if (next <= 0) {
          // Timer expired — close modal and go back to idle
          setRevealMode('none')
          return { phase: 'idle' }
        }
        return { ...prev, secondsLeft: next }
      })
    }, 1000)

    return () => clearInterval(id)
  }, [state.phase])

  const handleCrack = useCallback(async () => {
    setState({ phase: 'cracking' })
    try {
      const res = await fetch('/api/packs/crack', {
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
        phase: 'cracked',
        expiresAt: Date.now() + json.data.remaining_seconds * 1000,
        secondsLeft: json.data.remaining_seconds,
      })
      setRevealMode('preview')
    } catch {
      setState({ phase: 'error', message: 'Network error. Please try again.' })
    }
  }, [pack.id])

  const handlePurchase = useCallback(async () => {
    setState((prev) => {
      if (prev.phase !== 'cracked') return prev
      return { phase: 'purchasing' }
    })
    try {
      const res = await fetch('/api/packs/purchase', {
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
      // Transition to full reveal — router.refresh() happens when user closes the full modal
      setRevealMode('full')
    } catch {
      setState({ phase: 'error', message: 'Network error. Please try again.' })
      setRevealMode('none')
    }
  }, [pack.id])

  const handleRevealClose = useCallback(() => {
    setRevealMode('none')
    // Refresh marketplace after the user closes either modal
    router.refresh()
  }, [router])

  // ── PackReveal modal — shown in preview (cracked) or full (purchased) mode ──
  if (revealMode === 'preview' && state.phase === 'cracked') {
    return (
      <PackReveal
        packId={pack.id}
        packLabel={pack.pack_label}
        priceTTD={pack.price_ttd}
        leads={crackedLeads}
        mode="preview"
        timerSeconds={state.secondsLeft}
        onPurchase={handlePurchase}
        purchasing={false}
        onClose={handleRevealClose}
      />
    )
  }

  if (revealMode === 'preview' && state.phase === 'purchasing') {
    return (
      <PackReveal
        packId={pack.id}
        packLabel={pack.pack_label}
        priceTTD={pack.price_ttd}
        leads={crackedLeads}
        mode="preview"
        timerSeconds={0}
        onPurchase={() => {}}
        purchasing={true}
        onClose={handleRevealClose}
      />
    )
  }

  if (revealMode === 'full') {
    return (
      <PackReveal
        packId={pack.id}
        packLabel={pack.pack_label}
        priceTTD={pack.price_ttd}
        leads={crackedLeads}
        mode="full"
        onClose={handleRevealClose}
      />
    )
  }

  // ── Purchased state (if modal was closed already) ─────────────────────────
  if (state.phase === 'purchased') {
    return (
      <div className="relative flex flex-col items-center justify-center gap-3 rounded-xl border border-green-500/40 p-6 bg-gray-900 min-h-[280px]">
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

  // ── Purchasing state (no modal open) ─────────────────────────────────────
  if (state.phase === 'purchasing') {
    return (
      <div className="relative flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-700 p-6 bg-gray-900 min-h-[280px]">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Processing purchase…</p>
      </div>
    )
  }

  // ── Cracked state with timer — shown when modal was dismissed but timer active
  if (state.phase === 'cracked') {
    return (
      <div
        className={`relative flex flex-col gap-4 rounded-xl border p-5 bg-gray-900 ${
          isLegendary ? 'border-amber-500/60' : 'border-indigo-500/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-white">{pack.pack_label}</span>
            <p className="text-xs text-gray-500 mt-0.5">{pack.pack_size} leads · {formatCurrency(pack.price_ttd)}</p>
          </div>
          <TimerRing secondsLeft={state.secondsLeft} />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-1">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest py-1.5 font-semibold">
            Preview — {crackedLeads.length} lead{crackedLeads.length !== 1 ? 's' : ''}
          </p>
          {crackedLeads.length === 0 ? (
            <p className="text-xs text-gray-600 py-2">No leads in preview.</p>
          ) : (
            crackedLeads.map((lead) => <LeadRow key={lead.id} lead={lead} />)
          )}
        </div>

        <button
          onClick={() => setRevealMode('preview')}
          className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors"
        >
          View Preview & Purchase
        </button>

        <p className="text-center text-[10px] text-gray-600">
          Priority window active — purchase before timer expires
        </p>
      </div>
    )
  }

  // ── Idle / cracking / error state ─────────────────────────────────────────
  return (
    <div
      className={`relative flex flex-col gap-5 rounded-xl border p-6 bg-gray-900 transition-colors ${
        isLegendary
          ? 'border-amber-500/60 shadow-lg shadow-amber-900/20'
          : 'border-gray-700 hover:border-gray-600'
      }`}
    >
      {/* Pack label + name + badges */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-5xl font-black text-white tracking-tight">
            {pack.pack_label}
          </span>
          <p className="text-sm font-semibold text-gray-300 mt-0.5">
            {PACK_NAMES[pack.pack_name] ?? pack.pack_name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {isLegendary && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500 text-black uppercase tracking-wider">
              ★ Legendary
            </span>
          )}
        </div>
      </div>

      {/* Pack type badges */}
      <div className="flex gap-2 flex-wrap">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
            isExclusive ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
          }`}
        >
          {isExclusive ? 'Exclusive' : 'Community'}
        </span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 uppercase tracking-wide">
          {pack.pack_size} leads
        </span>
      </div>

      {/* Price */}
      <p className="text-3xl font-bold text-white">{formatCurrency(pack.price_ttd)}</p>

      {/* Spots */}
      <p className="text-sm text-gray-400">
        {isExclusive
          ? '1 buyer only — full access'
          : `${spotsLeft} of ${pack.max_buyers} spot${spotsLeft !== 1 ? 's' : ''} remaining`}
      </p>

      {/* Error message */}
      {state.phase === 'error' && (
        <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
          {state.message}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={handleCrack}
        disabled={state.phase === 'cracking'}
        className="mt-auto w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {state.phase === 'cracking' ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
