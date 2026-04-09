import pool from '@/lib/db/client'

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

