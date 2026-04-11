import pool from '@/lib/db/client'

export type Pack = {
  id: string
  pack_label: 'A' | 'B' | 'C'
  pack_name: 'STANDARD' | 'PREMIUM' | 'LEGENDARY'
  lead_batch_id: string
  pack_type: 'EXCLUSIVE' | 'COMMUNITY'
  income_tier: 'STANDARD' | 'LEGENDARY'
  status: 'AVAILABLE' | 'CRACKED' | 'PRIORITY_WINDOW' | 'PURCHASED' | 'RETIRED'
  price_ttd: number   // cents, e.g. 60000 = TT$600.00
  buyer_count: number
  max_buyers: number
  pack_size: number   // leads visible in this pack (5 or 20)
  release_at: Date | null
  pro_early_access_at: Date | null
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
      p.pack_size,
      p.release_at,
      p.pro_early_access_at
    FROM packs p
    JOIN lead_batches lb ON lb.id = p.lead_batch_id
    WHERE p.status = 'AVAILABLE'
      AND p.buyer_count < p.max_buyers
      -- Include packs in Pro early-access window so the UI can show the lock/badge
      AND (p.release_at IS NULL OR p.pro_early_access_at <= now())
    ORDER BY lb.created_at DESC, p.pack_label ASC
  `)
  return rows
}

