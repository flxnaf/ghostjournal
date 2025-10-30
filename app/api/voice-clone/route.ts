import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'
import FormData from 'form-data'
import axios from 'axios'

const prisma = new PrismaClient()

/**
 * Fish Audio API Integration
 * 
 * Documentation: https://fish.audio/docs
 * 
 * Steps:
 * 1. Upload audio sample
 * 2. Create voice model
 * 3. Store model ID for TTS
 */

export async function POST(request: NextRequest) {
  console.log('🎙️ Voice clone API called - Creating trained S1 model')
  try {
    const { userId } = await request.json()
    console.log('   User ID:', userId)

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.audioUrl) {
      console.error('❌ User not found or no audio:', { userId, audioUrl: user?.audioUrl })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ User found, audio URL:', user.audioUrl)

    // Read audio file (handle both local paths and remote URLs)
    let audioBuffer: Buffer
    
    if (user.audioUrl.startsWith('http://') || user.audioUrl.startsWith('https://')) {
      // Remote URL (Supabase Storage) - download it
      console.log('🌐 Downloading audio from remote URL...')
      const response = await axios.get(user.audioUrl, { responseType: 'arraybuffer' })
      audioBuffer = Buffer.from(response.data)
      console.log('✅ Downloaded audio, size:', audioBuffer.length, 'bytes')
    } else {
      // Local file path
      console.log('📁 Reading audio from local filesystem...')
      const audioPath = join(process.cwd(), 'public', user.audioUrl)
      audioBuffer = await readFile(audioPath)
      console.log('✅ Read audio file, size:', audioBuffer.length, 'bytes')
    }

    // Fish Audio API endpoint
    const FISH_API_KEY = process.env.FISH_AUDIO_API_KEY
    console.log('🔑 Fish Audio API Key:', FISH_API_KEY ? `Present (${FISH_API_KEY.substring(0, 10)}...)` : '❌ MISSING')

    if (!FISH_API_KEY || FISH_API_KEY === 'your_fish_audio_api_key_here') {
      console.warn('⚠️ Fish Audio API key not configured or placeholder')
      // Mock response for development
      const mockModelId = `mock_${userId}_${Date.now()}`
      await prisma.user.update({
        where: { id: userId },
        data: { voiceModelId: mockModelId }
      })
      return NextResponse.json({
        modelId: mockModelId,
        status: 'ready',
        message: 'Mock voice model created (Fish Audio API key not configured)'
      })
    }

    // Step 1: Create trained voice model using Fish Audio S1
    console.log('🧠 Creating trained voice model (S1) - this takes 2-3 minutes...')
    
    try {
      const FormData = require('form-data')
      const formData = new FormData()
      
      // Model metadata
      formData.append('title', `Clone_${userId.substring(0, 8)}`)
      formData.append('type', 'tts') // Required: TTS model
      formData.append('train_mode', 'fast') // Required: Fast training (S1 model)
      formData.append('description', 'Custom voice clone')
      formData.append('visibility', 'private') // Private = no cover image needed
      formData.append('enhance_audio_quality', 'true') // Optional: Better quality!
      
      // Add audio sample (Fish Audio expects 'voices' not 'audios')
      formData.append('voices', audioBuffer, {
        filename: 'voice.webm',
        contentType: 'audio/webm'
      })
      
      // Add the text that was read (helps with ASR/training)
      const recordingText = "I walk through the park every morning before work. The trees sway gently in the breeze, and birds sing their morning songs. Sometimes I stop to watch a squirrel gather nuts or see dew glistening on spider webs. These quiet moments help me start my day with a clear mind."
      formData.append('texts', recordingText)
      
      console.log('📤 Uploading audio and creating model...')
      const createResponse = await axios.post(
        'https://api.fish.audio/model',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${FISH_API_KEY}`,
            ...formData.getHeaders()
          },
          timeout: 180000 // 3 minute timeout for training
        }
      )

      console.log('✅ Model creation response:', createResponse.status)
      console.log('📄 Response data:', JSON.stringify(createResponse.data).substring(0, 200))
      
      const modelId = createResponse.data._id || createResponse.data.id
      
      if (!modelId) {
        console.error('❌ No model ID in response:', createResponse.data)
        throw new Error('Fish Audio did not return model ID')
      }
      
      console.log('✅ Trained voice model created! ID:', modelId)
      console.log('⏳ Model is training in background (2-3 minutes)')

      // Update user with voice model ID
      await prisma.user.update({
        where: { id: userId },
        data: { voiceModelId: modelId }
      })
      
      console.log('💾 Voice model ID saved to database:', modelId)

      // PRIVACY: Delete audio file after successful training
      // The voice model is now stored by Fish Audio, we don't need the raw audio anymore
      console.log('🗑️ Deleting original audio file for privacy...')
      try {
        const { deleteAudio } = await import('@/lib/storage')
        await deleteAudio(userId)
        
        // Clear audioUrl from database
        await prisma.user.update({
          where: { id: userId },
          data: { audioUrl: null }
        })
        
        console.log('✅ Audio file deleted for privacy')
      } catch (deleteError) {
        console.warn('⚠️ Could not delete audio file:', deleteError)
        // Don't fail the request if deletion fails
      }

      return NextResponse.json({ 
        modelId: modelId, 
        status: 'training',
        message: 'Voice model created! Training in progress (2-3 min). You can start chatting now.',
        quality: 'S1 - High Quality'
      })
      
    } catch (fishError: any) {
      console.error('❌ Fish Audio model creation error:', fishError)
      console.error('   Status:', fishError.response?.status)
      console.error('   Data:', JSON.stringify(fishError.response?.data))
      
      // Fallback to mock for development
      const mockModelId = `mock_${userId}_${Date.now()}`
    await prisma.user.update({
      where: { id: userId },
      data: { voiceModelId: mockModelId }
    })
    
      return NextResponse.json({
        modelId: mockModelId,
        status: 'ready',
        message: 'Mock voice model created (API error)',
        error: fishError.message
      })
    }
  } catch (error: any) {
    console.error('❌ Voice clone error:', error)
    return NextResponse.json(
      { error: 'Voice clone failed', details: error.message },
      { status: 500 }
    )
  }
}

