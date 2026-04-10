-- 002_add_lead_batches.sql
-- Introduces the lead_batches table and migrates the pack/lead relationship
-- from the pack_leads join table + generation_batch integer to the batch model
-- described in CLAUDE.md §3.1: all 3 sibling packs share one lead_batch_id.

-- ── New table ────────────────────────────────────────────────────────────────

CREATE TABLE lead_batches (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by UUID        REFERENCES agents(id),
  income_tier TEXT        NOT NULL DEFAULT 'STANDARD'
                          CHECK (income_tier IN ('STANDARD', 'LEGENDARY')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Add batch FK to existing tables ─────────────────────────────────────────

ALTER TABLE leads ADD COLUMN lead_batch_id UUID REFERENCES lead_batches(id);
ALTER TABLE packs ADD COLUMN lead_batch_id UUID REFERENCES lead_batches(id);

-- ── Remove superseded columns / tables ───────────────────────────────────────
-- generation_batch (integer) is replaced by lead_batch_id (UUID FK).
-- pack_leads join table is replaced by leads.lead_batch_id —
-- all leads in a batch are retrieved via: SELECT * FROM leads WHERE lead_batch_id = <id>

ALTER TABLE packs DROP COLUMN generation_batch;
DROP TABLE pack_leads;

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_leads_batch ON leads(lead_batch_id);
CREATE INDEX idx_packs_batch ON packs(lead_batch_id);
