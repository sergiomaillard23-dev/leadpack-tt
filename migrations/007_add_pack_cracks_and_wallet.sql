-- Migration 007: Add pack_cracks table, wallet_balance to agents, payment_type to wallet_transactions
-- Date: 2026-04-09
-- Purpose: Enable 5-minute pack preview windows and wallet top-up functionality

-- 1. Add wallet_balance column to agents table
ALTER TABLE agents ADD COLUMN wallet_balance INTEGER DEFAULT 0 NOT NULL;
COMMENT ON COLUMN agents.wallet_balance IS 'Agent wallet balance in cents (e.g., TT$500 = 50000)';

-- 2. Add payment_type column to wallet_transactions table
ALTER TABLE wallet_transactions ADD COLUMN payment_type VARCHAR(50) NOT NULL DEFAULT 'purchase';
COMMENT ON COLUMN wallet_transactions.payment_type IS 'Type of transaction: top_up or purchase';

-- 3. Create pack_cracks table to track 5-minute preview windows
CREATE TABLE pack_cracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  cracked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 minutes',
  purchased BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, pack_id)
);

COMMENT ON TABLE pack_cracks IS 'Tracks 5-minute preview windows when agents crack packs';
COMMENT ON COLUMN pack_cracks.agent_id IS 'Agent who cracked the pack';
COMMENT ON COLUMN pack_cracks.pack_id IS 'Pack that was cracked';
COMMENT ON COLUMN pack_cracks.expires_at IS 'When the 5-minute window expires';
COMMENT ON COLUMN pack_cracks.purchased IS 'Whether the agent completed purchase within window';

-- 4. Create indexes for efficient querying
CREATE INDEX idx_pack_cracks_agent_id ON pack_cracks(agent_id);
CREATE INDEX idx_pack_cracks_pack_id ON pack_cracks(pack_id);
CREATE INDEX idx_pack_cracks_expires_at ON pack_cracks(expires_at);
CREATE INDEX idx_pack_cracks_agent_pack ON pack_cracks(agent_id, pack_id);

-- 5. Create function to check if agent has active crack on pack
CREATE OR REPLACE FUNCTION agent_has_active_crack(p_agent_id UUID, p_pack_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pack_cracks
    WHERE agent_id = p_agent_id
      AND pack_id = p_pack_id
      AND expires_at > CURRENT_TIMESTAMP
      AND purchased = false
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Create function to check if agent is locked out (crack expired, not purchased)
CREATE OR REPLACE FUNCTION agent_is_locked_out(p_agent_id UUID, p_pack_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pack_cracks
    WHERE agent_id = p_agent_id
      AND pack_id = p_pack_id
      AND expires_at <= CURRENT_TIMESTAMP
      AND purchased = false
      AND (CURRENT_TIMESTAMP - expires_at) < INTERVAL '24 hours'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Create function to get remaining seconds on active crack
CREATE OR REPLACE FUNCTION get_crack_remaining_seconds(p_agent_id UUID, p_pack_id UUID)
RETURNS INTEGER AS $$
DECLARE
  remaining INTERVAL;
BEGIN
  SELECT (expires_at - CURRENT_TIMESTAMP) INTO remaining
  FROM pack_cracks
  WHERE agent_id = p_agent_id
    AND pack_id = p_pack_id
    AND expires_at > CURRENT_TIMESTAMP
    AND purchased = false;

  RETURN EXTRACT(EPOCH FROM remaining)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
