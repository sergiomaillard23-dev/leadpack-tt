import { createBrowserClient } from '@supabase/ssr'

/**
 * Use in client components ('use client').
 * Creates a Supabase client that reads/writes cookies in the browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
