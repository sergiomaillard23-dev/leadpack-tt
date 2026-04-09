import { scoreLead } from '@/lib/utils/scoring'
import type { ScoredLead } from '@/lib/types/leads'

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
 * Client-safe — no pg dependency.
 * Used until Migration 010 is applied on Railway.
 */
export function getMockLeadsForPack(_packId: string): ScoredLead[] {
  return RAW_MOCK_LEADS.map(scoreLead)
}
