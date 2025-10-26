import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { uploadAudio } from '@/lib/storage'

const prisma = new PrismaClient()

/**
 * Create User API - Creates user with audio only
 * Called right after recording completes (before photos/context)
 * Now syncs with Supabase auth user ID
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = createServerSupabaseClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const audio = formData.get('audio') as File

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio file required' },
        { status: 400 }
      )
    }

    // Create or update user in database using Supabase auth user ID
    const user = await prisma.user.upsert({
      where: { id: authUser.id },
      update: {
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name,
      },
      create: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name,
        photoUrls: '[]',
      }
    })

    console.log('✅ User created/updated:', user.id)

    // Upload audio to Supabase Storage
    console.log('📤 Uploading audio to Supabase Storage...')
    const audioUrl = await uploadAudio(authUser.id, audio)
    console.log('✅ Audio uploaded:', audioUrl)

    // Update user with audio URL
    await prisma.user.update({
      where: { id: user.id },
      data: {
        audioUrl: audioUrl,
      }
    })

    console.log('✅ User updated with audio URL')

    return NextResponse.json({ 
      success: true, 
      userId: user.id,
      message: 'User created with audio'
    })

  } catch (error: any) {
    console.error('❌ Create user error:', error)
    console.error('   Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      name: error.name
    })
    return NextResponse.json(
      { 
        error: 'User creation failed', 
        details: error.message,
        code: error.code,
        meta: error.meta
      },
      { status: 500 }
    )
  }
}

