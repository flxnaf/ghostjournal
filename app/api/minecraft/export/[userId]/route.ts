import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Minecraft Export API
 *
 * Returns minimal twin data for Minecraft mod integration
 * No authentication for MVP - can add later
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Twin not found' },
        { status: 404 }
      )
    }

    // Return minimal data needed for Minecraft
    const twinData = {
      twin_id: user.id,
      name: user.name || 'Unknown',
      display_name: user.name || 'Digital Twin',
      api_endpoint: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/speak`,
      created_at: user.createdAt.toISOString()
    }

    return NextResponse.json(twinData)

  } catch (error: any) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Failed to export twin data', details: error.message },
      { status: 500 }
    )
  }
}
