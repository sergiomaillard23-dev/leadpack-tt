-- 003_pack_fields.sql
-- Aligns the packs table with the full product spec:
--   - Adds price_ttd, buyer_count, max_buyers, pack_name, pack_size
--   - Fixes pack_type default ('standard' → 'COMMUNITY')
--   - Migrates status from old ENUM to TEXT with new vocabulary
--   - Expands pack_label to allow 'D' (4 pack tiers per batch)
--   - Drops legacy inline timer columns (replaced by pack_timers in 004)
--
-- Pack tiers:
--   A  STARTER           5 leads   $150 TTD  (3000 cents/lead × 5)  max 3 buyers
--   B  EXCLUSIVE_STARTER 5 leads   $500 TTD  (10000 cents/lead × 5) max 1 buyer
--   C  COMMUNITY         20 leads  $600 TTD  (3000 cents/lead × 20) max 3 buyers
--   D  EXCLUSIVE         20 leads  $2000 TTD (10000 cents/lead × 20) max 1 buyer

-- ── Step 1: Add new fields ────────────────────────────────────────────────────

ALTER TABLE packs
  ADD COLUMN price_ttd   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN buyer_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN max_buyers  INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN pack_name   TEXT    NOT NULL DEFAULT 'COMMUNITY',
  ADD COLUMN pack_size   INTEGER NOT NULL DEFAULT 20;

-- ── Step 2: Fix pack_label to allow 'D' ──────────────────────────────────────

ALTER TABLE packs DROP CONSTRAINT packs_pack_label_check;
ALTER TABLE packs ADD CONSTRAINT chk_pack_label
  CHECK (pack_label IN ('A', 'B', 'C', 'D'));

-- ── Step 3: Fix pack_type default and constraint ──────────────────────────────

ALTER TABLE packs ALTER COLUMN pack_type SET DEFAULT 'COMMUNITY';
-- Normalize any legacy 'standard' values before adding the constraint
UPDATE packs SET pack_type = 'COMMUNITY' WHERE pack_type NOT IN ('EXCLUSIVE', 'COMMUNITY');
ALTER TABLE packs ADD CONSTRAINT chk_pack_type
  CHECK (pack_type IN ('EXCLUSIVE', 'COMMUNITY'));

-- ── Step 4: Migrate status from ENUM to TEXT ─────────────────────────────────
-- Drop default first (it references the enum), convert type, remap values,
-- then add new constraint and default.

ALTER TABLE packs ALTER COLUMN status DROP DEFAULT;
ALTER TABLE packs ALTER COLUMN status TYPE TEXT USING status::TEXT;

UPDATE packs SET status = 'AVAILABLE'       WHERE status IN ('filling', 'ready');
UPDATE packs SET status = 'CRACKED'         WHERE status = 'cracked';
UPDATE packs SET status = 'PRIORITY_WINDOW' WHERE status = 'priority_window';
UPDATE packs SET status = 'PURCHASED'       WHERE status = 'distributed';
UPDATE packs SET status = 'RETIRED'         WHERE status IN ('dropped', 'expired');

ALTER TABLE packs ADD CONSTRAINT chk_pack_status
  CHECK (status IN ('AVAILABLE', 'CRACKED', 'PRIORITY_WINDOW', 'PURCHASED', 'RETIRED'));
ALTER TABLE packs ALTER COLUMN status SET DEFAULT 'AVAILABLE';

DROP TYPE IF EXISTS pack_status;

-- ── Step 5: Add buyer_count, pack_name, pack_size constraints ─────────────────

ALTER TABLE packs ADD CONSTRAINT chk_buyer_count
  CHECK (buyer_count <= max_buyers);

ALTER TABLE packs ADD CONSTRAINT chk_pack_name
  CHECK (pack_name IN ('STARTER', 'EXCLUSIVE_STARTER', 'COMMUNITY', 'EXCLUSIVE'));

ALTER TABLE packs ADD CONSTRAINT chk_pack_size
  CHECK (pack_size IN (5, 20));

-- ── Step 6: Drop legacy inline timer columns ──────────────────────────────────
-- Replaced by the pack_timers table (see 004_pack_timers.sql).

ALTER TABLE packs
  DROP COLUMN IF EXISTS timer_started_at,
  DROP COLUMN IF EXISTS timer_expires_at,
  DROP COLUMN IF EXISTS priority_agent_id,
  DROP COLUMN IF EXISTS priority_expires_at;
