# Agent Provisioning + KYC Verification — Design Spec
**Date:** 2026-04-08  
**Status:** Approved

---

## Context

New agents register via Supabase Auth but currently get no row in the `agents` table, causing 403 errors on all marketplace actions. Additionally, the platform requires that only licensed T&T insurance agents gain access — enforced by requiring upload of an insurance license and two government IDs before marketplace access is granted. An admin reviews submissions and approves or rejects them.

---

## Architecture Overview

```
Register (name+phone+email+password)
  → Supabase Auth signUp (stores name+phone in user_metadata)
  → Email verification
  → /auth/callback exchanges code, upserts agents row (kyc_status=PENDING)
  → Redirect to /onboarding/kyc

/onboarding/kyc
  → Upload 3 documents to Supabase Storage
  → POST /api/kyc/submit → writes kyc_documents rows
  → Shows "Under review" state

Dashboard layout
  → If agent.kyc_status != 'APPROVED' → redirect /onboarding/kyc

/admin/kyc (ADMIN_EMAILS gated via middleware)
  → Lists PENDING agents with signed document URLs
  → PATCH /api/admin/kyc/[agentId] → APPROVE or REJECT
```

---

## Section 1: Database (Migration 006)

```sql
ALTER TABLE agents
  ADD COLUMN kyc_status text NOT NULL DEFAULT 'PENDING'
    CHECK (kyc_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  ADD COLUMN kyc_rejected_reason text;

CREATE TABLE kyc_documents (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id     uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  doc_type     text NOT NULL
    CHECK (doc_type IN ('INSURANCE_LICENSE', 'GOVERNMENT_ID_1', 'GOVERNMENT_ID_2')),
  storage_path text NOT NULL,
  uploaded_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, doc_type)
);
```

**Note on existing agents:** Migration 006 defaults `kyc_status = 'PENDING'` for all existing rows. The test agent (`volatusfinancial33@gmail.com`) must be manually set to `APPROVED` after migration, or the migration can include a one-time UPDATE for known dev accounts.

**Supabase Storage bucket:** `kyc-documents` (private)  
**Path format:** `{agent_id}/{doc_type}.{ext}`  
e.g. `550e8400-e29b-41d4-a716-446655440000/INSURANCE_LICENSE.pdf`

---

## Section 2: Registration + Provisioning

### Register page (`app/(auth)/register/page.tsx`)
Fields collected (in order):
1. Full Name (`text`, required)
2. Phone (`text`, required, validated against `^1-868-\d{3}-\d{4}$`)
3. Email (`email`, required)
4. Password (`password`, min 8 chars)

Calls:
```typescript
supabase.auth.signUp({
  email, password,
  options: { data: { full_name: name, phone } }
})
```

Shows "Check your email" confirmation — no redirect until link is clicked.

### Auth callback (`app/auth/callback/route.ts`)
After `exchangeCodeForSession` succeeds:
```typescript
await pool.query(`
  INSERT INTO agents (name, phone, email, kyc_status)
  VALUES ($1, $2, $3, 'PENDING')
  ON CONFLICT (email) DO NOTHING
`, [user.user_metadata.full_name, user.user_metadata.phone, user.email])
```
`ON CONFLICT DO NOTHING` — re-clicking magic links never overwrites an existing agent.

Redirects to `/onboarding/kyc` after provisioning.

---

## Section 3: KYC Onboarding Page

**Route:** `/onboarding/kyc` (outside `(dashboard)` group — no sidebar/header)  
**Auth:** Must be logged in (middleware still applies), but no kyc_status check here.

The page server-side checks `kyc_status`: if already `APPROVED`, redirects to `/marketplace`. If `PENDING` (already submitted), shows "Under review" state immediately without the form.

### States
- `idle` — upload form with 3 file inputs
- `submitting` — loading state
- `submitted` — "Under review" confirmation
- `rejected` — shows rejection reason + re-upload form

### Upload form
Three required file inputs:
- Insurance License (`INSURANCE_LICENSE`)
- Government ID #1 (`GOVERNMENT_ID_1`)
- Government ID #2 (`GOVERNMENT_ID_2`)

Accepted formats: PDF, JPG, PNG. Max 5MB per file.

### API: `POST /api/kyc/submit`
1. Auth check — get agent by email
2. Upload each file to Supabase Storage using service role key
   - Path: `{agent_id}/{doc_type}.{ext}`
3. Upsert `kyc_documents` rows (ON CONFLICT (agent_id, doc_type) DO UPDATE)
4. Set `agents.kyc_status = 'PENDING'` (handles re-submission after rejection)
5. Return `{ success: true }`

---

## Section 4: Dashboard Gating

In `app/(dashboard)/layout.tsx`, after fetching the agent:
```typescript
if (agent && agent.kyc_status !== 'APPROVED') {
  redirect('/onboarding/kyc')
}
```

The existing 403 on API routes (`getAgentByEmail` returns null → 403) provides a second layer of protection for non-provisioned agents.

---

## Section 5: Admin KYC Review

### Middleware protection
`middleware.ts` — if path starts with `/admin`:
- Get Supabase user
- Check `user.email` is in `process.env.ADMIN_EMAILS` (comma-separated)
- If not → redirect `/marketplace`

### Route: `/admin/kyc`
Table of PENDING agents showing:
- Name, email, phone, submitted_at
- Three document links (Supabase signed URLs, 1-hour expiry, generated server-side with service role key)
- Approve / Reject buttons (reject opens a reason input)

### API: `PATCH /api/admin/kyc/[agentId]`
Body: `{ action: 'APPROVE' | 'REJECT', reason?: string }`

- Admin check (email in ADMIN_EMAILS)
- `APPROVE` → `UPDATE agents SET kyc_status = 'APPROVED' WHERE id = $1`
- `REJECT` → `UPDATE agents SET kyc_status = 'REJECTED', kyc_rejected_reason = $2 WHERE id = $1`
- Returns `{ success: true }`

---

## Environment Variables Required

```bash
# Already set
SUPABASE_SERVICE_ROLE_KEY=   # for Storage uploads + signed URLs

# New
ADMIN_EMAILS=volatusfinancial33@gmail.com  # comma-separated admin emails
```

---

## Files to Create / Modify

| Action | Path |
|---|---|
| New migration | `migrations/006_agent_kyc.sql` |
| Modify | `web/app/(auth)/register/page.tsx` |
| Modify | `web/app/auth/callback/route.ts` |
| New page | `web/app/onboarding/kyc/page.tsx` |
| New API | `web/app/api/kyc/submit/route.ts` |
| Modify | `web/app/(dashboard)/layout.tsx` |
| Modify | `web/middleware.ts` |
| New page | `web/app/admin/kyc/page.tsx` |
| New API | `web/app/api/admin/kyc/[agentId]/route.ts` |
| Modify | `web/lib/db/agents.ts` (add kyc_status to type) |
| New | `web/.env.local` (add ADMIN_EMAILS) |
