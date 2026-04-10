import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the pg pool before importing getAvailablePacks
vi.mock('@/lib/db/client', () => ({
  default: { query: vi.fn() },
}))

import { getAvailablePacks } from '@/lib/db/packs'
import pool from '@/lib/db/client'

const MOCK_ROWS = [
  {
    id: 'pack-a',
    pack_label: 'A',
    pack_name: 'STARTER',
    lead_batch_id: 'batch-001',
    pack_type: 'COMMUNITY',
    income_tier: 'STANDARD',
    status: 'AVAILABLE',
    price_ttd: 15000,
    buyer_count: 0,
    max_buyers: 3,
    pack_size: 5,
  },
  {
    id: 'pack-b',
    pack_label: 'B',
    pack_name: 'EXCLUSIVE_STARTER',
    lead_batch_id: 'batch-001',
    pack_type: 'EXCLUSIVE',
    income_tier: 'STANDARD',
    status: 'AVAILABLE',
    price_ttd: 50000,
    buyer_count: 0,
    max_buyers: 1,
    pack_size: 5,
  },
  {
    id: 'pack-c',
    pack_label: 'C',
    pack_name: 'COMMUNITY',
    lead_batch_id: 'batch-001',
    pack_type: 'COMMUNITY',
    income_tier: 'STANDARD',
    status: 'AVAILABLE',
    price_ttd: 60000,
    buyer_count: 0,
    max_buyers: 3,
    pack_size: 20,
  },
  {
    id: 'pack-d',
    pack_label: 'D',
    pack_name: 'EXCLUSIVE',
    lead_batch_id: 'batch-001',
    pack_type: 'EXCLUSIVE',
    income_tier: 'STANDARD',
    status: 'AVAILABLE',
    price_ttd: 200000,
    buyer_count: 0,
    max_buyers: 1,
    pack_size: 20,
  },
]

describe('getAvailablePacks', () => {
  beforeEach(() => {
    vi.mocked(pool.query).mockResolvedValue({ rows: MOCK_ROWS } as any)
  })

  it('returns 4 packs per batch', async () => {
    const packs = await getAvailablePacks()
    expect(packs).toHaveLength(4)
  })

  it('returns one pack per label A, B, C, D', async () => {
    const packs = await getAvailablePacks()
    const labels = packs.map((p) => p.pack_label).sort()
    expect(labels).toEqual(['A', 'B', 'C', 'D'])
  })

  it('EXCLUSIVE and EXCLUSIVE_STARTER packs have max_buyers 1', async () => {
    const packs = await getAvailablePacks()
    const exclusive = packs.filter((p) => p.pack_type === 'EXCLUSIVE')
    exclusive.forEach((p) => expect(p.max_buyers).toBe(1))
  })

  it('COMMUNITY and STARTER packs have max_buyers 3', async () => {
    const packs = await getAvailablePacks()
    const community = packs.filter((p) => p.pack_type === 'COMMUNITY')
    community.forEach((p) => expect(p.max_buyers).toBe(3))
  })

  it('starter packs have pack_size 5', async () => {
    const packs = await getAvailablePacks()
    const starters = packs.filter((p) => p.pack_size === 5)
    expect(starters).toHaveLength(2)
  })

  it('price_ttd is stored in cents (>= 100)', async () => {
    const packs = await getAvailablePacks()
    packs.forEach((p) => expect(p.price_ttd).toBeGreaterThanOrEqual(100))
  })
})
