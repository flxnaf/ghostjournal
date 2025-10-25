import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'

const prisma = new PrismaClient()

/**
 * Claude API Integration for Personality Generation
 * 
 * This endpoint:
 * 1. Retrieves user memories/contexts
 * 2. Uses Claude to analyze and create personality model
 * 3. Stores personality traits for future conversations
 */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get user memories
    const memories = await prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    if (memories.length === 0) {
      return NextResponse.json({ 
        error: 'No context data available' 
      }, { status: 400 })
    }

    // Initialize Claude
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    
    if (!ANTHROPIC_API_KEY) {
      console.warn('Anthropic API key not configured')
      // Mock response for development
      const mockPersonality = {
        traits: ['curious', 'analytical', 'friendly'],
        quirks: ['uses technical jargon', 'tells stories'],
        conversationStyle: 'casual but informative',
        interests: ['technology', 'learning'],
        background: 'Tech enthusiast with diverse interests'
      }
      
      await prisma.user.update({
        where: { id: userId },
        data: { personalityData: JSON.stringify(mockPersonality) }
      })
      
      return NextResponse.json({ 
        personality: mockPersonality,
        message: 'Mock personality created (Anthropic API key not configured)'
      })
    }

    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    })

    // Build context from memories - organize by category
    const storiesMem = memories.filter(m => m.category === 'story' || m.category === 'stories').map(m => m.content).join('\n')
    const habitsMem = memories.filter(m => m.category === 'habit' || m.category === 'habits').map(m => m.content).join('\n')
    const reactionsMem = memories.filter(m => m.category === 'reaction' || m.category === 'reactions').map(m => m.content).join('\n')
    
    // Store the raw contexts directly (no Claude processing)
    // This preserves the exact personality traits like "I am always angry!"
    const personality = {
      stories: storiesMem || 'N/A',
      habits: habitsMem || 'N/A',
      reactions: reactionsMem || 'N/A',
      background: `This person's stories: ${storiesMem}. Their habits: ${habitsMem}. How they react: ${reactionsMem}`
    }
    
    console.log('💾 Storing personality data:', personality)
    
    await prisma.user.update({
      where: { id: userId },
      data: { personalityData: JSON.stringify(personality) }
    })

    return NextResponse.json({ 
      personality,
      message: 'Personality profile created successfully'
    })

  } catch (error: any) {
    console.error('Claude API error:', error)
    
    // Fallback mock personality
    const { userId } = await request.json()
    const mockPersonality = {
      traits: ['curious', 'analytical', 'friendly', 'creative'],
      quirks: ['thoughtful pauses', 'uses analogies'],
      conversationStyle: 'warm and engaging',
      interests: ['technology', 'creativity', 'problem-solving'],
      background: 'An individual with diverse interests and experiences'
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { personalityData: JSON.stringify(mockPersonality) }
    })
    
    return NextResponse.json({ 
      personality: mockPersonality,
      message: 'Mock personality created (API error)',
      error: error.message
    })
  }
}

