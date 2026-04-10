import { Redis } from '@upstash/redis'

// Serverless-compatible Redis client via Upstash REST API.
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set.
// Falls back gracefully at build time (no top-level throw).
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? 'https://localhost',
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? 'placeholder',
})

export default redis

// Key helpers
export const packTimerKey = (pack_id: string, agent_id: string) =>
  `pack_timer:${pack_id}:${agent_id}`

export const packLockoutKey = (pack_id: string, agent_id: string) =>
  `pack_lockout:${pack_id}:${agent_id}`

export const PRIORITY_WINDOW_SECONDS = 300  // 5 minutes
export const LOCKOUT_SECONDS = 86400        // 24 hours
