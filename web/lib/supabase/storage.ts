import { createClient } from '@supabase/supabase-js'

// Service role client — server-side only, never import in client components.
function getServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase env vars for service role client')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

const BUCKET = 'kyc-documents'

/**
 * Upload a file buffer to Supabase Storage.
 * Path format: {agentId}/{docType}.{ext}
 * Returns the storage path on success.
 */
export async function uploadKycDocument(
  agentId: string,
  docType: string,
  file: File
): Promise<string> {
  const EXT_MAP: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg':      'jpg',
    'image/png':       'png',
  }
  const ext = EXT_MAP[file.type] ?? 'bin'
  const path = `${agentId}/${docType}.${ext}`
  const supabase = getServiceClient()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  return path
}

/**
 * Generate a short-lived signed URL for admin document review.
 * Expires in 1 hour.
 */
export async function getSignedUrl(storagePath: string): Promise<string> {
  const supabase = getServiceClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600)

  if (error || !data) throw new Error(`Signed URL failed: ${error?.message}`)
  return data.signedUrl
}
