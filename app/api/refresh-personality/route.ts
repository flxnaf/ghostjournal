import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/refresh-personality
 * Force refresh personality data from memories
 * Useful when context seems stale or incorrect
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    console.log('🔄 Force refreshing personality for user:', userId)

    // Get all memories
    const memories = await prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📝 Found ${memories.length} memories`)

    // Group by category
    const byCategory: Record<string, string[]> = {}
    memories.forEach(m => {
      const cat = m.category || 'other'
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push(m.content)
    })

    // Build personality object
    const personality = {
      stories: (byCategory.story || []).join('\n\n'),
      habits: (byCategory.habit || []).join('\n\n'),
      reactions: (byCategory.reaction || []).join('\n\n'),
      background: [
        ...(byCategory.preference || []),
        ...(byCategory.skill || []),
        ...(byCategory.memory || []),
        ...(byCategory.goal || []),
        ...(byCategory.value || []),
        ...(byCategory.other || [])
      ].join('\n\n')
    }

    console.log('💾 Updating personality data...')
    console.log('   Stories length:', personality.stories.length)
    console.log('   Habits length:', personality.habits.length)
    console.log('   Reactions length:', personality.reactions.length)

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        personalityData: JSON.stringify(personality)
      }
    })

    console.log('✅ Personality refreshed successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'Personality data refreshed',
      memoriesFound: memories.length
    })
  } catch (error: any) {
    console.error('❌ Error refreshing personality:', error)
    return NextResponse.json(
      { error: 'Failed to refresh personality', details: error.message },
      { status: 500 }
    )
  }
}

