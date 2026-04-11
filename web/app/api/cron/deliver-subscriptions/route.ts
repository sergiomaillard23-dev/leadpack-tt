import { NextRequest, NextResponse } from 'next/server'
import { claimDueSubscriptions } from '@/lib/db/subscriptions'

/**
 * Vercel Cron — runs daily at 08:00 AST (12:00 UTC).
 * Advances next_delivery_at for all due subscriptions and logs what fired.
 *
 * In production this route is protected by the CRON_SECRET header that
 * Vercel injects automatically. In dev you can hit it manually.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Enforce secret in production; allow open in dev
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const due = await claimDueSubscriptions()

  // Group by agent so the log is readable
  const summary = due.reduce<Record<string, { tier: string; qty: number }[]>>(
    (acc, sub) => {
      if (!acc[sub.agent_id]) acc[sub.agent_id] = []
      acc[sub.agent_id].push({ tier: sub.pack_tier, qty: sub.quantity_per_cycle })
      return acc
    },
    {}
  )

  console.log(`[cron/deliver-subscriptions] fired ${due.length} subscriptions`, summary)

  return NextResponse.json({
    success: true,
    fired: due.length,
    summary,
  })
}
