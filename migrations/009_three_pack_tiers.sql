-- 009_three_pack_tiers.sql
-- Redesign pack tiers from 4 (STARTER/EXCLUSIVE_STARTER/COMMUNITY/EXCLUSIVE)
-- to 3 (STANDARD/PREMIUM/LEGENDARY) and re-create pack_leads join table
-- (dropped in 002, required by journal.ts for per-pack lead counts).
--
-- New tier structure:
--   A  STANDARD   5 leads    TT$1,200  COMMUNITY   max 3 buyers
--   B  PREMIUM    20 leads   TT$2,400  COMMUNITY   max 2 buyers
--   C  LEGENDARY  20 leads   TT$3,600  EXCLUSIVE   max 1 buyer (Pro only)

-- ── Step 1: Re-create pack_leads join table ───────────────────────────────────
-- Dropped in 002, needed by journal.ts for accurate per-pack lead counts.
-- STANDARD packs get 5 leads, PREMIUM/LEGENDARY get all 20 from the same batch.

CREATE TABLE pack_leads (
  pack_id  UUID     NOT NULL REFERENCES packs(id)  ON DELETE CASCADE,
  lead_id  UUID     NOT NULL REFERENCES leads(id)  ON DELETE CASCADE,
  position SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (pack_id, lead_id)
);

CREATE INDEX idx_pack_leads_pack ON pack_leads(pack_id);
CREATE INDEX idx_pack_leads_lead ON pack_leads(lead_id);

-- ── Step 2: Clean up existing test packs (old tier names) ────────────────────
-- Safe to delete in dev — no production data yet.

DELETE FROM pack_cracks
WHERE pack_id IN (
  SELECT id FROM packs
  WHERE pack_name IN ('STARTER', 'EXCLUSIVE_STARTER', 'COMMUNITY', 'EXCLUSIVE')
);

DELETE FROM pack_purchases
WHERE pack_id IN (
  SELECT id FROM packs
  WHERE pack_name IN ('STARTER', 'EXCLUSIVE_STARTER', 'COMMUNITY', 'EXCLUSIVE')
);

DELETE FROM packs
WHERE pack_name IN ('STARTER', 'EXCLUSIVE_STARTER', 'COMMUNITY', 'EXCLUSIVE');

-- ── Step 3: Update pack_label constraint — remove 'D' ────────────────────────

ALTER TABLE packs DROP CONSTRAINT chk_pack_label;
ALTER TABLE packs ADD CONSTRAINT chk_pack_label
  CHECK (pack_label IN ('A', 'B', 'C'));

-- ── Step 4: Update pack_name constraint — new tier names ─────────────────────

ALTER TABLE packs DROP CONSTRAINT chk_pack_name;
ALTER TABLE packs ADD CONSTRAINT chk_pack_name
  CHECK (pack_name IN ('STANDARD', 'PREMIUM', 'LEGENDARY'));
