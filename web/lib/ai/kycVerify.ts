// @anthropic-ai/sdk: needed for automated AI-powered KYC document verification
import Anthropic from '@anthropic-ai/sdk'
import { setKycStatus } from '@/lib/db/kyc'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type KycVerdict =
  | { status: 'APPROVED' }
  | { status: 'REJECTED'; reason: string }
  | { status: 'PENDING' } // uncertain — left for manual admin review

/**
 * Send all three KYC documents to Claude Haiku for automated verification.
 * Updates the agent's kyc_status in the DB and returns the verdict.
 * File objects are read directly from memory — no re-download from storage needed.
 */
export async function verifyKycDocuments(
  agentId: string,
  docs: Array<{ docType: string; file: File }>
): Promise<KycVerdict> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = []

  for (const { docType, file } of docs) {
    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')
    content.push({ type: 'text', text: `Document: ${docType}` })

    if (file.type === 'application/pdf') {
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      })
    } else {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: file.type as 'image/jpeg' | 'image/png',
          data: base64,
        },
      })
    }
  }

  content.push({
    type: 'text',
    text: `You are verifying KYC documents for a Trinidad and Tobago insurance agent marketplace.

Check each document against its requirement:
- INSURANCE_LICENSE: Current, unexpired T&T insurance industry licence. Must show agent name, licence number, and expiry date.
- GOVERNMENT_ID_1: Valid T&T government-issued photo ID (passport, driver's permit, or national ID card).
- GOVERNMENT_ID_2: A second, different type of T&T government-issued photo ID.

Reject if: any document is clearly expired, illegible, not a T&T government or insurance document, or both IDs appear to be the same type.
Use MANUAL_REVIEW if you cannot clearly read or assess any document.
Approve only if all three documents visibly meet their requirements.

Reply with ONLY valid JSON — no markdown, no other text:
{"decision":"APPROVED"}
OR
{"decision":"REJECTED","reason":"Short reason shown to the agent"}
OR
{"decision":"MANUAL_REVIEW"}`,
  })

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  let parsed: { decision: string; reason?: string }
  try {
    const match = raw.match(/\{[\s\S]*?\}/)
    parsed = match ? JSON.parse(match[0]) : { decision: 'MANUAL_REVIEW' }
  } catch {
    parsed = { decision: 'MANUAL_REVIEW' }
  }

  if (parsed.decision === 'APPROVED') {
    await setKycStatus(agentId, 'APPROVED')
    return { status: 'APPROVED' }
  }

  if (
    parsed.decision === 'REJECTED' &&
    typeof parsed.reason === 'string' &&
    parsed.reason.trim()
  ) {
    await setKycStatus(agentId, 'REJECTED', parsed.reason.trim())
    return { status: 'REJECTED', reason: parsed.reason.trim() }
  }

  // MANUAL_REVIEW or unexpected parse failure — leave PENDING for admin
  return { status: 'PENDING' }
}
