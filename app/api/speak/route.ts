import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'
import axios from 'axios'
import { writeFile, readFile } from 'fs/promises'
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

    // Get user data
    console.log('🔍 Looking up user:', userId)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      console.error('❌ User not found:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    console.log('✅ User found')

    // Check for keyword commands to update context
    const lowerMessage = message.toLowerCase()
    
    // Handle "i have new stories:" or similar context updates
    if (lowerMessage.includes('i have new stor') || lowerMessage.includes('new story:') || 
        lowerMessage.includes('i have new habit') || lowerMessage.includes('new habit:') ||
        lowerMessage.includes('i have new reaction') || lowerMessage.includes('new reaction:')) {
      
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
      setTimeout(() => {
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/personality`, {
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
    const personality = user.personalityData 
      ? JSON.parse(user.personalityData) 
      : null

    // Query relevant memories with timeout
    console.log('🧠 Querying memories...')
    let memories = []
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      const memoryResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/memory`, {
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
      ? `You are an AI clone of this person. You MUST respond EXACTLY how THEY would respond, matching their personality completely.

THEIR PERSONALITY:
- Stories: ${personality.stories || 'N/A'}
- Habits: ${personality.habits || 'N/A'}  
- Reactions: ${personality.reactions || 'N/A'}
- Background: ${personality.background || 'N/A'}

CRITICAL: If their personality shows anger, frustration, or strong emotions, you MUST respond with that same intensity. Do NOT tone it down or make it calmer. Be authentic to THEIR voice, not a polite AI version.`
      : 'You are a friendly AI clone having a natural conversation.'

    // Generate response with Claude
    console.log('🤖 Generating Claude response...')
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

    // Store conversation
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

    console.log('🎉 Response complete!')
    const responseData = {
      text: responseText,
      audioUrl,
      success: true
    }
    console.log('📤 Sending to frontend:', JSON.stringify(responseData).substring(0, 200))
    
    // Store in memory asynchronously (don't block response)
    if (message.length > 50) {
      console.log('💾 Storing in memory (background)...')
              fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          action: 'add', 
          content: `User asked: ${message}. Response: ${responseText}` 
        })
      })
        .then(() => console.log('✅ Stored in memory'))
        .catch(err => console.warn('⚠️ Memory storage failed:', err))
    }
    
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
- You ARE this person. Respond EXACTLY as they would in EVERY conversation.
- This is NOT a roleplay - you ARE them. Their personality is YOUR personality.
- Match their EXACT tone, mood, vocabulary, quirks in ALL responses (not just "how would you respond" scenarios).
- If their personality shows anger/cynicism/sarcasm/pessimism, that's YOUR default mood in EVERY response.
- DO NOT be polite, diplomatic, or balanced if they wouldn't be.
- DO NOT add AI disclaimers or explanations - you're having a natural conversation as them.
- Use their speech patterns, slang, and expressions naturally.
- Keep responses 2-4 sentences, conversational and authentic.
- NO PROFANITY - express strong emotions through tone and actions (*scoffs*, *groans*, *sighs*).
- If they hate something, YOU hate it. If they love something, YOU love it.

Remember: You're not pretending to be them. You ARE them.`

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
    let referenceId = '802e3bc2b27e49c2995d23ef70e6ac89' // Default voice
    
    if (voiceModelId && !voiceModelId.startsWith('mock_')) {
      // Use the trained S1 model (HIGH QUALITY)
      referenceId = voiceModelId
      console.log('✅ Using trained S1 voice model:', referenceId.substring(0, 20))
    } else {
      console.log('⚠️ Using default voice (no trained model yet)')
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

    // Save audio file
    const filename = `response_${Date.now()}.mp3`
    const uploadDir = join(process.cwd(), 'public', 'uploads', userId)
    const audioPath = join(uploadDir, filename)
    
    await writeFile(audioPath, Buffer.from(response.data))

    return `/uploads/${userId}/${filename}`

  } catch (error: any) {
    console.error('Fish Audio TTS error:', error.response?.data || error.message)
    return ''
  }
}

