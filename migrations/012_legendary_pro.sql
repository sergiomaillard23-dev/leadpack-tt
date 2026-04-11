-- 012_legendary_pro.sql
-- Introduces LeadPack Legendary Pro: membership fields, upgrade-flow tables,
-- WhatsApp templates, CRM pipeline status, pack early-access timestamps,
-- and auto-subscription delivery.
-- Run after 011_outreach_logs.sql.

-- 1. Pro membership fields on agents

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS is_legendary_pro           BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pro_activated_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pro_membership_expires_at  TIMESTAMPTZ;

-- Carry forward any agents already marked as subscribed.
UPDATE agents
   SET is_legendary_pro           = true,
       pro_membership_expires_at  = sub_expires_at
 WHERE is_subscribed = true
   AND sub_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agents_legendary_pro
  ON agents (is_legendary_pro) WHERE is_legendary_pro = true;

-- 2. Pro applications (upgrade / signup flow)

CREATE TABLE IF NOT EXISTS pro_applications (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id              UUID        NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  full_name             TEXT        NOT NULL,
  email                 TEXT        NOT NULL,
  billing_address_line1 TEXT        NOT NULL,
  billing_address_line2 TEXT,
  city                  TEXT        NOT NULL,
  country               TEXT        NOT NULL DEFAULT 'Trinidad and Tobago',
  status                TEXT        NOT NULL DEFAULT 'PENDING_PAYMENT'
    CHECK (status IN ('PENDING_PAYMENT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED')),
  wipay_transaction_id  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pro_applications_agent  ON pro_applications (agent_id);
CREATE INDEX IF NOT EXISTS idx_pro_applications_status ON pro_applications (status);

-- 3. WhatsApp templates

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id   UUID        NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  is_default BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_agent ON whatsapp_templates (agent_id);

-- Enforce at most one default template per agent.
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_templates_one_default
  ON whatsapp_templates (agent_id) WHERE is_default = true;

-- 4. Lead notes (CRM thread)

CREATE TABLE IF NOT EXISTS lead_notes (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id    UUID        NOT NULL REFERENCES leads(id)  ON DELETE CASCADE,
  agent_id   UUID        NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead  ON lead_notes (lead_id,  created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_notes_agent ON lead_notes (agent_id, created_at DESC);

-- 5. Pipeline status on leads

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS pipeline_status TEXT NOT NULL DEFAULT 'NEW'
    CHECK (pipeline_status IN ('NEW', 'CONTACTED', 'QUOTED', 'CLOSED_WON', 'CLOSED_LOST'));

CREATE INDEX IF NOT EXISTS idx_leads_pipeline ON leads (pipeline_status);

-- 6. Pack early-access timestamps

ALTER TABLE packs
  ADD COLUMN IF NOT EXISTS release_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pro_early_access_at TIMESTAMPTZ;

-- 7. Auto-subscription packs

CREATE TABLE IF NOT EXISTS pack_subscriptions (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id           UUID        NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  pack_tier          TEXT        NOT NULL
    CHECK (pack_tier IN ('STANDARD', 'PREMIUM', 'LEGENDARY')),
  quantity_per_cycle INTEGER     NOT NULL DEFAULT 1 CHECK (quantity_per_cycle > 0),
  cycle_days         INTEGER     NOT NULL DEFAULT 30 CHECK (cycle_days > 0),
  next_delivery_at   TIMESTAMPTZ NOT NULL,
  active             BOOLEAN     NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pack_subscriptions_agent    ON pack_subscriptions (agent_id);
CREATE INDEX IF NOT EXISTS idx_pack_subscriptions_delivery ON pack_subscriptions (next_delivery_at)
  WHERE active = true;
