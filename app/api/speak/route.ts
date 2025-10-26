import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'
import axios from 'axios'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'

const prisma = new PrismaClient()

/**
 * Speak API - Generate AI Clone Response
 * 
 * Flow:
 * 1. Retrieve relevant memories (Chroma)
 * 2. Generate response text (Claude)
 * 3. Generate voice audio (Fish Audio)
 * 4. Store conversation
 */

export async function POST(request: NextRequest) {
  console.log('🎙️ Speak API called')
  try {
    const body = await request.json()
    console.log('📥 Request body:', { userId: body.userId, message: body.message?.substring(0, 50) })
    
    const { userId, message, conversationHistory = [] } = body

    if (!userId || !message) {
      console.error('❌ Missing required fields')
      return NextResponse.json(
        { error: 'User ID and message required' },
        { status: 400 }
      )
    }

    // Get user data (or use admin bypass)
    console.log('🔍 Looking up user:', userId)
    console.log('   Full user ID:', userId)
    
    // Admin bypass: Allow testing without database
    const isAdminUser = userId === '00000000-0000-0000-0000-000000000001'
    let user: any
    
    if (isAdminUser) {
      console.log('🔑 Admin user detected - using mock profile')
      user = {
        id: userId,
        voiceModelId: null, // Will use Fish Audio default voice
        personalityData: null, // Will use default personality prompt
        email: 'admin@replik.local',
        name: 'Admin User'
      }
    } else {
      user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: {
          id: true,
          voiceModelId: true,
          personalityData: true,
          name: true,
          email: true,
          username: true
        }
      })
      if (!user) {
        console.error('❌ User not found:', userId)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.log('✅ User found')
      console.log('   User name:', user.name || user.username)
      console.log('   User email:', user.email)
      console.log('🎤 User voiceModelId:', user.voiceModelId || 'NULL (will use default)')
    }

    // Check for keyword commands to update context
    const lowerMessage = message.toLowerCase()
    
    // Handle "i have new stories:" or similar context updates (skip for admin)
    if (!isAdminUser && (lowerMessage.includes('i have new stor') || lowerMessage.includes('new story:') || 
        lowerMessage.includes('i have new habit') || lowerMessage.includes('new habit:') ||
        lowerMessage.includes('i have new reaction') || lowerMessage.includes('new reaction:'))) {
      
      console.log('📝 Detected context update keyword, adding to memories...')
      
      // Extract the context type and content
      let category = 'story'
      if (lowerMessage.includes('habit')) category = 'habit'
      if (lowerMessage.includes('reaction')) category = 'reaction'
      
      // Store as new memory
      await prisma.memory.create({
        data: {
          userId: userId,
          content: message.replace(/i have new (stor(y|ies)|habit|reaction)s?:?\s*/i, '').trim(),
          category: category,
          embedding: '',
        }
      })
      
      // Reprocess personality in background
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      setTimeout(() => {
        fetch(baseUrl + '/api/personality', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        }).catch(err => console.error('Personality update error:', err))
      }, 100)
      
      return NextResponse.json({
        text: "Got it! I've added that to my memories. I'll keep that in mind from now on.",
        audioUrl: null,
        success: true
      })
    }

    // Get personality data
    console.log('🎭 Loading personality data...')
    console.log('   Raw personalityData:', user.personalityData ? 'Present' : 'NULL')
    const personality = user.personalityData 
      ? JSON.parse(user.personalityData) 
      : null
    console.log('   Parsed personality:', personality ? 'Present' : 'NULL')
    if (personality) {
      console.log('   Personality keys:', Object.keys(personality))
      console.log('   Personality sample:', JSON.stringify(personality).substring(0, 200))
    }

    // Query relevant memories with timeout
    console.log('🧠 Querying memories...')
    let memories = []
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const memoryResponse = await fetch(baseUrl + '/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          action: 'query', 
          query: message 
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const memoryData = await memoryResponse.json()
      memories = memoryData.memories || []
      console.log(`✅ Found ${memories.length} relevant memories`)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('⚠️ Memory query timeout, continuing without memories')
      } else {
        console.warn('⚠️ Memory query failed, continuing without:', err.message)
      }
    }

    // Build context for Claude
    const memoryContext = memories
      .map((m: any) => m.content)
      .join('\n')

    const personalityPrompt = personality
      ? `You are an AI clone of this person. You MUST respond EXACTLY how THEY would respond, matching their personality and emotional baseline.

THEIR PERSONALITY CONTEXT:

STORIES/BACKGROUND:
${personality.stories || 'N/A'}

DAILY HABITS & PATTERNS:
${personality.habits || 'N/A'}

HOW THEY REACT TO CHALLENGES:
${personality.reactions || 'N/A'}

ADDITIONAL CONTEXT:
${personality.background || 'N/A'}

CRITICAL INSTRUCTIONS:
1. Read their context CAREFULLY to understand their ACTUAL emotional baseline
2. If they explicitly describe being angry, depressed, anxious, or pessimistic - MATCH that tone
3. If they explicitly describe being calm, optimistic, or energetic - MATCH that tone
4. If they DON'T specify an emotional state - be NEUTRAL and BALANCED (neither overly negative nor overly positive)
5. Match their EXACT energy level and communication style from their context
6. Use THEIR phrasing, vocabulary, and expressions naturally
7. Be authentic to what THEY actually described, not assumptions

DEFAULT: If their context doesn't indicate a specific emotional state, be conversational, natural, and balanced.

Remember: You ARE them based on what THEY told you about themselves, not based on assumptions.`
      : 'You are a friendly AI clone having a natural, balanced conversation.'

    // Generate response with Claude
    console.log('🤖 Generating Claude response...')
    console.log('   Personality prompt length:', personalityPrompt.length)
    console.log('   Using personality:', personality ? 'YES' : 'NO (default prompt)')
    console.log('   Memory context length:', memoryContext.length)
    console.log('   Has memories:', memories.length > 0)
    
    const responseText = await generateResponse(
      message,
      conversationHistory,
      personalityPrompt,
      memoryContext
    )
    console.log('✅ Claude response generated:', responseText.substring(0, 100))

    // Generate voice with Fish Audio
    console.log('🎤 Generating voice...')
    const audioUrl = await generateVoice(user.voiceModelId, responseText, userId)
    console.log('✅ Voice generated:', audioUrl || 'No audio (Fish API not configured)')

    // Store conversation (skip for admin)
    if (!isAdminUser) {
      await prisma.conversation.create({
        data: {
          userId,
          role: 'user',
          content: message
        }
      })

      await prisma.conversation.create({
        data: {
          userId,
          role: 'assistant',
          content: responseText,
          audioUrl
        }
      })
      
      // Store in memory asynchronously (don't block response)
      if (message.length > 50) {
        console.log('💾 Storing in memory (background)...')
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const memoryContent = 'User asked: ' + message + '. Response: ' + responseText
        fetch(baseUrl + '/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId, 
            action: 'add', 
            content: memoryContent
          })
        })
          .then(() => console.log('✅ Stored in memory'))
          .catch(err => console.warn('⚠️ Memory storage failed:', err))
      }
    }

    console.log('🎉 Response complete!')
    const responseData = {
      text: responseText,
      audioUrl,
      success: true
    }
    console.log('📤 Sending to frontend:', JSON.stringify(responseData).substring(0, 200))
    
    return NextResponse.json(responseData)

  } catch (error: any) {
    console.error('❌❌❌ Speak API error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Failed to generate response', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

async function generateResponse(
  message: string,
  conversationHistory: any[],
  personalityPrompt: string,
  memoryContext: string
): Promise<string> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

  console.log('🔑 API Key:', ANTHROPIC_API_KEY ? `Present (${ANTHROPIC_API_KEY.substring(0, 20)}...)` : '❌ MISSING')

  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    console.warn('⚠️ Anthropic API key not configured, using mock response')
    return `I heard you say: "${message}". That's interesting! As your AI clone, I'd love to explore this topic further based on what I know about you.`
  }

  try {
    console.log('🤖 Creating Anthropic client...')
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
    console.log('✅ Anthropic client created')

    // Build conversation context
    const messages = conversationHistory
      .slice(-10)
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))

    messages.push({
      role: 'user',
      content: message
    })

    const systemPrompt = `${personalityPrompt}

${memoryContext ? `Relevant context from past conversations:\n${memoryContext}\n` : ''}

CRITICAL INSTRUCTIONS - YOU ARE THIS PERSON, NOT AN AI ASSISTANT:
- You ARE this person. Respond EXACTLY as they would based on the context THEY provided.
- This is NOT a roleplay - you ARE them. Their personality is YOUR personality.
- Match their EXACT tone, mood, vocabulary, quirks from THEIR actual context.
- ONLY adopt negative traits (anger/cynicism/sarcasm/pessimism) if THEY explicitly described themselves that way.
- ONLY adopt positive traits (optimism/enthusiasm/energy) if THEY explicitly described themselves that way.
- If they didn't specify a mood/tone, be NEUTRAL and conversational (balanced, not extreme in any direction).
- DO NOT add AI disclaimers or explanations - you're having a natural conversation as them.
- Use their speech patterns, slang, and expressions naturally.
- Keep responses 2-4 sentences, conversational and authentic.
- NO PROFANITY - express strong emotions through tone and actions (*scoffs*, *groans*, *sighs*).
- Mirror what THEY actually said about themselves, not assumptions.

Remember: You're based on what they TOLD you, not stereotypes or assumptions.`

    console.log('📤 Calling Claude API...')
    console.log('   Messages count:', messages.length)

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      system: systemPrompt,
      messages: messages as any
    })

    console.log('📥 Got Claude response!')
    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : 'I appreciate what you shared.'

    console.log('   Response length:', responseText.length)
    return responseText

  } catch (error: any) {
    console.error('❌❌❌ Claude generation error:', error)
    console.error('   Error name:', error?.name)
    console.error('   Error message:', error?.message)
    console.error('   Error status:', error?.status)
    if (error?.error) {
      console.error('   Error details:', JSON.stringify(error.error, null, 2))
    }
    return `Thanks for sharing that. Based on what I know about you, I find this really interesting.`
  }
}

