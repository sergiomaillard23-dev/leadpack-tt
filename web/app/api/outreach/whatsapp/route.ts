import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import pool from '@/lib/db/client'
import { getAgentByEmail } from '@/lib/db/agents'
import { logOutreach, hasRecentOutreach } from '@/lib/db/outreach'

type LeadRow = {
  id: string
  phone: string | null           // direct column (import_excel_leads path)
  fact_find_phone: string | null // fact_find->>'phone' (processor.py path)
  full_name: string | null
  fact_find_first: string | null
  fact_find_last: string | null
}

/** Format 1-868-XXX-XXXX → 18681234567 for WhatsApp Cloud API */
function formatForWhatsApp(phone: string): string {
  return phone.replace(/-/g, '')
}

/** Build the approved outreach message */
function buildMessage(params: {
  leadName: string
  agentName: string
  agentPhone: string
}): string {
  return (
    `Good day ${params.leadName}, my name is ${params.agentName}. ` +
    `I am reaching out regarding a financial planning consultation. ` +
    `Would you be available for a brief call this week? ` +
    `You may reply to this message or call me at ${params.agentPhone}.`
  )
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const agent = await getAgentByEmail(user.email)
  if (!agent) {
    return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 403 })
  }

  if (!agent.is_subscribed) {
    return NextResponse.json(
      { success: false, error: 'WhatsApp outreach is a Pro feature. Upgrade to send messages.' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => null)
  const { lead_id } = body ?? {}
  if (!lead_id || typeof lead_id !== 'string') {
    return NextResponse.json({ success: false, error: 'lead_id is required' }, { status: 400 })
  }

  // Fetch lead — support both direct-column and fact_find storage paths
  const { rows } = await pool.query<LeadRow>(
    `SELECT id,
            phone,
            fact_find->>'phone'      AS fact_find_phone,
            full_name,
            fact_find->>'first_name' AS fact_find_first,
            fact_find->>'last_name'  AS fact_find_last
     FROM leads WHERE id = $1`,
    [lead_id]
  )
  const lead = rows[0]
  if (!lead) {
    return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
  }

  const rawPhone = lead.phone ?? lead.fact_find_phone
  if (!rawPhone) {
    return NextResponse.json(
      { success: false, error: 'Lead has no phone number on record' },
      { status: 422 }
    )
  }

  // Cooldown: prevent duplicate sends within 24 h
  if (await hasRecentOutreach(agent.id, lead_id)) {
    return NextResponse.json(
      { success: false, error: 'A message was already sent to this lead within the last 24 hours' },
      { status: 429 }
    )
  }

  // Fetch agent full name and phone for the message
  const { rows: agentRows } = await pool.query<{ full_name: string; phone: string }>(
    'SELECT full_name, phone FROM agents WHERE id = $1',
    [agent.id]
  )
  const agentFull = agentRows[0]

  const leadName =
    lead.fact_find_first
      ? `${lead.fact_find_first} ${lead.fact_find_last ?? ''}`.trim()
      : (lead.full_name ?? 'there')

  const message = buildMessage({
    leadName,
    agentName: agentFull?.full_name ?? user.email,
    agentPhone: agentFull?.phone ?? '',
  })

  const waPhone = formatForWhatsApp(rawPhone)
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    return NextResponse.json(
      { success: false, error: 'WhatsApp credentials not configured' },
      { status: 503 }
    )
  }

  // Send via WhatsApp Cloud API
  let waMessageId: string | undefined
  let sendError: string | undefined

  try {
    const waRes = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: waPhone,
          type: 'text',
          text: { body: message, preview_url: false },
        }),
      }
    )

    const waJson = await waRes.json()

    if (!waRes.ok) {
      sendError = waJson?.error?.message ?? `WhatsApp API error ${waRes.status}`
    } else {
      waMessageId = waJson?.messages?.[0]?.id
    }
  } catch (err) {
    sendError = err instanceof Error ? err.message : 'Network error reaching WhatsApp API'
  }

  // Always log the attempt
  await logOutreach({
    agent_id: agent.id,
    lead_id,
    recipient_phone: waPhone,
    message,
    status: sendError ? 'FAILED' : 'SENT',
    whatsapp_message_id: waMessageId,
    error_message: sendError,
  }).catch((e) => console.error('[outreach] logOutreach failed', e))

  if (sendError) {
    return NextResponse.json({ success: false, error: sendError }, { status: 502 })
  }

  return NextResponse.json({
    success: true,
    data: { whatsapp_message_id: waMessageId, recipient: waPhone },
  })
}
