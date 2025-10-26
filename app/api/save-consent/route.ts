import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const prisma = new PrismaClient()

/**
 * Save user consent preferences
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createServerSupabaseClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { audio, chat, context, faceData } = await request.json()

    console.log('💾 Saving consent for user:', authUser.id)
    console.log('   Consent:', { audio, chat, context, faceData })

    // Create or update user with consent preferences
    const user = await prisma.user.upsert({
      where: { id: authUser.id },
      update: {
        consentAudio: audio,
        consentChat: chat,
        consentContext: context,
        consentFaceData: faceData,
        consentTimestamp: new Date()
      },
      create: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || null,
        username: authUser.user_metadata?.username,
        photoUrls: '[]',
        consentAudio: audio,
        consentChat: chat,
        consentContext: context,
        consentFaceData: faceData,
        consentTimestamp: new Date()
      }
    })

    console.log('✅ Consent saved successfully')

    return NextResponse.json({
      success: true,
      consent: {
        audio: user.consentAudio,
        chat: user.consentChat,
        context: user.consentContext,
        faceData: user.consentFaceData,
        timestamp: user.consentTimestamp
      }
    })
  } catch (error: any) {
    console.error('❌ Save consent error:', error)
    console.error('   Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    })
    return NextResponse.json(
      { 
        error: 'Failed to save consent', 
        details: error.message,
        code: error.code,
        meta: error.meta 
      },
      { status: 500 }
    )
  }
}

