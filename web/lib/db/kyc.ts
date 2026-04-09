import pool from '@/lib/db/client'

export type KycDocument = {
  doc_type: 'INSURANCE_LICENSE' | 'GOVERNMENT_ID_1' | 'GOVERNMENT_ID_2'
  storage_path: string
  uploaded_at: Date
}

export async function upsertDocument(
  agent_id: string,
  doc_type: string,
  storage_path: string
): Promise<void> {
  await pool.query(
    `INSERT INTO kyc_documents (agent_id, doc_type, storage_path)
     VALUES ($1, $2, $3)
     ON CONFLICT (agent_id, doc_type) DO UPDATE SET storage_path = $3, uploaded_at = now()`,
    [agent_id, doc_type, storage_path]
  )
}

export async function getDocuments(agent_id: string): Promise<KycDocument[]> {
  const { rows } = await pool.query<KycDocument>(
    `SELECT doc_type, storage_path, uploaded_at
     FROM kyc_documents WHERE agent_id = $1 ORDER BY uploaded_at ASC`,
    [agent_id]
  )
  return rows
}

export async function setKycStatus(
  agent_id: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED',
  reason?: string
): Promise<void> {
  await pool.query(
    `UPDATE agents SET kyc_status = $2, kyc_rejected_reason = $3 WHERE id = $1`,
    [agent_id, status, reason ?? null]
  )
}
