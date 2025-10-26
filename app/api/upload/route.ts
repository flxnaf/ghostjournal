import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { uploadPhotos } from '@/lib/storage'

const prisma = new PrismaClient()

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

    const contexts = formData.get('contexts') as string
    const photoBlobs: Blob[] = []

    // Collect all photos
    for (let i = 0; i < 5; i++) {
      const photo = formData.get(`photo${i}`) as File
      if (photo) {
        photoBlobs.push(photo)
      }
    }

    if (photoBlobs.length !== 5) {
      return NextResponse.json(
        { error: 'All 5 photos are required' },
        { status: 400 }
      )
    }

    // Upload photos to Supabase Storage (pass authenticated client)
    console.log('📤 Uploading photos to Supabase Storage...')
    const photoUrls = await uploadPhotos(authUser.id, photoBlobs, supabase)
    console.log('✅ Photos uploaded:', photoUrls)

    // Update user with photo URLs
    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        photoUrls: JSON.stringify(photoUrls),
      }
    })

    console.log('✅ User updated with photo URLs')

    // Parse and store contexts
    if (contexts) {
      const contextData = JSON.parse(contexts)
      
      // Store each context as a memory
      for (const [category, content] of Object.entries(contextData)) {
        if (content && typeof content === 'string' && content.trim()) {
          await prisma.memory.create({
            data: {
              userId: user.id,
              content: content as string,
              category: category,
              embedding: '', // Will be updated by memory service
            }
          })
        }
      }
    }

    // Create voice model BEFORE returning (critical for chat to work)
    console.log('⏳ Creating voice model for user:', user.id)
    
    try {
      const voiceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/voice-clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      const voiceData = await voiceResponse.json()
      console.log('✅ Voice model created:', voiceData.modelId)
    } catch (voiceError: any) {
      console.error('❌ Voice model creation failed:', voiceError.message)
      // Continue even if voice fails - user can still chat
    }

    // Start personality/memory processing in background (non-critical)
    console.log('⏳ Starting background personality processing...')
    setTimeout(() => {
      processPersonalityAndMemory(user.id).catch((error) => {
        console.error('❌ Background processing failed:', error)
      })
    }, 100)

    return NextResponse.json({ 
      success: true, 
      userId: user.id,
      message: 'Voice model ready! Processing personality...'
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

async function processPersonalityAndMemory(userId: string) {
  try {
    console.log(`🔄 Processing personality and memory for ${userId}`)
    
    // 1. Process personality (Claude)
    console.log('🧠 Processing personality...')
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
              const personalityResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/personality`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const personalityData = await personalityResponse.json()
      console.log('✅ Personality processed:', personalityData)
    } catch (personalityError: any) {
      console.error('❌ Personality processing error:', personalityError.message)
      // Continue even if personality fails
    }
    
    // 2. Create memory embeddings (Chroma)
    console.log('💾 Creating memory embeddings...')
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
              const memoryResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'initialize' }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('✅ Memory embeddings created')
    } catch (memoryError: any) {
      console.warn('⚠️ Memory embedding failed (optional):', memoryError.message)
      // This is optional, continue without
    }

    console.log('✅✅✅ User data processing completed:', userId)
  } catch (error: any) {
    console.error('❌❌❌ Background processing error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
  }
}

