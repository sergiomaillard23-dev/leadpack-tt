import { describe, it, expect } from 'vitest'
import { getAvailablePacks } from '@/lib/db/packs'

describe('getAvailablePacks', () => {
  it('returns exactly 3 packs', async () => {
    const packs = await getAvailablePacks()
    expect(packs).toHaveLength(3)
  })

  it('returns one pack per label A, B, C', async () => {
    const packs = await getAvailablePacks()
    const labels = packs.map((p) => p.pack_label).sort()
    expect(labels).toEqual(['A', 'B', 'C'])
  })

  it('all packs share the same lead_batch_id', async () => {
    const packs = await getAvailablePacks()
    const batchIds = new Set(packs.map((p) => p.lead_batch_id))
    expect(batchIds.size).toBe(1)
  })

  it('EXCLUSIVE pack has max_buyers 1', async () => {
    const packs = await getAvailablePacks()
    const exclusive = packs.find((p) => p.pack_type === 'EXCLUSIVE')
    expect(exclusive?.max_buyers).toBe(1)
  })

  it('COMMUNITY pack has max_buyers 3', async () => {
    const packs = await getAvailablePacks()
    const community = packs.find((p) => p.pack_type === 'COMMUNITY')
    expect(community?.max_buyers).toBe(3)
  })

  it('price_ttd is stored in cents', async () => {
    const packs = await getAvailablePacks()
    packs.forEach((p) => {
      expect(p.price_ttd).toBeGreaterThanOrEqual(100)
    })
  })
})
