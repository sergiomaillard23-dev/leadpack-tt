import { Pool } from 'pg'

// Singleton pool — reused across API route invocations in the same process.
// DATABASE_URL must be set in .env.local (local) or Railway env vars (production).
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export default pool
