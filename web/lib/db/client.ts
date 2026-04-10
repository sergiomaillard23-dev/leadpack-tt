import { Pool } from 'pg'

// Singleton pool — reused across API route invocations in the same process.
// DATABASE_URL must be set in .env.local (local) or Vercel/Railway env vars (production).
// Do NOT throw at module level — that would break next build when env vars are runtime-only.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://localhost/leadpack_tt',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
})

export default pool
