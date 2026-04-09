'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Pack } from '@/lib/db/packs'
import { getMockLeadsForPack } from '@/lib/db/packs'
import { formatCurrency } from '@/lib/utils'
import { calculateLeadOVR, getLeadTier } from '@/lib/utils/scoring'
import PackReveal from './PackReveal'

// ── Types ─────────────────────────────────────────────────────────────────────

type LeadPreview = {
  id: string
  source: string
  income_bracket: string | null
  intent_niche: string | null
  is_legendary: boolean
}

type CardState =
  | { phase: 'idle' }
  | { phase: 'cracking' }
  | { phase: 'cracked'; expiresAt: number; secondsLeft: number; leads: LeadPreview[] }
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

const SOURCE_LABELS: Record<string, string> = {
  FACEBOOK: 'FB',
  REFERRAL: 'REF',
  COLD: 'COLD',
}

function LeadRow({ lead }: { lead: LeadPreview }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 uppercase tracking-wider min-w-[36px] text-center">
        {SOURCE_LABELS[lead.source] ?? lead.source?.slice(0, 4)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300 truncate">
          {lead.intent_niche ?? 'General Insurance'}
        </p>
        {lead.income_bracket && (
          <p className="text-[10px] text-gray-500">{lead.income_bracket}</p>
        )}
      </div>
      {lead.is_legendary && (
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
  const [showReveal, setShowReveal] = useState(false)
  const isLegendary = pack.income_tier === 'LEGENDARY'
  const isExclusive = pack.pack_type === 'EXCLUSIVE'
  const spotsLeft = pack.max_buyers - pack.buyer_count

  const mockLeads = useMemo(() => getMockLeadsForPack(pack.id), [pack.id])
  const avgOvr = useMemo(() => {
    if (mockLeads.length === 0) return 0
    return Math.round(mockLeads.reduce((sum, l) => sum + l.ovr, 0) / mockLeads.length)
  }, [mockLeads])
  const hasLegendaryLead = useMemo(
    () => mockLeads.some(l => getLeadTier(calculateLeadOVR(l.stats)) === 'LEGENDARY'),
    [mockLeads]
  )

  // Tick the countdown when in cracked state.
  // setState uses functional form so secondsLeft is read from prev, not captured.
  useEffect(() => {
    if (state.phase !== 'cracked') return

    const id = setInterval(() => {
      setState((prev) => {
        if (prev.phase !== 'cracked') return prev
        const next = prev.secondsLeft - 1
        if (next <= 0) {
          // Timer expired — release pack back to marketplace
          router.refresh()
          return { phase: 'idle' }
        }
        return { ...prev, secondsLeft: next }
      })
    }, 1000)

    return () => clearInterval(id)
  }, [state.phase, router])

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
      setState({
        phase: 'cracked',
        expiresAt: Date.now() + json.data.remaining_seconds * 1000,
        secondsLeft: json.data.remaining_seconds,
        leads: json.data.leads,
      })
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
        return
      }
      setState({ phase: 'purchased' })
      router.refresh()
    } catch {
      setState({ phase: 'error', message: 'Network error. Please try again.' })
    }
  }, [pack.id, router])

  // ── Purchased state ───────────────────────────────────────────────────────
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

  // ── Cracked state ─────────────────────────────────────────────────────────
  if (state.phase === 'cracked') {
    return (
      <div
        className={`relative flex flex-col gap-4 rounded-xl border p-5 bg-gray-900 ${
          isLegendary ? 'border-amber-500/60' : 'border-indigo-500/50'
        }`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-white">{pack.pack_label}</span>
            <p className="text-xs text-gray-500 mt-0.5">{pack.pack_size} leads · {formatCurrency(pack.price_ttd)}</p>
          </div>
          <TimerRing secondsLeft={state.secondsLeft} />
        </div>

        {/* Lead previews */}
        <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-1">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest py-1.5 font-semibold">
            Preview — {state.leads.length} lead{state.leads.length !== 1 ? 's' : ''}
          </p>
          {state.leads.length === 0 ? (
            <p className="text-xs text-gray-600 py-2">No leads in preview.</p>
          ) : (
            state.leads.map((lead) => <LeadRow key={lead.id} lead={lead} />)
          )}
        </div>

        {/* Purchase CTA */}
        <button
          onClick={handlePurchase}
          className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold text-sm transition-colors"
        >
          Purchase Pack · {formatCurrency(pack.price_ttd)}
        </button>

        <p className="text-center text-[10px] text-gray-600">
          Priority window — purchase before timer expires
        </p>
      </div>
    )
  }

  // ── Purchasing state ──────────────────────────────────────────────────────
  if (state.phase === 'purchasing') {
    return (
      <div className="relative flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-700 p-6 bg-gray-900 min-h-[280px]">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Processing purchase…</p>
      </div>
    )
  }

  // ── Idle / cracking / error state ─────────────────────────────────────────
  return (
    <>
      {showReveal && (
        <PackReveal
          packId={pack.id}
          leads={mockLeads}
          onClose={() => setShowReveal(false)}
        />
      )}

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
          {hasLegendaryLead && (
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500 text-black uppercase tracking-wider">
              ★ Legendary Pack
            </span>
          )}
          {isLegendary && !hasLegendaryLead && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500 text-black uppercase tracking-wider">
              Legendary
            </span>
          )}
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 tabular-nums">
            Avg OVR {avgOvr}
          </span>
        </div>
      </div>

      {/* Pack name + type badges */}
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
        onClick={() => {
          setShowReveal(true)
          handleCrack()
        }}
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
    </>
  )
}
