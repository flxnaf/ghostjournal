import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const prisma = new PrismaClient()

/**
 * Check if user has given consent
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const { supabase } = createRouteHandlerClient(request)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      console.error('Auth error in user-consent:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user exists and has consent
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        consentAudio: true,
        consentChat: true,
        consentContext: true,
        consentFaceData: true,
        consentTimestamp: true
      }
    })

    // If user doesn't exist yet or no consent timestamp, they haven't consented
    const hasConsent = user && user.consentTimestamp !== null

    return NextResponse.json({
      hasConsent,
      consent: user || {
        consentAudio: false,
        consentChat: false,
        consentContext: false,
        consentFaceData: false
      }
    })
  } catch (error: any) {
    console.error('Check consent error:', error)
    return NextResponse.json(
      { error: 'Failed to check consent', details: error.message },
      { status: 500 }
    )
  }
}

