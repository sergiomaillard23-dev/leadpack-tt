import { NextRequest, NextResponse } from 'next/server'
import { getProWiPayService } from '@/lib/payments/wipay'
import { activateProApplication } from '@/lib/db/pro'

/**
 * WiPay payment callback for Legendary Pro subscriptions.
 * WiPay POSTs here after the agent completes (or fails) checkout.
 */
export async function POST(req: NextRequest) {
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    payload = Object.fromEntries((await req.formData()).entries())
  }

  const wipay = getProWiPayService()

  let result: { transactionId: string; status: 'success' | 'failed'; orderId: string }
  try {
    result = await wipay.verifyCallback(payload)
  } catch (err) {
    console.error('[WiPay callback] verification failed', err)
    return NextResponse.json({ success: false, error: 'Invalid callback' }, { status: 400 })
  }

  if (result.status !== 'success') {
    // Payment failed — application stays PENDING_PAYMENT, agent can retry.
    return NextResponse.json({ success: true, activated: false })
  }

  try {
    await activateProApplication(result.orderId, result.transactionId)
  } catch (err) {
    console.error('[WiPay callback] activation failed', err)
    return NextResponse.json({ success: false, error: 'Activation failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, activated: true })
}
