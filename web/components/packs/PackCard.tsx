'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Pack } from '@/lib/db/packs'
import type { ScoredLead } from '@/lib/types/leads'
import { formatCurrency } from '@/lib/utils'
import PackReveal from './PackReveal'

// ── Tier config ───────────────────────────────────────────────────────────────

export type TierKey = 'STANDARD' | 'PREMIUM' | 'LEGENDARY'

const TIER_DEFS = {
  STANDARD: {
    abbr:      'STD',
    abbrSize:  '5.5rem',
    label:     'Standard Pack',
    subtitle:  'Entry-level leads · Shared access',
    // Accent RGB used for all glow / border / ray colours
    rgb:       '6, 182, 212',       // cyan-500
    accent:    '#22d3ee',
    bgFrom:    '#010c12',
    bgMid:     '#021522',
    glowPos:   '50% 30%',
    glowSize:  '85% 60%',
    btnClass:  'btn-glow-cyan text-white',
    sparkles:  ['✦', '✦', '✧', '✦'],
    legendary: false,
  },
  PREMIUM: {
    abbr:      'PREM',
    abbrSize:  '4.5rem',
    label:     'Premium Pack',
    subtitle:  'High-quality leads · Shared access',
    rgb:       '139, 92, 246',      // violet-500
    accent:    '#a78bfa',
    bgFrom:    '#07030e',
    bgMid:     '#110a2a',
    glowPos:   '50% 30%',
    glowSize:  '85% 60%',
    btnClass:  'btn-glow-violet text-white',
    sparkles:  ['✦', '★', '✦', '★'],
    legendary: false,
  },
  LEGENDARY: {
    abbr:      'LEGD',
    abbrSize:  '4.5rem',
    label:     'Legendary Pack',
    subtitle:  'Elite high-income leads · Exclusive',
    rgb:       '245, 158, 11',      // amber-500
    accent:    '#fbbf24',
    bgFrom:    '#0d0600',
    bgMid:     '#1c0d00',
    glowPos:   '50% 35%',
    glowSize:  '95% 70%',
    btnClass:  'btn-glow-amber font-black',
    sparkles:  ['★', '✦', '★', '✦'],
    legendary: true,
  },
} as const

// ── Timer ring ─────────────────────────────────────────────────────────────────

const TOTAL_SECONDS = 300
const RING_R        = 36
const RING_C        = 2 * Math.PI * RING_R

