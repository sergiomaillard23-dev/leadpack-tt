CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE lead_status AS ENUM('pending','in_pack','available','sold_exclusive','sold_community','retired','disputed');
CREATE TYPE pack_status AS ENUM('filling','ready','dropped','cracked','priority_window','distributed','expired');
CREATE TYPE purchase_type AS ENUM('exclusive','community');
CREATE TYPE dispute_reason AS ENUM('invalid_number','fraud');
CREATE TYPE dispute_status AS ENUM('pending','validated','rejected');

CREATE TABLE agents (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(100) NOT NULL,
  phone               VARCHAR(20)  UNIQUE NOT NULL,
  email               VARCHAR(150) UNIQUE,
  wallet_balance      INTEGER      NOT NULL DEFAULT 0,
  trust_score         SMALLINT     NOT NULL DEFAULT 100,
  is_subscribed       BOOLEAN      NOT NULL DEFAULT false,
  sub_expires_at      TIMESTAMPTZ,
  dispute_count       INTEGER      NOT NULL DEFAULT 0,
  valid_dispute_count INTEGER      NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE leads (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  source         VARCHAR(50) NOT NULL,
  status         lead_status NOT NULL DEFAULT 'pending',
  purchase_count SMALLINT    NOT NULL DEFAULT 0,
  max_purchases  SMALLINT    NOT NULL DEFAULT 1,
  income_bracket VARCHAR(30),
  intent_niche   VARCHAR(50),
  fact_find      JSONB       NOT NULL DEFAULT '{}',
  is_legendary   BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE packs (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_label          CHAR(1)     NOT NULL CHECK(pack_label IN('A','B','C')),
  pack_type           VARCHAR(20) NOT NULL DEFAULT 'standard',
  status              pack_status NOT NULL DEFAULT 'filling',
  timer_started_at    TIMESTAMPTZ,
  timer_expires_at    TIMESTAMPTZ,
  priority_agent_id   UUID        REFERENCES agents(id),
  priority_expires_at TIMESTAMPTZ,
  generation_batch    INTEGER     NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pack_leads (
  pack_id  UUID     REFERENCES packs(id) ON DELETE CASCADE,
  lead_id  UUID     REFERENCES leads(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY(pack_id, lead_id)
);

CREATE TABLE pack_purchases (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id             UUID          NOT NULL REFERENCES packs(id),
  agent_id            UUID          NOT NULL REFERENCES agents(id),
  purchase_type       purchase_type NOT NULL,
  amount_ttd          INTEGER       NOT NULL,
  priority_expires_at TIMESTAMPTZ,
  purchased_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE wallet_transactions (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id      UUID        NOT NULL REFERENCES agents(id),
  amount        INTEGER     NOT NULL,
  tx_type       VARCHAR(30) NOT NULL,
  reference_id  UUID,
  balance_after INTEGER     NOT NULL,
  gateway_ref   VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE disputes (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id       UUID           NOT NULL REFERENCES leads(id),
  agent_id      UUID           NOT NULL REFERENCES agents(id),
  reason        dispute_reason NOT NULL,
  status        dispute_status NOT NULL DEFAULT 'pending',
  twilio_result JSONB,
  credit_issued BOOLEAN        NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ,
  UNIQUE(lead_id, agent_id)
);

CREATE TABLE lead_status_updates (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id    UUID        NOT NULL REFERENCES leads(id),
  agent_id   UUID        NOT NULL REFERENCES agents(id),
  status     VARCHAR(30) NOT NULL,
  notes      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE legendary_schedule (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            VARCHAR(100) NOT NULL,
  income_threshold INTEGER,
  niche_filter     VARCHAR(50),
  drops_at         TIMESTAMPTZ  NOT NULL,
  pack_id          UUID         REFERENCES packs(id),
  is_released      BOOLEAN      NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION check_lead_retirement()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads
  SET status = CASE
    WHEN purchase_count >= max_purchases THEN 'retired'
    ELSE 'available'
  END
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lead_retirement
  AFTER INSERT ON pack_purchases
  FOR EACH ROW EXECUTE FUNCTION check_lead_retirement();

CREATE OR REPLACE FUNCTION update_trust_score(p_agent_id UUID)
RETURNS VOID AS $$
DECLARE v_total INT; v_valid INT; v_score INT;
BEGIN
  SELECT dispute_count, valid_dispute_count INTO v_total, v_valid
  FROM agents WHERE id = p_agent_id;
  v_score := CASE WHEN v_total = 0 THEN 100
             ELSE GREATEST(0, 100 - ((v_total - v_valid) * 15)) END;
  UPDATE agents SET trust_score = v_score WHERE id = p_agent_id;
END;
$$ LANGUAGE plpgsql;

CREATE INDEX idx_leads_status    ON leads(status);
CREATE INDEX idx_leads_legendary ON leads(is_legendary) WHERE is_legendary = true;
CREATE INDEX idx_packs_status    ON packs(status);
CREATE INDEX idx_disputes_agent  ON disputes(agent_id, status);
CREATE INDEX idx_wallet_agent    ON wallet_transactions(agent_id, created_at DESC);