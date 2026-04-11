import { NextRequest, NextResponse } from 'next/server'
import { activateProApplication } from '@/lib/db/pro'

/**
 * Dev-only mock payment success handler.
 * The MockWiPayService redirects here instead of a real WiPay hosted page.
 * Immediately activates the Pro application and redirects the agent.
 */
export async function GET(req: NextRequest) {
  if (process.env.WIPAY_MODE === 'live') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const orderId = searchParams.get('orderId')
  const txId    = searchParams.get('txId')

  if (!orderId || !txId) {
    return NextResponse.json({ error: 'Missing orderId or txId' }, { status: 400 })
  }

  try {
    await activateProApplication(orderId, txId)
  } catch (err) {
    console.error('[mock-success] activation failed', err)
    return NextResponse.json({ error: 'Activation failed' }, { status: 500 })
  }

  const url = req.nextUrl.clone()
  url.pathname = '/pro/upgrade/success'
  url.search = ''
  return NextResponse.redirect(url)
}
