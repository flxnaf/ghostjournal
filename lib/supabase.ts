import { createBrowserClient } from '@supabase/ssr'

/**
 * Create Supabase client for browser/client components
 * Use this in client components (components with 'use client')
 */
export function createClient() {
  // Use placeholder values during build if env vars not set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'placeholder-key'
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}
