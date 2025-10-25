import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Update User API - Adds face contours and contexts to existing user
 * Called when user clicks "Create My Clone" (voice model already trained)
 * Receives MediaPipe face contours instead of raw photos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, faceContours, contexts } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    if (!faceContours) {
      return NextResponse.json(
        { error: 'Face contours required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('🎭 Updating user with face model and contexts:', userId)
    console.log(`   Received ${faceContours.length} face contours`)

    // Log sample contour data to verify it's not defaulting
    const jawline = faceContours.find((c: any) => c.name === 'jawline')
    const leftEye = faceContours.find((c: any) => c.name === 'left_eye_outline')
    const hairFront = faceContours.find((c: any) => c.name === 'hair_front')
    
    if (jawline && leftEye) {
      const jawWidth = Math.max(...jawline.points.map((p: number[]) => Math.abs(p[0]))) * 2
      const eyeX = leftEye.points[0][0]
      const jawX = jawline.points[0][0]
      
      console.log('   📊 Face verification:')
      console.log(`      Jawline width: ${jawWidth.toFixed(3)}`)
      console.log(`      Eye position: [${eyeX.toFixed(3)}, ${leftEye.points[0][1].toFixed(3)}]`)
      console.log(`      Sample jawline point: [${jawX.toFixed(3)}, ${jawline.points[0][1].toFixed(3)}, ${jawline.points[0][2].toFixed(3)}]`)
      
      // Check if this is the default mock face (all values exactly match template)
      const isDefaultMock = Math.abs(jawWidth - 0.7) < 0.001 && 
                           Math.abs(eyeX - (-0.24)) < 0.001 && 
                           Math.abs(jawX - (-0.35)) < 0.001
      
      if (isDefaultMock) {
        console.error('   ⚠️  WARNING: Receiving DEFAULT MOCK FACE - MediaPipe may have failed!')
        console.error('   ⚠️  This will result in identical faces for all users!')
      } else {
        console.log('   ✅ Face is personalized (not using default mock)')
      }
    }
    
    if (hairFront) {
      console.log(`   💇 Hair contour detected: ${hairFront.points.length} points`)
      console.log(`      Top hair Y: ${Math.max(...hairFront.points.map((p: number[]) => p[1])).toFixed(3)}`)
    } else {
      console.error('   ⚠️  No hair contour found!')
    }

    // Store face contours in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        faceData: JSON.stringify({ contours: faceContours }),
      }
    })

    console.log('✅ Face model stored in database')

    // Store contexts as memories
    if (contexts) {
      for (const [category, content] of Object.entries(contexts)) {
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
      console.log('✅ Contexts stored as memories')
    }

    console.log('✅ User updated with face model and contexts')

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

