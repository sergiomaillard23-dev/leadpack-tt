import { EXCLUSIVE_PRICE_CENTS, COMMUNITY_PRICE_CENTS, COMMUNITY_MAX_BUYERS } from '@/lib/constants'

// NOTE: price_ttd, buyer_count, max_buyers, and EXCLUSIVE/COMMUNITY pack_type values
// require migration 003 before real DB queries can be used.
// Mock fixture uses the correct spec shape so no rework needed when the migration lands.
export type Pack = {
  id: string
  pack_label: 'A' | 'B' | 'C'
  lead_batch_id: string
  pack_type: 'EXCLUSIVE' | 'COMMUNITY'
  income_tier: 'STANDARD' | 'LEGENDARY'
  status: 'AVAILABLE' | 'CRACKED' | 'PURCHASED'
  price_ttd: number   // stored in cents, e.g. 10000 = TT$100.00
  buyer_count: number
  max_buyers: number  // 1 = EXCLUSIVE, 3 = COMMUNITY
}

const MOCK_PACKS: Pack[] = [
  {
    id: 'mock-pack-a',
    pack_label: 'A',
    lead_batch_id: 'mock-batch-001',
    pack_type: 'EXCLUSIVE',
    income_tier: 'STANDARD',
    status: 'AVAILABLE',
    price_ttd: EXCLUSIVE_PRICE_CENTS,
    buyer_count: 0,
    max_buyers: 1,
  },
  {
    id: 'mock-pack-b',
    pack_label: 'B',
    lead_batch_id: 'mock-batch-001',
    pack_type: 'COMMUNITY',
    income_tier: 'STANDARD',
    status: 'AVAILABLE',
    price_ttd: COMMUNITY_PRICE_CENTS,
    buyer_count: 1,
    max_buyers: COMMUNITY_MAX_BUYERS,
  },
  {
    id: 'mock-pack-c',
    pack_label: 'C',
    lead_batch_id: 'mock-batch-001',
    pack_type: 'COMMUNITY',
    income_tier: 'LEGENDARY',
    status: 'AVAILABLE',
    price_ttd: COMMUNITY_PRICE_CENTS,
    buyer_count: 0,
    max_buyers: COMMUNITY_MAX_BUYERS,
  },
]

/**
 * Returns available packs for the marketplace.
 * TODO: replace mock with real DB query once migration 003 is applied.
 */
export async function getAvailablePacks(): Promise<Pack[]> {
  return MOCK_PACKS
}
