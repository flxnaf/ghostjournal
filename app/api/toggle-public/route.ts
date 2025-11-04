import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/toggle-public
 * Toggle whether a user's clone is publicly searchable
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, isPublic } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Update user's public status
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isPublic }
    })

    console.log(`✅ User ${userId} isPublic set to: ${isPublic}`)

    return NextResponse.json({ 
      success: true, 
      isPublic: user.isPublic 
    })
  } catch (error: any) {
    console.error('❌ Error toggling public status:', error)
    return NextResponse.json(
      { error: 'Failed to update public status', details: error.message },
      { status: 500 }
    )
  }
}