function TimerRing({ secondsLeft }: { secondsLeft: number }) {
  const pct   = Math.max(0, Math.min(1, secondsLeft / TOTAL_SECONDS))
  const dash  = pct * RING_C
  const color = secondsLeft > 180 ? '#22c55e' : secondsLeft > 60 ? '#eab308' : '#ef4444'
  const m     = Math.floor(secondsLeft / 60)
  const s     = secondsLeft % 60
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" className="rotate-[-90deg]">
        <circle cx="40" cy="40" r={RING_R} strokeWidth="4" className="stroke-gray-700 fill-none" />
        <circle cx="40" cy="40" r={RING_R} strokeWidth="4" fill="none"
          stroke={color} strokeLinecap="round"
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

// ── Lead preview row (cracked inline state) ────────────────────────────────────

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

// ── State machine ──────────────────────────────────────────────────────────────

type CardState =
  | { phase: 'idle' }
  | { phase: 'cracking' }
  | { phase: 'cracked'; expiresAt: number; secondsLeft: number }
  | { phase: 'purchasing' }
  | { phase: 'purchased' }
  | { phase: 'error'; message: string }

// ── Pack face — the shared FC26-style visual ───────────────────────────────────

interface PackFaceProps {
  def:       typeof TIER_DEFS[TierKey]
  pack:      Pack
  spotsLeft: number
  footer:    React.ReactNode
  disabled?: boolean
}

function PackFace({ def, pack, spotsLeft, footer, disabled = false }: PackFaceProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl flex flex-col min-h-[460px] group transition-all duration-500 ${
        disabled ? 'opacity-40 cursor-default' : 'cursor-pointer hover:-translate-y-1.5 hover:scale-[1.015]'
      }`}
      style={{
        background: `
          radial-gradient(ellipse ${def.glowSize} at ${def.glowPos},
            rgba(${def.rgb}, 0.28) 0%, transparent 68%),
          linear-gradient(170deg, ${def.bgFrom} 0%, ${def.bgMid} 45%, ${def.bgFrom} 100%)
        `,
        boxShadow: disabled
          ? `0 0 0 1px rgba(${def.rgb},0.25), 0 8px 32px rgba(0,0,0,0.7)`
          : `0 0 0 1px rgba(${def.rgb},0.55), 0 12px 48px rgba(0,0,0,0.85), 0 0 35px rgba(${def.rgb},0.22)`,
        transition: 'transform 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      {/* ── Diagonal light rays ─────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div style={{
          position: 'absolute', top: '-60%', left: '-15%',
          width: '45%', height: '220%',
          background: `linear-gradient(90deg, transparent, rgba(${def.rgb},0.11), transparent)`,
          transform: 'rotate(-28deg)',
        }} />
        <div style={{
          position: 'absolute', top: '-60%', left: '25%',
          width: '28%', height: '220%',
          background: `linear-gradient(90deg, transparent, rgba(${def.rgb},0.06), transparent)`,
          transform: 'rotate(-28deg)',
        }} />
        {def.legendary && (
          <div
            className="legendary-ray"
            style={{
              position: 'absolute', top: '-60%', left: '58%',
              width: '22%', height: '220%',
              background: `linear-gradient(90deg, transparent, rgba(${def.rgb},0.14), transparent)`,
              transform: 'rotate(-28deg)',
            }}
          />
        )}
      </div>

      {/* ── Shimmer sweep (fires once on hover via globals.css) ─────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="pack-shimmer absolute top-0 bottom-0 w-2/5"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
            transform: 'translateX(-100%) skewX(-20deg)',
          }}
        />
      </div>

      {/* ── Top bar: brand + tier chip ──────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-1">
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-700 select-none">
          LeadPack
        </span>
        <span
          className="text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-md"
          style={{
            color:      def.accent,
            background: `rgba(${def.rgb},0.12)`,
            border:     `1px solid rgba(${def.rgb},0.35)`,
          }}
        >
          {def.abbr}
        </span>
      </div>

      {/* ── Hero: giant tier abbreviation ───────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-5 pt-2 pb-3">
        <p
          className="font-black leading-none select-none"
          style={{
            fontSize:   def.abbrSize,
            color:      '#ffffff',
            textShadow: `
              0 0 18px rgba(${def.rgb},1),
              0 0 40px rgba(${def.rgb},0.85),
              0 0 80px rgba(${def.rgb},0.55),
              0 0 130px rgba(${def.rgb},0.3)
            `,
            letterSpacing: '-0.02em',
          }}
        >
          {def.abbr}
        </p>

        <div className="flex items-center gap-2 mt-4">
          {def.sparkles.map((s, i) => (
            <span key={i} className="text-[11px] select-none" style={{ color: def.accent, opacity: 0.65 }}>
              {s}
            </span>
          ))}
        </div>

        <p className="text-sm font-bold text-white mt-3 leading-tight">{def.label}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{def.subtitle}</p>
      </div>

      {/* ── Gradient divider ────────────────────────────────────────── */}
      <div
        className="relative z-10 mx-5"
        style={{ height: '1px', background: `linear-gradient(90deg, transparent, rgba(${def.rgb},0.45), transparent)` }}
      />

      {/* ── Footer slot (price + CTA, injected per state) ───────────── */}
      <div className="relative z-10 px-5 py-4 flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[28px] font-black text-white tabular-nums leading-none">
              {formatCurrency(pack.price_ttd)}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">{pack.pack_size} leads</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-gray-600 uppercase tracking-widest font-semibold">
              {pack.pack_type === 'COMMUNITY' ? 'spots' : 'access'}
            </p>
            <p
              className="text-sm font-black mt-0.5"
              style={{
                color: pack.pack_type === 'COMMUNITY' && spotsLeft <= 1
                  ? '#ef4444'
                  : def.accent,
              }}
            >
              {pack.pack_type === 'COMMUNITY' ? `${spotsLeft}/${pack.max_buyers}` : 'EXCL'}
            </p>
          </div>
        </div>
        {footer}
      </div>
    </div>
  )
}

// ── Pro early-access badge + countdown ────────────────────────────────────────

function EarlyAccessBadge({ releaseAt, isProUser }: { releaseAt: Date; isProUser: boolean }) {
  const [secsLeft, setSecsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(releaseAt).getTime() - Date.now()) / 1000))
  )

  useEffect(() => {
    if (secsLeft <= 0) return
    const id = setInterval(() => setSecsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [secsLeft])

  const h = Math.floor(secsLeft / 3600)
  const m = Math.floor((secsLeft % 3600) / 60)
  const s = secsLeft % 60
  const fmt = h > 0
    ? `${h}h ${String(m).padStart(2,'0')}m`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`

  if (isProUser) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 w-fit">
        <span className="text-amber-400 text-[9px]">★</span>
        <span className="text-amber-400 text-[9px] font-bold uppercase tracking-wider">Pro Early Access</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800/80 border border-gray-700 w-fit">
      <span className="text-gray-500 text-[9px] font-semibold uppercase tracking-wider">
        Opens in {secsLeft > 0 ? fmt : 'soon'}
      </span>
    </div>
  )
}

