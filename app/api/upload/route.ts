import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const audio = formData.get('audio') as File
    const contexts = formData.get('contexts') as string
    const photos: File[] = []
    
    // Collect all photos
    for (let i = 0; i < 5; i++) {
      const photo = formData.get(`photo${i}`) as File
      if (photo) {
        photos.push(photo)
      }
    }

    if (!audio || photos.length !== 5) {
      return NextResponse.json(
        { error: 'Missing required files' },
        { status: 400 }
      )
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        photoUrls: '[]',
      }
    })

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', user.id)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save audio file
    const audioBuffer = Buffer.from(await audio.arrayBuffer())
    const audioPath = join(uploadDir, 'recording.webm')
    await writeFile(audioPath, audioBuffer)

    // Save photos
    const photoUrls: string[] = []
    for (let i = 0; i < photos.length; i++) {
      const photoBuffer = Buffer.from(await photos[i].arrayBuffer())
      const photoPath = join(uploadDir, `photo-${i}.jpg`)
      await writeFile(photoPath, photoBuffer)
      photoUrls.push(`/uploads/${user.id}/photo-${i}.jpg`)
    }

    // Update user with file paths
    await prisma.user.update({
      where: { id: user.id },
      data: {
        audioUrl: `/uploads/${user.id}/recording.webm`,
        photoUrls: JSON.stringify(photoUrls),
      }
    })

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

