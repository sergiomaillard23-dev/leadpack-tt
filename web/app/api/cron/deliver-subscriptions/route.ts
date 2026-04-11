import { NextRequest, NextResponse } from 'next/server'
import { deliverSubscriptions } from '@/lib/db/subscriptions'

/**
 * Vercel Cron — runs daily at 08:00 AST (12:00 UTC).
 *
 * For each due subscription:
 *  - Advances next_delivery_at
 *  - Finds an available pack of the right tier
 *  - Debits the agent's wallet and records pack_purchase + wallet_transaction
 *
 * Skips gracefully on insufficient funds or no available packs.
 * Protected by CRON_SECRET in production (Vercel injects it automatically).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await deliverSubscriptions()

  const totalDelivered = results.reduce((n, r) => n + r.delivered, 0)
  const totalSkipped   = results.reduce((n, r) => n + r.skipped, 0)

  console.log(
    `[cron/deliver-subscriptions] subscriptions=${results.length} delivered=${totalDelivered} skipped=${totalSkipped}`,
    results
  )

  return NextResponse.json({
    success: true,
    subscriptions_fired: results.length,
    packs_delivered: totalDelivered,
    packs_skipped: totalSkipped,
    results,
  })
}
