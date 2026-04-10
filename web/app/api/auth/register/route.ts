import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { provisionAgent } from '@/lib/db/agents'
import { uploadKycDocument } from '@/lib/supabase/storage'
import { upsertDocument } from '@/lib/db/kyc'
import { normalizePhone } from '@/lib/utils'
import {
  KYC_ALLOWED_MIME_TYPES,
  KYC_MAX_FILE_BYTES,
  KYC_DOC_FIELDS,
} from '@/lib/constants'

// Plain anon client — no SSR cookie management needed here.
// We only need to create the user + trigger the confirmation email.
function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }

  // ── Validate text fields ──────────────────────────────────────────────────
  const name     = (formData.get('name')     as string | null)?.trim()
  const phone    = (formData.get('phone')    as string | null)?.trim()
  const email    = (formData.get('email')    as string | null)?.trim().toLowerCase()
  const password = formData.get('password')  as string | null

  if (!name || name.length < 2) {
    return NextResponse.json({ success: false, error: 'Full name is required' }, { status: 400 })
  }
  const normalizedPhone = phone ? normalizePhone(phone) : null
  if (!normalizedPhone) {
    return NextResponse.json(
      { success: false, error: 'Enter a valid T&T phone number (e.g. 18681234567)' },
      { status: 400 }
    )
  }
  if (!email) {
    return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { success: false, error: 'Password must be at least 8 characters' },
      { status: 400 }
    )
  }

  // ── Validate KYC documents ────────────────────────────────────────────────
  const files: Record<string, File> = {}
  for (const field of KYC_DOC_FIELDS) {
    const file = formData.get(field)
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: `Missing document: ${field.replace(/_/g, ' ').toLowerCase()}` },
        { status: 400 }
      )
    }
    if (!(KYC_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `${field}: only PDF, JPG, or PNG accepted` },
        { status: 400 }
      )
    }
    if (file.size > KYC_MAX_FILE_BYTES) {
      return NextResponse.json(
        { success: false, error: `${field}: file exceeds 5 MB limit` },
        { status: 400 }
      )
    }
    files[field] = file
  }

  // ── Create auth user (triggers Supabase confirmation email) ───────────────
  const supabase = getAnonClient()
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, phone: normalizedPhone },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (signUpError) {
    return NextResponse.json({ success: false, error: signUpError.message }, { status: 400 })
  }

  const user = data.user
  if (!user?.id) {
    // Supabase returns user=null when the email already exists but is unconfirmed.
    return NextResponse.json(
      { success: false, error: 'This email is already registered. Please check your inbox or sign in.' },
      { status: 409 }
    )
  }

  // ── Provision agent row, upload docs, set PENDING ─────────────────────────
  // All storage uploads happen before any DB writes (fail-fast).
  try {
    await provisionAgent(user.id, name, normalizedPhone, email)

    const uploads: Array<{ field: typeof KYC_DOC_FIELDS[number]; path: string }> = []
    for (const field of KYC_DOC_FIELDS) {
      const path = await uploadKycDocument(user.id, field, files[field])
      uploads.push({ field, path })
    }

    for (const { field, path } of uploads) {
      await upsertDocument(user.id, field, path)
    }

    // provisionAgent already inserts with kyc_status = 'PENDING'.
    // upsertDocument records are now in place — admin can review immediately
    // after the agent confirms their email.

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/auth/register]', err)
    // Auth user was created and email sent, but KYC upload failed.
    // The agent can log in after confirming email and re-upload via /onboarding/kyc.
    return NextResponse.json(
      {
        success: false,
        error:
          'Your account was created but document upload failed. ' +
          'Please check your email to confirm your account, then log in to upload your documents.',
      },
      { status: 500 }
    )
  }
}
