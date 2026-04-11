-- Add company field to agents
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS company TEXT;
