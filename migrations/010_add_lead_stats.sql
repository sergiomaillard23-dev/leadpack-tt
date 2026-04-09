-- Migration 010: Add OVR scoring columns to leads table
-- Run AFTER migrations 001–009

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_stats      JSONB   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS calculated_ovr  INTEGER DEFAULT 0
    CHECK (calculated_ovr BETWEEN 0 AND 99);

-- Index for fast filtering by OVR (Scout feature)
CREATE INDEX IF NOT EXISTS idx_leads_ovr ON leads (calculated_ovr DESC);

-- NOTE: Do NOT run this migration until Railway Postgres is ready.
-- The web app uses mock data until this migration is applied.
