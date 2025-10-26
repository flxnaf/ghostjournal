import { createBrowserClient } from '@supabase/ssr'

/**
 * Create Supabase client for browser/client components
 * Use this in client components (components with 'use client')
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  
  // Check if environment variables are set
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'https://placeholder.supabase.co' || 
      supabaseKey === 'placeholder-key') {
    
    // Only throw error in production (not during build)
    if (typeof window !== 'undefined') {
      console.error('❌ Supabase environment variables not configured!')
      console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in Railway')
    }
    
    // Return a mock client during build or when not configured
    // This prevents build errors while still allowing the app to show an error message
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder'
    )
  }
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}
