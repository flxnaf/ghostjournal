import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Update User API - Adds photos and contexts to existing user
 * Called when user clicks "Create My Clone" (voice model already trained)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const userId = formData.get('userId') as string
    const contexts = formData.get('contexts') as string

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('📸 Updating user with photos and contexts:', userId)

    // Save photos
    const photoUrls: string[] = []
    for (let i = 0; i < 5; i++) {
      const photo = formData.get(`photo${i}`) as File
      if (photo) {
        const photoBuffer = Buffer.from(await photo.arrayBuffer())
        const photoPath = join(process.cwd(), 'public', 'uploads', userId, `photo-${i}.jpg`)
        await writeFile(photoPath, photoBuffer)
        photoUrls.push(`/uploads/${userId}/photo-${i}.jpg`)
      }
    }

    // Update user with photos and contexts
    await prisma.user.update({
      where: { id: userId },
      data: {
        photoUrls: JSON.stringify(photoUrls),
      }
    })

    // Store contexts as memories
    if (contexts) {
      const contextData = JSON.parse(contexts)
      for (const [category, content] of Object.entries(contextData)) {
        if (content && typeof content === 'string' && content.trim()) {
          await prisma.memory.create({
            data: {
              userId: userId,
              content: content as string,
              category: category,
              embedding: '',
            }
          })
        }
      }
    }

    console.log('✅ User updated with photos and contexts')

    // Process personality in background
    setTimeout(() => {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/personality`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      }).catch(err => console.error('Personality processing error:', err))
    }, 100)

    return NextResponse.json({ 
      success: true, 
      userId,
      message: 'Photos and context updated'
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Update failed' },
      { status: 500 }
    )
  }
}

