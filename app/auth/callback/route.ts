import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth Callback Route
 *
 * Handles Supabase email verification redirects
 * After user clicks email verification link, Supabase redirects here
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Mark this as a new verification so we show consent
      const redirectUrl = new URL(next, requestUrl.origin)
      redirectUrl.searchParams.set('verified', 'true')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If there's an error or no code, redirect to home
  return NextResponse.redirect(requestUrl.origin)
}
