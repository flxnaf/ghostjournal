import { createBrowserClient } from '@supabase/ssr'

/**
 * Create Supabase client for browser/client components
 * Use this in client components (components with 'use client')
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}