/**
 * Convert text actions into speakable audio cues for TTS
 */
function cleanTextForTTS(text: string): string {
  let cleaned = text
  
  // Map of VOCAL actions to speakable equivalents
  // Visual actions (like *shakes head*) are removed entirely for natural flow
  const actionMap: { [key: string]: string } = {
    // Breathing/sounds - KEEP THESE
    'sigh': 'sigh',
    'sighs': 'sigh',
    'exhales': 'sigh',
    'exhales sharply': 'sigh',
    'breathes heavily': 'huff',
    'gasps': 'oh!',
    'groans': 'ugh',
    'grunts': 'ugh',
    
    // Laughter - KEEP THESE
    'laughs': 'haha',
    'laughs nervously': 'heh',
    'laughs bitterly': 'hah',
    'chuckles': 'heh',
    'chuckles wryly': 'heh',
    'chuckles darkly': 'heh',
    'giggles': 'hehe',
    'snorts': 'hah',
    'snickers': 'heh',
    
    // Vocal sounds - KEEP THESE
    'clears throat': 'ahem',
    'coughs': 'ahem',
    'yawns': 'ahh',
    'scoffs': 'pfft',
    'sniffs': 'hmm',
    'whistles': 'whew',
    'mutters': 'mhm',
    'mumbles': 'mm',
    'hums': 'hmm',
    'hesitates': 'uh',
    
    // Everything else - REMOVE (empty string means delete)
    'rolls eyes': '',
    'shakes head': '',
    'nods': '',
    'nods in agreement': '',
    'shrugs': '',
    'shrugs shoulders': '',
    'pauses': '',
    'looks away': '',
    'looks down': '',
    'grins': '',
    'smirks': '',
    'smiles': '',
    'smiles wryly': '',
    'frowns': '',
    'glares': '',
    'winks': '',
    'gives a thumbs up': '',
    'gives thumbs up': '',
    'waves hand': '',
    'points': '',
    'crosses arms': '',
    'takes a deep breath': '',
  }
  
  // First, handle censored swearing (*** or ****)
  cleaned = cleaned.replace(/\*{3,}/g, '[censored]')
  
  // Then replace asterisked actions with speakable equivalents or remove them
  cleaned = cleaned.replace(/\*([^*]+)\*/g, (match, action) => {
    const lowerAction = action.toLowerCase().trim()
    
    // Check if we have a mapping for this action
    // Sort by length (longest first) to match more specific phrases
    const sortedKeys = Object.keys(actionMap).sort((a, b) => b.length - a.length)
    
    for (const key of sortedKeys) {
      if (lowerAction.includes(key)) {
        const replacement = actionMap[key]
        // If replacement is empty, remove entirely; otherwise keep with spacing
        return replacement ? ` ${replacement} ` : ' '
      }
    }
    
    // If no mapping, REMOVE the action entirely (visual/unknown actions)
    return ' '
  })
  
  // Replace parenthetical actions similarly
  cleaned = cleaned.replace(/\(([^)]+)\)/g, (match, action) => {
    const lowerAction = action.toLowerCase().trim()
    
    // Sort by length (longest first)
    const sortedKeys = Object.keys(actionMap).sort((a, b) => b.length - a.length)
    
    for (const key of sortedKeys) {
      if (lowerAction.includes(key)) {
        const replacement = actionMap[key]
        return replacement ? ` ${replacement} ` : ' '
      }
    }
    
    // Remove unknown actions
    return ' '
  })
  
  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/\s+/g, ' ')
  
  // Clean up punctuation spacing
  cleaned = cleaned.replace(/\s+([.,!?])/g, '$1')
  cleaned = cleaned.replace(/([.,!?])\s*([.,!?])/g, '$1 ')
  
  // Trim
  cleaned = cleaned.trim()
  
  console.log('🎭 Text cleaned for natural speech')
  console.log('   Original length:', text.length)
  console.log('   Cleaned length:', cleaned.length)
  
  return cleaned
}