// ── PackCard ───────────────────────────────────────────────────────────────────

interface PackCardProps {
  pack:      Pack | null
  tierKey:   TierKey
  isProUser: boolean
}

export function PackCard({ pack, tierKey, isProUser }: PackCardProps) {
  const router = useRouter()
  const [state, setState]           = useState<CardState>({ phase: 'idle' })
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

  // ── PackReveal modals ──────────────────────────────────────────────────────

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

  // ── Legendary Pro gate ─────────────────────────────────────────────────────

  if (tierKey === 'LEGENDARY' && !isProUser) {
    const ghost = pack ?? {
      id: '', pack_label: 'A' as const, pack_name: 'LEGENDARY' as const,
      lead_batch_id: '', pack_type: 'EXCLUSIVE' as const, income_tier: 'LEGENDARY' as const,
      status: 'AVAILABLE' as const, price_ttd: 360000, buyer_count: 0, max_buyers: 1,
      pack_size: 20, release_at: null, pro_early_access_at: null,
    }
    const releaseAt    = pack?.release_at
    const earlyAccessAt = pack?.pro_early_access_at
    const inEarlyWindow =
      releaseAt && earlyAccessAt &&
      new Date(earlyAccessAt) <= new Date() &&
      new Date(releaseAt) > new Date()

    return (
      <div className="relative">
        <PackFace def={def} pack={ghost} spotsLeft={0} disabled footer={<div />} />
        <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-end pb-5 px-5"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(1px)' }}>
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white text-sm font-bold">Legendary Pro Only</p>
              <p className="text-gray-400 text-xs mt-0.5">Unlock with a Pro membership</p>
            </div>
            {inEarlyWindow && releaseAt && (
              <EarlyAccessBadge releaseAt={releaseAt} isProUser={false} />
            )}
          </div>
          <a href="/pro/upgrade"
            className="w-full py-3 rounded-xl text-center font-black text-sm uppercase tracking-widest text-gray-950 transition-all duration-200 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300">
            Upgrade to Pro
          </a>
        </div>
      </div>
    )
  }

  // ── No pack available ──────────────────────────────────────────────────────

  if (!pack) {
    const ghost = {
      id: '', pack_label: 'A' as const, pack_name: tierKey as 'STANDARD' | 'PREMIUM' | 'LEGENDARY',
      lead_batch_id: '', pack_type: 'COMMUNITY' as const, income_tier: 'STANDARD' as const,
      status: 'AVAILABLE' as const, price_ttd: 0, buyer_count: 0, max_buyers: 3, pack_size: 0,
      release_at: null, pro_early_access_at: null,
    }
    return (
      <PackFace
        def={def} pack={ghost} spotsLeft={0} disabled
        footer={
          <div className="flex items-center justify-center py-3 rounded-xl border border-gray-800/60 bg-gray-900/30">
            <p className="text-xs text-gray-600 font-medium tracking-wide">No packs available</p>
          </div>
        }
      />
    )
  }

  // ── Purchased ─────────────────────────────────────────────────────────────

  if (state.phase === 'purchased') {
    return (
      <div className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-green-500/30 p-6 bg-gray-900/80 min-h-[460px]">
        <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-400 font-semibold text-sm">Pack Purchased</p>
        <p className="text-gray-500 text-xs text-center">Check your Journal for lead details</p>
      </div>
    )
  }

  // ── Processing ─────────────────────────────────────────────────────────────

  if (state.phase === 'purchasing') {
    return (
      <div className="relative flex flex-col items-center justify-center gap-3 rounded-2xl p-6 min-h-[460px]"
        style={{ boxShadow: `0 0 0 1px rgba(${def.rgb},0.4)`, background: '#0a0a0f' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `rgba(${def.rgb},0.8)`, borderTopColor: 'transparent' }} />
        <p className="text-gray-400 text-sm">Processing purchase…</p>
      </div>
    )
  }

  // ── Cracked: timer active, modal dismissed ─────────────────────────────────

  if (state.phase === 'cracked') {
    return (
      <div
        className="relative overflow-hidden rounded-2xl flex flex-col gap-4 p-5 min-h-[460px]"
        style={{
          background: `
            radial-gradient(ellipse ${def.glowSize} at ${def.glowPos},
              rgba(${def.rgb},0.2) 0%, transparent 68%),
            linear-gradient(170deg, ${def.bgFrom} 0%, ${def.bgMid} 45%, ${def.bgFrom} 100%)
          `,
          boxShadow: `0 0 0 1px rgba(${def.rgb},0.55), 0 0 30px rgba(${def.rgb},0.25)`,
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-black text-white leading-none" style={{ fontSize: '2.5rem', textShadow: `0 0 20px rgba(${def.rgb},0.9)` }}>
              {def.abbr}
            </p>
            <p className="text-xs text-gray-500 mt-1">{pack.pack_size} leads · {formatCurrency(pack.price_ttd)}</p>
          </div>
          <TimerRing secondsLeft={state.secondsLeft} />
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/70 px-3 py-1 flex-1">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest py-1.5 font-semibold">
            Preview — {crackedLeads.length} leads
          </p>
          {crackedLeads.map(lead => <LeadRow key={lead.id} lead={lead} />)}
        </div>
        <button
          onClick={() => setRevealMode('preview')}
          className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest ${def.btnClass}`}
        >
          View Preview & Purchase
        </button>
      </div>
    )
  }

  // ── Idle / cracking / error ────────────────────────────────────────────────

  const earlyAccessAt = pack?.pro_early_access_at
  const releaseAt     = pack?.release_at
  const showEarlyBadge =
    tierKey === 'LEGENDARY' &&
    isProUser &&
    earlyAccessAt && releaseAt &&
    new Date(earlyAccessAt) <= new Date() &&
    new Date(releaseAt) > new Date()

  const ctaFooter = (
    <>
      {showEarlyBadge && releaseAt && (
        <EarlyAccessBadge releaseAt={releaseAt} isProUser={true} />
      )}
      {state.phase === 'error' && (
        <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
          {state.message}
        </p>
      )}
      <button
        onClick={handleCrack}
        disabled={state.phase === 'cracking'}
        className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${def.btnClass}`}
      >
        {state.phase === 'cracking' ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Opening…
          </>
        ) : state.phase === 'error' ? 'Try Again' : 'Crack Pack'}
      </button>
    </>
  )

  return <PackFace def={def} pack={pack} spotsLeft={spotsLeft} footer={ctaFooter} />
}
