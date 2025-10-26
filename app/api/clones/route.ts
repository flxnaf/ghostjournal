import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/clones
 * Fetch all public clone models for browsing
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/clones - Fetching public clones...')
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    console.log('   Search query:', search || '(none)')

    // Fetch public users
    const users = await prisma.user.findMany({
      where: {
        isPublic: true,
        ...(search && {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { bio: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        createdAt: true,
        voiceModelId: true // To show if voice is trained
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit results
    })

    // Transform to Clone interface format
    const clones = users.map(user => ({
      userId: user.id,
      username: user.username || 'unknown',
      name: user.name,
      bio: user.bio,
      createdAt: user.createdAt.toISOString(),
      isPublic: true,
      hasVoiceModel: !!user.voiceModelId
    }))

    console.log(`✅ Returning ${clones.length} public clones`)
    return NextResponse.json({ clones })
  } catch (error: any) {
    console.error('❌ Error fetching clones:', error)
    console.error('   Error message:', error.message)
    console.error('   Error code:', error.code)
    console.error('   Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to fetch clones', details: error.message, code: error.code },
      { status: 500 }
    )
  }
}

