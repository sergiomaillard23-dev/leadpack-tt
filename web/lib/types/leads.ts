export type LeadTier = 'LEGENDARY' | 'GOLD' | 'SILVER' | 'BRONZE'

export interface LeadStats {
  frh: number  // Freshness     0–100
  int: number  // Intent        0–100
  loc: number  // Location      0–100
  fin: number  // Financials    0–100
  sta: number  // Stability     0–100
  fit: number  // Product Fit   0–100
}

export interface ScoredLead {
  id: string
  first_name: string
  last_name: string
  parish: string
  income_bracket: string
  employer_type: string
  age: number
  intent_source: string
  hours_since_generated: number
  stats: LeadStats
  ovr: number
  tier: LeadTier
}
