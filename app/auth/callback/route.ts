import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ OAuth callback error:', error)
      console.error('   Error details:', error.message, error.status)
      // Redirect to error page or home with error
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://replik.tech'
      return NextResponse.redirect(new URL('/?error=auth_failed', baseUrl))
    }
    
    console.log('✅ OAuth session created successfully')

    // Create or update user in Prisma database (for OAuth users)
    if (data.user) {
      try {
        console.log('🔄 Creating/updating Prisma user record for OAuth user:', data.user.id)
        
        await prisma.user.upsert({
          where: { id: data.user.id },
          update: {
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
            username: data.user.user_metadata?.username,
          },
          create: {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
            username: data.user.user_metadata?.username,
            photoUrls: '[]',
          }
        })
        
        console.log('✅ Prisma user record created/updated')
      } catch (dbError) {
        console.error('⚠️ Failed to create Prisma user record:', dbError)
        // Don't fail the auth flow, just log the error
      }
    }
  }

  // Redirect to home page after successful confirmation
  // Use production URL to avoid proxy/localhost issues
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://replik.tech'
  return NextResponse.redirect(new URL(next, baseUrl))
}

