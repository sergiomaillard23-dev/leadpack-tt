import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import pool from '@/lib/db/client'
import { getAgentByEmail } from '@/lib/db/agents'
import { getActiveCrack, markPurchased } from '@/lib/db/cracks'

type PackRow = {
  id: string
  lead_batch_id: string
  pack_type: 'EXCLUSIVE' | 'COMMUNITY'
  status: string
  price_ttd: number
  buyer_count: number
  max_buyers: number
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.pack_id || typeof body.pack_id !== 'string') {
    return NextResponse.json({ success: false, error: 'pack_id is required' }, { status: 400 })
  }
  const { pack_id } = body

  const agent = await getAgentByEmail(user.email)
  if (!agent) {
    return NextResponse.json(
      { success: false, error: 'Agent account not found. Please complete registration.' },
      { status: 403 }
    )
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Lock the pack row for the duration of this transaction
    const { rows: packRows } = await client.query<PackRow>(
      `SELECT id, lead_batch_id, pack_type, status, price_ttd, buyer_count, max_buyers
       FROM packs WHERE id = $1 FOR UPDATE`,
      [pack_id]
    )
    const pack = packRows[0]
    if (!pack) {
      await client.query('ROLLBACK')
      return NextResponse.json({ success: false, error: 'Pack not found' }, { status: 404 })
    }

    if (!['AVAILABLE', 'CRACKED'].includes(pack.status)) {
      await client.query('ROLLBACK')
      return NextResponse.json(
        { success: false, error: `Pack is not available for purchase (status: ${pack.status})` },
        { status: 409 }
      )
    }

    if (pack.buyer_count >= pack.max_buyers) {
      await client.query('ROLLBACK')
      return NextResponse.json({ success: false, error: 'Pack is sold out' }, { status: 409 })
    }

    // If pack is CRACKED, confirm this agent holds an active crack window
    if (pack.status === 'CRACKED') {
      const crack = await getActiveCrack(agent.id, pack_id)
      if (!crack) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { success: false, error: 'Your preview window has expired. Crack the pack again to purchase.' },
          { status: 403 }
        )
      }
    }

    // Debit wallet atomically — fails if balance would go negative
    const { rowCount: debitRows } = await client.query(
      `UPDATE agents
       SET wallet_balance = wallet_balance - $1
       WHERE id = $2 AND wallet_balance >= $1`,
      [pack.price_ttd, agent.id]
    )
    if (!debitRows || debitRows === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json(
        { success: false, error: 'Insufficient wallet balance' },
        { status: 402 }
      )
    }

    // Increment buyer_count; mark PURCHASED if now full, else back to AVAILABLE
    const { rows: updatedPack } = await client.query<{ buyer_count: number; status: string }>(
      `UPDATE packs
       SET buyer_count = buyer_count + 1,
           status = CASE
             WHEN buyer_count + 1 >= max_buyers THEN 'PURCHASED'
             ELSE 'AVAILABLE'
           END
       WHERE id = $1 AND buyer_count < max_buyers
       RETURNING buyer_count, status`,
      [pack_id]
    )
    if (!updatedPack[0]) {
      await client.query('ROLLBACK')
      return NextResponse.json({ success: false, error: 'Pack sold out during transaction' }, { status: 409 })
    }

    // Record the purchase
    const { rows: purchase } = await client.query(
      `INSERT INTO pack_purchases (pack_id, agent_id, purchase_type, amount_ttd)
       VALUES ($1, $2, $3, $4)
       RETURNING id, purchased_at`,
      [pack_id, agent.id, pack.pack_type.toLowerCase(), pack.price_ttd]
    )

    // Record the wallet transaction
    const { rows: agentRows } = await client.query<{ wallet_balance: number }>(
      'SELECT wallet_balance FROM agents WHERE id = $1',
      [agent.id]
    )
    await client.query(
      `INSERT INTO wallet_transactions (agent_id, amount, tx_type, reference_id, balance_after)
       VALUES ($1, $2, 'PACK_PURCHASE', $3, $4)`,
      [agent.id, -pack.price_ttd, purchase[0].id, agentRows[0].wallet_balance]
    )

    await client.query('COMMIT')

    // Mark crack as purchased outside the transaction (non-critical)
    await markPurchased(agent.id, pack_id).catch((err) =>
      console.error('[purchase] markPurchased failed', err)
    )

    return NextResponse.json({
      success: true,
      data: {
        purchase_id: purchase[0].id,
        purchased_at: purchase[0].purchased_at,
        pack_id,
        credits_spent: pack.price_ttd,
        new_balance: agentRows[0].wallet_balance,
      },
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[POST /api/packs/purchase]', err)
    return NextResponse.json({ success: false, error: 'Purchase failed' }, { status: 500 })
  } finally {
    client.release()
  }
}
