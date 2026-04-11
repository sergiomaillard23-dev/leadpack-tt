-- Migration 011: outreach_logs table
-- Logs every WhatsApp send attempt. Never fire and forget.

CREATE TABLE IF NOT EXISTS outreach_logs (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id            UUID        NOT NULL REFERENCES agents(id),
  lead_id             UUID        NOT NULL REFERENCES leads(id),
  channel             TEXT        NOT NULL DEFAULT 'WHATSAPP',
  recipient_phone     TEXT        NOT NULL,   -- formatted 18681234567
  message             TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'SENT',  -- 'SENT' | 'FAILED'
  whatsapp_message_id TEXT,                   -- wamid returned by Meta API
  error_message       TEXT,
  sent_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_outreach_status CHECK (status IN ('SENT', 'FAILED')),
  CONSTRAINT chk_outreach_channel CHECK (channel IN ('WHATSAPP'))
);

CREATE INDEX IF NOT EXISTS idx_outreach_agent  ON outreach_logs(agent_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_lead   ON outreach_logs(lead_id);
