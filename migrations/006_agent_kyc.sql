-- 006_agent_kyc.sql
-- Adds KYC status tracking to agents and a documents table.
-- Existing agents default to PENDING. Set known dev accounts to APPROVED manually.

ALTER TABLE agents
  ADD COLUMN kyc_status text NOT NULL DEFAULT 'PENDING'
    CHECK (kyc_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  ADD COLUMN kyc_rejected_reason text;

CREATE TABLE kyc_documents (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id     uuid        NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  doc_type     text        NOT NULL
    CHECK (doc_type IN ('INSURANCE_LICENSE', 'GOVERNMENT_ID_1', 'GOVERNMENT_ID_2')),
  storage_path text        NOT NULL,
  uploaded_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, doc_type)
);

CREATE INDEX idx_kyc_docs_agent ON kyc_documents(agent_id);
CREATE INDEX idx_agents_kyc     ON agents(kyc_status);
