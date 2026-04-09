-- Migration 008: Rename agents.name to agents.full_name
-- Date: 2026-04-09
-- Purpose: Align column name with codebase and spec (CLAUDE.md uses full_name)

ALTER TABLE agents RENAME COLUMN name TO full_name;
