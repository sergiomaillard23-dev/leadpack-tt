import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail } from '@/lib/db/agents'
import { uploadKycDocument } from '@/lib/supabase/storage'
import { upsertDocument, setKycStatus } from '@/lib/db/kyc'
import { KYC_ALLOWED_MIME_TYPES, KYC_MAX_FILE_BYTES, KYC_DOC_FIELDS } from '@/lib/constants'
import { verifyKycDocuments } from '@/lib/ai/kycVerify'

// Give AI verification enough time to download files and call Claude.
export const maxDuration = 60

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

  if (agent.kyc_status === 'APPROVED') {
    return NextResponse.json(
      { success: false, error: 'KYC already approved' },
      { status: 409 }
    )
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ success: false, error: 'Invalid form data' }, { status: 400 })
  }

  // Validate all three files are present and valid
  const files: Record<string, File> = {}
  for (const field of KYC_DOC_FIELDS) {
    const file = formData.get(field)
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: `Missing document: ${field}` },
        { status: 400 }
      )
    }
    if (!(KYC_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `${field}: only PDF, JPG, PNG accepted` },
        { status: 400 }
      )
    }
    if (file.size > KYC_MAX_FILE_BYTES) {
      return NextResponse.json(
        { success: false, error: `${field}: file exceeds 5MB limit` },
        { status: 400 }
      )
    }
    files[field] = file
  }

  // Phase 1: upload all files (stop at first failure before touching DB)
  try {
    const uploads: Array<{ field: typeof KYC_DOC_FIELDS[number]; path: string }> = []
    for (const field of KYC_DOC_FIELDS) {
      const path = await uploadKycDocument(agent.id, field, files[field])
      uploads.push({ field, path })
    }

    // Phase 2: persist all DB rows (all storage uploads succeeded)
    for (const { field, path } of uploads) {
      await upsertDocument(agent.id, field, path)
    }
    await setKycStatus(agent.id, 'PENDING')

    // Phase 3: AI verification — reads files from memory, no re-download needed.
    // Sets kyc_status to APPROVED, REJECTED, or leaves PENDING for manual review.
    const docs = KYC_DOC_FIELDS.map((field) => ({ docType: field, file: files[field] }))
    const verdict = await verifyKycDocuments(agent.id, docs)

    if (verdict.status === 'REJECTED') {
      return NextResponse.json({
        success: true,
        kycStatus: 'REJECTED',
        reason: verdict.reason,
      })
    }
    return NextResponse.json({ success: true, kycStatus: verdict.status })
  } catch (err) {
    console.error('[POST /api/kyc/submit]', err)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
