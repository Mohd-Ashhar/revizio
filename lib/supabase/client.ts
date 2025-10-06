import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in browser components.
 * This client is a singleton, meaning only one instance is created.
 * It reads the Supabase URL and anon key from environment variables.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
