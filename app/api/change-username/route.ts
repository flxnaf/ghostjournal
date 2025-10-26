import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  console.log('🔄 Change Username API called')
  
  try {
    const { userId, newUsername } = await request.json()

    if (!userId || !newUsername) {
      console.error('❌ Missing required fields')
      return NextResponse.json(
        { error: 'User ID and new username required' },
        { status: 400 }
      )
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(newUsername)) {
      console.error('❌ Invalid username format')
      return NextResponse.json(
        { error: 'Username must be 3-20 characters (letters, numbers, underscores only)' },
        { status: 400 }
      )
    }

    console.log('🔍 Checking if username is available...')
    console.log('   User ID:', userId)
    console.log('   New username:', newUsername)

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { username: newUsername }
    })

    if (existingUser && existingUser.id !== userId) {
      console.error('❌ Username already taken')
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      )
    }

    // Update username
    console.log('✏️ Updating username...')
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username: newUsername },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        isPublic: true,
        voiceModelId: true,
        faceData: true,
        photoUrls: true
      }
    })

    console.log('✅ Username updated successfully')
    
    return NextResponse.json({ 
      success: true,
      message: 'Username updated successfully',
      user: updatedUser
    })

  } catch (error: any) {
    console.error('❌❌❌ Change username error:', error)
    return NextResponse.json(
      { error: 'Failed to change username', details: error.message },
      { status: 500 }
    )
  }
}

