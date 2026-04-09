'use client'

import type { ScoredLead } from '@/lib/types/leads'
import StatBar from './StatBar'

interface LeadCardProps {
  lead: ScoredLead
  revealed: boolean
  onReveal?: () => void
}

const TIER_STYLES: Record<ScoredLead['tier'], string> = {
  LEGENDARY: 'bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-600 shadow-[0_0_20px_rgba(250,204,21,0.5)] animate-pulse-slow',
  GOLD:      'bg-gradient-to-br from-yellow-500 to-yellow-700',
  SILVER:    'bg-gradient-to-br from-slate-300 to-slate-500',
  BRONZE:    'bg-gradient-to-br from-orange-700 to-orange-900',
}

const TIER_TEXT: Record<ScoredLead['tier'], string> = {
  LEGENDARY: 'text-yellow-900',
  GOLD:      'text-yellow-900',
  SILVER:    'text-slate-900',
  BRONZE:    'text-orange-100',
}

const AVATAR_STYLES: Record<ScoredLead['tier'], string> = {
  LEGENDARY: 'bg-yellow-900/50 text-yellow-100',
  GOLD:      'bg-yellow-900/50 text-yellow-100',
  SILVER:    'bg-slate-700/50 text-white',
  BRONZE:    'bg-orange-950/50 text-orange-100',
}

export default function LeadCard({ lead, revealed, onReveal }: LeadCardProps) {
  if (!revealed) {
    return (
      <button
        onClick={onReveal}
        className="w-[180px] h-[280px] rounded-xl border-2 border-yellow-500/60 bg-gray-900 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-yellow-400 hover:shadow-[0_0_16px_rgba(250,204,21,0.3)] transition-all duration-300 animate-pulse-slow"
        aria-label="Reveal lead card"
      >
        <span className="text-5xl font-black text-yellow-500/40">?</span>
        <span className="text-xs text-gray-500 uppercase tracking-widest">Tap to reveal</span>
      </button>
    )
  }

  const initials = `${lead.first_name[0]}${lead.last_name[0]}`.toUpperCase()

  return (
    <div className={`w-[180px] h-[280px] rounded-xl flex flex-col p-3 gap-1.5 ${TIER_STYLES[lead.tier]}`}>
      {/* Header row */}
      <div className="flex items-start justify-between">
        <span className={`text-3xl font-black leading-none ${TIER_TEXT[lead.tier]}`}>
          {lead.ovr}
        </span>
        <span className={`text-[9px] font-black uppercase tracking-widest leading-none mt-1 ${TIER_TEXT[lead.tier]}`}>
          {lead.tier}
        </span>
      </div>

      {/* Avatar */}
      <div className="flex justify-center my-1">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black ${AVATAR_STYLES[lead.tier]}`}>
          {initials}
        </div>
      </div>

      {/* Name + Parish */}
      <div className={`text-center leading-tight ${TIER_TEXT[lead.tier]}`}>
        <p className="text-sm font-bold">{lead.first_name}</p>
        <p className="text-[10px] opacity-75">{lead.parish}</p>
      </div>

      {/* Divider */}
      <div className="border-t border-black/20 my-0.5" />

      {/* Stat bars */}
      <div className="flex flex-col gap-1">
        <StatBar label="FRH" value={lead.stats.frh} />
        <StatBar label="INT" value={lead.stats.int} />
        <StatBar label="LOC" value={lead.stats.loc} />
        <StatBar label="FIN" value={lead.stats.fin} />
        <StatBar label="STA" value={lead.stats.sta} />
        <StatBar label="FIT" value={lead.stats.fit} />
      </div>
    </div>
  )
}
