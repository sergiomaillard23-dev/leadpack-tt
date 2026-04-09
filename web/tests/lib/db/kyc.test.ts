import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/client', () => ({
  default: { query: vi.fn() },
}))

import { upsertDocument, getDocuments, setKycStatus } from '@/lib/db/kyc'
import pool from '@/lib/db/client'

describe('upsertDocument', () => {
  beforeEach(() => vi.mocked(pool.query).mockResolvedValue({ rows: [] } as any))

  it('calls INSERT with correct doc_type and storage_path', async () => {
    await upsertDocument('agent-1', 'INSURANCE_LICENSE', 'agent-1/INSURANCE_LICENSE.pdf')
    const sql = vi.mocked(pool.query).mock.calls[0][0] as string
    expect(sql).toMatch(/INSERT INTO kyc_documents/)
    expect(vi.mocked(pool.query).mock.calls[0][1]).toEqual([
      'agent-1', 'INSURANCE_LICENSE', 'agent-1/INSURANCE_LICENSE.pdf',
    ])
  })
})

describe('getDocuments', () => {
  it('returns rows for agent', async () => {
    const mockRows = [{ doc_type: 'INSURANCE_LICENSE', storage_path: 'x', uploaded_at: new Date() }]
    vi.mocked(pool.query).mockResolvedValue({ rows: mockRows } as any)
    const docs = await getDocuments('agent-1')
    expect(docs).toHaveLength(1)
    expect(docs[0].doc_type).toBe('INSURANCE_LICENSE')
  })
})

describe('setKycStatus', () => {
  it('calls UPDATE with correct status', async () => {
    vi.mocked(pool.query).mockResolvedValue({ rows: [] } as any)
    await setKycStatus('agent-1', 'APPROVED')
    const call = vi.mocked(pool.query).mock.calls[0]
    expect(call[1]).toContain('agent-1')
    expect(call[1]).toContain('APPROVED')
  })

  it('passes null as reason when not provided', async () => {
    await setKycStatus('agent-1', 'APPROVED')
    expect(vi.mocked(pool.query).mock.calls[0][1]).toEqual(['agent-1', 'APPROVED', null])
  })

  it('passes reason string when status is REJECTED', async () => {
    await setKycStatus('agent-1', 'REJECTED', 'Document expired')
    expect(vi.mocked(pool.query).mock.calls[0][1]).toEqual(['agent-1', 'REJECTED', 'Document expired'])
  })
})
