import { LEGENDARY_OVR_THRESHOLD, GOLD_OVR_THRESHOLD, SILVER_OVR_THRESHOLD } from '@/lib/constants'
import type { LeadStats, LeadTier, ScoredLead } from '@/lib/types/leads'

// --- INDIVIDUAL STAT CALCULATORS ---

function calcFRH(hoursSinceGenerated: number): number {
  if (hoursSinceGenerated < 2)  return 100
  if (hoursSinceGenerated < 4)  return 90
  if (hoursSinceGenerated < 12) return 75
  if (hoursSinceGenerated < 24) return 60
  if (hoursSinceGenerated < 48) return 45
  return 30
}

function calcINT(intentSource: string): number {
  const src = intentSource.toLowerCase()
  if (src === 'quote_request')    return 95
  if (src === 'eligibility_quiz') return 80
  if (src === 'fb_ad')            return 65
  if (src === 'pdf_download')     return 55
  return 50
}

function calcLOC(parish: string): number {
  const TIER_1 = ['westmoorings', 'valsayn', 'fairways', 'palmiste', 'glencoe', 'moka', 'long circular']
  const TIER_2 = ['chaguanas', 'san fernando', 'diego martin', 'maraval', 'st clair', 'newtown']
  const p = parish.toLowerCase()
  if (TIER_1.some(t => p.includes(t))) return 100
  if (TIER_2.some(t => p.includes(t))) return 85
  return 60
}

function calcFIN(monthlyIncomeTTD: number): number {
  if (monthlyIncomeTTD >= 25000) return 100
  if (monthlyIncomeTTD >= 15000) return 85
  if (monthlyIncomeTTD >= 8000)  return 70
  return 50
}

function calcSTA(employerType: string): number {
  const e = employerType.toLowerCase()
  if (e.includes('government') || e.includes('public sector')) return 95
  if (e.includes('medical') || e.includes('legal') || e.includes('doctor')) return 90
  if (e.includes('private')) return 80
  if (e.includes('self')) return 75
  return 55
}

function calcFIT(age: number): number {
  if (age >= 30 && age <= 45) return 100
  if (age >= 46 && age <= 60) return 85
  if (age >= 21 && age <= 29) return 80
  return 55
}

// --- MAIN OVR FUNCTION ---

export function calculateLeadStats(data: {
  hoursSinceGenerated: number
  intentSource: string
  parish: string
  monthlyIncomeTTD: number
  employerType: string
  age: number
}): LeadStats {
  return {
    frh: calcFRH(data.hoursSinceGenerated),
    int: calcINT(data.intentSource),
    loc: calcLOC(data.parish),
    fin: calcFIN(data.monthlyIncomeTTD),
    sta: calcSTA(data.employerType),
    fit: calcFIT(data.age),
  }
}

export function calculateLeadOVR(stats: LeadStats): number {
  const avg = (stats.frh + stats.int + stats.loc + stats.fin + stats.sta + stats.fit) / 6
  return Math.round(avg)
}

// LEGENDARY requires high income AND freshness — not just average
export function applyLegendaryGate(ovr: number, stats: LeadStats): number {
  if (ovr >= LEGENDARY_OVR_THRESHOLD) {
    if (stats.fin < 90 || stats.frh < 90) return LEGENDARY_OVR_THRESHOLD - 1  // demote to Gold max
  }
  return ovr
}

export function getLeadTier(ovr: number): LeadTier {
  if (ovr >= LEGENDARY_OVR_THRESHOLD) return 'LEGENDARY'
  if (ovr >= GOLD_OVR_THRESHOLD)      return 'GOLD'
  if (ovr >= SILVER_OVR_THRESHOLD)    return 'SILVER'
  return 'BRONZE'
}

export function scoreLead(data: {
  id: string
  first_name: string
  last_name: string
  parish: string
  income_bracket: string
  employer_type: string
  age: number
  intent_source: string
  hours_since_generated: number
  monthly_income_ttd: number
}): ScoredLead {
  const stats = calculateLeadStats({
    hoursSinceGenerated: data.hours_since_generated,
    intentSource: data.intent_source,
    parish: data.parish,
    monthlyIncomeTTD: data.monthly_income_ttd,
    employerType: data.employer_type,
    age: data.age,
  })
  const rawOvr = calculateLeadOVR(stats)
  const ovr = applyLegendaryGate(rawOvr, stats)
  return {
    id: data.id,
    first_name: data.first_name,
    last_name: data.last_name,
    parish: data.parish,
    income_bracket: data.income_bracket,
    employer_type: data.employer_type,
    age: data.age,
    intent_source: data.intent_source,
    hours_since_generated: data.hours_since_generated,
    stats,
    ovr,
    tier: getLeadTier(ovr),
  }
}
