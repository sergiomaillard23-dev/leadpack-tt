-- 004_pack_timers.sql
-- Adds the pack_timers table — a DB-backed stub for the 5-minute priority window.
-- Mirrors the Redis key structure: pack_timer:{lead_batch_id} → {agent_id, expires_at}
-- When Upstash Redis is wired in, this table is dropped and lib/db/timers.ts
-- is repointed to the Redis REST client with no other changes required.
--
-- One row per lead_batch_id (PRIMARY KEY) enforces the spec rule:
--   "Only one agent can hold a priority window on a given lead_batch_id at a time."

CREATE TABLE pack_timers (
  lead_batch_id   UUID        NOT NULL PRIMARY KEY REFERENCES lead_batches(id) ON DELETE CASCADE,
  agent_id        UUID        NOT NULL REFERENCES agents(id),
  cracked_pack_id UUID        NOT NULL REFERENCES packs(id),
  expires_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_pack_timers_agent ON pack_timers(agent_id);
CREATE INDEX idx_pack_timers_expires ON pack_timers(expires_at);
