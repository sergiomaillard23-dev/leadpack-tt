import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail } from '@/lib/db/agents'
import { uploadKycDocument } from '@/lib/supabase/storage'
import { upsertDocument, setKycStatus } from '@/lib/db/kyc'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const DOC_FIELDS = ['INSURANCE_LICENSE', 'GOVERNMENT_ID_1', 'GOVERNMENT_ID_2'] as const

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const agent = await getAgentByEmail(user.email)
  if (!agent) {
    return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 403 })
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ success: false, error: 'Invalid form data' }, { status: 400 })
  }

  // Validate all three files are present and valid
  const files: Record<string, File> = {}
  for (const field of DOC_FIELDS) {
    const file = formData.get(field)
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: `Missing document: ${field}` },
        { status: 400 }
      )
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `${field}: only PDF, JPG, PNG accepted` },
        { status: 400 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: `${field}: file exceeds 5MB limit` },
        { status: 400 }
      )
    }
    files[field] = file
  }

  // Upload all files then write DB rows
  try {
    for (const field of DOC_FIELDS) {
      const path = await uploadKycDocument(agent.id, field, files[field])
      await upsertDocument(agent.id, field, path)
    }
    await setKycStatus(agent.id, 'PENDING')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/kyc/submit]', err)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
