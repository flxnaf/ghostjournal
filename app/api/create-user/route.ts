import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Create User API - Creates user with audio only
 * Called right after recording completes (before photos/context)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio') as File

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio file required' },
        { status: 400 }
      )
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        photoUrls: '[]',
      }
    })

    console.log('✅ User created:', user.id)

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', user.id)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save audio file
    const audioBuffer = Buffer.from(await audio.arrayBuffer())
    const audioPath = join(uploadDir, 'recording.webm')
    await writeFile(audioPath, audioBuffer)

    // Update user with audio URL
    await prisma.user.update({
      where: { id: user.id },
      data: {
        audioUrl: `/uploads/${user.id}/recording.webm`,
      }
    })

    console.log('✅ Audio saved for user:', user.id)

    return NextResponse.json({ 
      success: true, 
      userId: user.id,
      message: 'User created with audio'
    })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'User creation failed' },
      { status: 500 }
    )
  }
}

