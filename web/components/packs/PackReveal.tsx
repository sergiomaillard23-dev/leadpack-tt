'use client'

import { useState, useCallback } from 'react'
import type { ScoredLead } from '@/lib/types/leads'
import { LEGENDARY_OVR_THRESHOLD } from '@/lib/constants'
import LeadCard from '@/components/leads/LeadCard'

interface PackRevealProps {
  packId: string
  leads: ScoredLead[]
  onClose: () => void
}

type TierCount = { LEGENDARY: number; GOLD: number; SILVER: number; BRONZE: number }

export default function PackReveal({ leads, onClose }: PackRevealProps) {
  const [revealed, setRevealed] = useState<boolean[]>(() => leads.map(() => false))
  const [flashActive, setFlashActive] = useState(false)
  const [revealingAll, setRevealingAll] = useState(false)

  const allRevealed = revealed.every(Boolean)

  const flipCard = useCallback((index: number) => {
    setRevealed(prev => {
      const next = [...prev]
      next[index] = true
      return next
    })
  }, [])

  // Reveal a single card, triggering gold flash first if LEGENDARY
  const revealWithFlash = useCallback((index: number): Promise<void> => {
    return new Promise(resolve => {
      const lead = leads[index]
      if (lead.ovr >= LEGENDARY_OVR_THRESHOLD) {
        setFlashActive(true)
        setTimeout(() => {
          setFlashActive(false)
          flipCard(index)
          setTimeout(resolve, 300)
        }, 400)
      } else {
        flipCard(index)
        setTimeout(resolve, 300)
      }
    })
  }, [leads, flipCard])

  const handleRevealAll = useCallback(async () => {
    if (revealingAll) return
    setRevealingAll(true)
    for (let i = 0; i < leads.length; i++) {
      if (!revealed[i]) {
        await revealWithFlash(i)
      }
    }
    setRevealingAll(false)
  }, [leads, revealed, revealingAll, revealWithFlash])

  const tierCounts = leads.reduce<TierCount>(
    (acc, lead) => { acc[lead.tier]++; return acc },
    { LEGENDARY: 0, GOLD: 0, SILVER: 0, BRONZE: 0 }
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950/95 backdrop-blur-sm overflow-y-auto">
      {/* LEGENDARY gold flash overlay */}
      {flashActive && (
        <div className="fixed inset-0 z-[60] bg-yellow-400 opacity-30 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
        <h2 className="text-lg font-black text-white tracking-tight">Pack Reveal</h2>
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
      <div className="shrink-0 px-6 py-4 border-t border-gray-800 flex flex-col items-center gap-3">
        {allRevealed ? (
          <>
            {/* Summary bar */}
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
            <p className="text-emerald-400 font-bold text-sm">Pack Complete</p>
            <button
              onClick={onClose}
              className="px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
            >
              Continue to Purchase
            </button>
          </>
        ) : (
          <button
            onClick={handleRevealAll}
            disabled={revealingAll}
            className="px-8 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm transition-colors"
          >
            {revealingAll ? 'Revealing…' : 'Reveal All'}
          </button>
        )}
      </div>
    </div>
  )
}
