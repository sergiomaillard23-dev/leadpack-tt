export interface WiPayService {
  createCheckoutSession(args: {
    amountTTD: number
    orderId: string
    customerEmail: string
    returnUrl: string
  }): Promise<{ checkoutUrl: string; transactionId: string }>

  verifyCallback(payload: unknown): Promise<{
    transactionId: string
    status: 'success' | 'failed'
    orderId: string
  }>
}

// ── Mock (dev) ────────────────────────────────────────────────────────────────

class MockWiPayService implements WiPayService {
  async createCheckoutSession({ orderId, returnUrl }: Parameters<WiPayService['createCheckoutSession']>[0]) {
    const mockTxId = `mock-tx-${Date.now()}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    // Immediately "succeeds" by hitting the mock-success endpoint.
    const checkoutUrl =
      `${appUrl}/api/payments/mock-success?orderId=${orderId}&txId=${mockTxId}` +
      `&returnUrl=${encodeURIComponent(returnUrl)}`
    console.log('[MockWiPay] checkout →', checkoutUrl)
    return { checkoutUrl, transactionId: mockTxId }
  }

  async verifyCallback(payload: unknown) {
    // Mock callback is handled by the GET mock-success route, not this method.
    const p = payload as Record<string, string>
    return { transactionId: p.txId, status: 'success' as const, orderId: p.orderId }
  }
}

// ── Live stub (production) ────────────────────────────────────────────────────

class LiveWiPayService implements WiPayService {
  private readonly accountNumber: string
  private readonly apiKey: string

  constructor() {
    // TODO: load from WIPAY_PRO_ACCOUNT_NUMBER / WIPAY_PRO_API_KEY
    this.accountNumber = process.env.WIPAY_PRO_ACCOUNT_NUMBER ?? ''
    this.apiKey = process.env.WIPAY_PRO_API_KEY ?? ''
  }

  async createCheckoutSession(
    _args: Parameters<WiPayService['createCheckoutSession']>[0] // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<{ checkoutUrl: string; transactionId: string }> {
    // TODO: implement against WiPay's hosted-payment API.
    // Reference: https://wipayfinancial.com/developers (requires WiPay merchant account)
    // Expected: POST to WiPay endpoint with amount, order_id, account_number, api_key.
    // Returns a redirect URL to WiPay's hosted checkout page.
    throw new Error('LiveWiPayService.createCheckoutSession not yet implemented')
  }

  async verifyCallback(
    _payload: unknown // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<{ transactionId: string; status: 'success' | 'failed'; orderId: string }> {
    // TODO: verify HMAC/signature from WiPay using WIPAY_PRO_CALLBACK_SECRET.
    // Return { transactionId, status, orderId } parsed from payload.
    throw new Error('LiveWiPayService.verifyCallback not yet implemented')
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

let _instance: WiPayService | null = null

/** Returns the WiPay service for Pro subscriptions. Separate from wallet top-up credentials. */
export function getProWiPayService(): WiPayService {
  if (!_instance) {
    _instance =
      process.env.WIPAY_MODE === 'live' ? new LiveWiPayService() : new MockWiPayService()
  }
  return _instance
}
