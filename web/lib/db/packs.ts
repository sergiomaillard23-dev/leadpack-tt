import pool from '@/lib/db/client'
import { scoreLead } from '@/lib/utils/scoring'
import type { ScoredLead } from '@/lib/types/leads'

export type Pack = {
  id: string
  pack_label: 'A' | 'B' | 'C' | 'D'
  pack_name: 'STARTER' | 'EXCLUSIVE_STARTER' | 'COMMUNITY' | 'EXCLUSIVE'
  lead_batch_id: string
  pack_type: 'EXCLUSIVE' | 'COMMUNITY'
  income_tier: 'STANDARD' | 'LEGENDARY'
  status: 'AVAILABLE' | 'CRACKED' | 'PRIORITY_WINDOW' | 'PURCHASED' | 'RETIRED'
  price_ttd: number   // cents, e.g. 60000 = TT$600.00
  buyer_count: number
  max_buyers: number
  pack_size: number   // leads visible in this pack (5 or 20)
}

/**
 * Returns all packs that are currently available for purchase on the marketplace.
 * Excludes packs where buyer_count has reached max_buyers (full community packs).
 */
export async function getAvailablePacks(): Promise<Pack[]> {
  const { rows } = await pool.query<Pack>(`
    SELECT
      p.id,
      p.pack_label,
      p.pack_name,
      p.lead_batch_id,
      p.pack_type,
      lb.income_tier,
      p.status,
      p.price_ttd,
      p.buyer_count,
      p.max_buyers,
      p.pack_size
    FROM packs p
    JOIN lead_batches lb ON lb.id = p.lead_batch_id
    WHERE p.status = 'AVAILABLE'
      AND p.buyer_count < p.max_buyers
    ORDER BY lb.created_at DESC, p.pack_label ASC
  `)
  return rows
}

// --- MOCK DATA (used until Migration 010 is applied on Railway) ---

const RAW_MOCK_LEADS = [
  {
    id: 'mock-lead-1',
    first_name: 'Marcus',
    last_name: 'Williams',
    parish: 'Westmoorings',
    income_bracket: '25000+',
    employer_type: 'Government',
    age: 38,
    intent_source: 'quote_request',
    hours_since_generated: 1,
    monthly_income_ttd: 32000,
  },
  {
    id: 'mock-lead-2',
    first_name: 'Priya',
    last_name: 'Ramsaran',
    parish: 'Chaguanas',
    income_bracket: '15000-25000',
    employer_type: 'Private',
    age: 34,
    intent_source: 'eligibility_quiz',
    hours_since_generated: 6,
    monthly_income_ttd: 18000,
  },
  {
    id: 'mock-lead-3',
    first_name: 'Devon',
    last_name: 'Joseph',
    parish: 'San Fernando',
    income_bracket: '8000-15000',
    employer_type: 'Self-Employed',
    age: 42,
    intent_source: 'fb_ad',
    hours_since_generated: 20,
    monthly_income_ttd: 11000,
  },
  {
    id: 'mock-lead-4',
    first_name: 'Anita',
    last_name: 'Mohammed',
    parish: 'Arima',
    income_bracket: '0-8000',
    employer_type: 'Private',
    age: 26,
    intent_source: 'pdf_download',
    hours_since_generated: 72,
    monthly_income_ttd: 5500,
  },
  {
    id: 'mock-lead-5',
    first_name: 'Kezia',
    last_name: 'Baptiste',
    parish: 'Valsayn',
    income_bracket: '25000+',
    employer_type: 'Medical',
    age: 41,
    intent_source: 'quote_request',
    hours_since_generated: 1,
    monthly_income_ttd: 28000,
  },
]

/**
 * Returns 5 mock scored leads for a pack.
 * Used until Migration 010 is applied and real lead data is available.
 * Includes at least one LEGENDARY lead (mock-lead-1 and mock-lead-5 qualify).
 */
export function getMockLeadsForPack(_packId: string): ScoredLead[] {
  return RAW_MOCK_LEADS.map(scoreLead)
}