async function generateVoice(
  voiceModelId: string | null,
  text: string,
  userId: string
): Promise<string> {
  const FISH_API_KEY = process.env.FISH_AUDIO_API_KEY

  console.log('🎤 Voice generation check:')
  console.log('   API Key:', FISH_API_KEY ? 'Present' : 'Missing')
  console.log('   Voice Model ID:', voiceModelId || 'NULL')

  if (!FISH_API_KEY) {
    console.warn('⚠️ Fish Audio API key not configured')
    return ''
  }

  // Clean text for TTS (remove action descriptions)
  const cleanedText = cleanTextForTTS(text)
  console.log('📝 Original text:', text.substring(0, 100))
  console.log('🧹 Cleaned text:', cleanedText.substring(0, 100))

  try {
    console.log('📤 Calling Fish Audio TTS with trained model...')
    
    // Get user's voice model ID
    const user = await prisma.user.findUnique({ where: { id: userId } })
    
    // Determine which reference to use
    let referenceId = 'af1ddb5dc0e644ebb16b58ed466e27c6' // Default neutral English voice
    
    if (voiceModelId && !voiceModelId.startsWith('mock_')) {
      // Use the trained S1 model (HIGH QUALITY)
      referenceId = voiceModelId
      console.log('✅ Using trained S1 voice model:', referenceId.substring(0, 20))
    } else {
      console.log('⚠️ Using default neutral voice (no trained model yet)')
    }
    
    // Create TTS request with trained model
    const FormData = require('form-data')
    const formData = new FormData()
    
    formData.append('text', cleanedText) // Use cleaned text
    formData.append('reference_id', referenceId) // Trained model ID or default
    formData.append('format', 'mp3')
    
    const response = await axios.post(
      'https://api.fish.audio/v1/tts',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${FISH_API_KEY}`,
          ...formData.getHeaders()
        },
        responseType: 'arraybuffer',
        timeout: 30000 // 30 second timeout
      }
    )

    // Upload audio to Supabase Storage
    const filename = `${userId}/response_${Date.now()}.mp3`
    const audioBuffer = Buffer.from(response.data)
    
    console.log('📤 Uploading audio to Supabase Storage...')
    console.log('   Filename:', filename)
    console.log('   Size:', audioBuffer.length, 'bytes')
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.warn('⚠️ Supabase not configured - saving to local filesystem')
      const uploadDir = join(process.cwd(), 'public', 'uploads', userId)
      const audioPath = join(uploadDir, `response_${Date.now()}.mp3`)
      await mkdir(uploadDir, { recursive: true })
      await writeFile(audioPath, audioBuffer)
      return `/uploads/${userId}/response_${Date.now()}.mp3`
    }
    
    // Create admin Supabase client (bypasses RLS)
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('audio-recordings')
      .upload(filename, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (error) {
      console.error('❌ Supabase Storage error:', error)
      throw new Error(`Failed to upload audio: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio-recordings')
      .getPublicUrl(filename)

    console.log('✅ Audio uploaded to Supabase:', urlData.publicUrl)
    return urlData.publicUrl

  } catch (error: any) {
    console.error('❌ Fish Audio TTS error:', error)
    console.error('   Status:', error.response?.status)
    console.error('   Data:', error.response?.data)
    console.error('   Message:', error.message)
    
    // Return empty string - will fallback to browser TTS
    console.warn('⚠️ Falling back to browser TTS')
    return ''
  }
}
