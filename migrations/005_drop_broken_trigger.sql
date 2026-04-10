-- 005_drop_broken_trigger.sql
-- Removes the trg_lead_retirement trigger which references NEW.lead_id,
-- a column that no longer exists on pack_purchases after the pack_leads
-- join table was dropped in migration 002.
-- Lead status tracking will be re-implemented when the trader journal is built.

DROP TRIGGER IF EXISTS trg_lead_retirement ON pack_purchases;
DROP FUNCTION IF EXISTS check_lead_retirement();
