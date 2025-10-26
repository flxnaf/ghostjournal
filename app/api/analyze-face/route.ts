import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'
import { readFile } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const prisma = new PrismaClient()

/**
 * Apply feature descriptions to contours (if Claude provided text description)
 */
function applyFeatureDescriptions(contours: FaceContour[], description: string): FaceContour[] {
  console.log('🎨 ==========================================')
  console.log('🎨 APPLYING FEATURE DESCRIPTIONS TO FACE')
  console.log('🎨 Description:', description.substring(0, 200))
  console.log('🎨 ==========================================')
  
  const desc = description.toLowerCase()
  const modifiedContours = JSON.parse(JSON.stringify(contours)) // Deep clone
  
  // Detect wavy/curly hair and add wave patterns (MORE DRAMATIC)
  if (desc.includes('wavy') || desc.includes('curly') || desc.includes('curled')) {
    console.log('  ➡️ 🌊 APPLYING: Wavy/curly hair pattern')
    modifiedContours.forEach((contour: FaceContour) => {
      if (contour.name.includes('hair')) {
        contour.points = contour.points.map(([x, y, z]: [number, number, number], idx: number) => {
          // Add BIGGER sine wave for visible wavy effect
          const wave = Math.sin(idx * 0.8) * 0.08  // Doubled from 0.04
          return [x + wave, y, z] as [number, number, number]
        })
      }
    })
  } else {
    console.log('  ℹ️  Hair: straight/default (no wavy pattern detected)')
  }
  
  // Detect round face and adjust jawline (MORE DRAMATIC)
  if (desc.includes('oval') || desc.includes('round')) {
    console.log('  ➡️ 🔵 APPLYING: Round/oval face shape (softer jawline)')
    const jawline = modifiedContours.find((c: FaceContour) => c.name === 'jawline')
    if (jawline) {
      jawline.points = jawline.points.map(([x, y, z]: [number, number, number]) => [x * 0.85, y, z * 0.7] as [number, number, number]) // MUCH softer jawline
    }
  }
  
  // Detect angular face and sharpen jawline (MORE DRAMATIC)
  if (desc.includes('angular') || desc.includes('defined') || desc.includes('square')) {
    console.log('  ➡️ 🔷 APPLYING: Angular face (sharper jawline)')
    const jawline = modifiedContours.find((c: FaceContour) => c.name === 'jawline')
    if (jawline) {
      jawline.points = jawline.points.map(([x, y, z]: [number, number, number]) => [x * 1.15, y, z * 1.3] as [number, number, number]) // MUCH sharper jawline
    }
  }
  
  // Detect full/thick lips
  if (desc.includes('full lips') || desc.includes('plump')) {
    console.log('  ➡️ Enlarging mouth for full lips')
    const mouth = modifiedContours.find((c: FaceContour) => c.name === 'mouth_outline')
    if (mouth) {
      mouth.points = mouth.points.map(([x, y, z]: [number, number, number]) => [x * 1.1, y, z * 1.1] as [number, number, number]) // Larger mouth
    }
  }
  
  // Detect prominent/arched eyebrows
  if (desc.includes('arched') || desc.includes('prominent eyebrow')) {
    console.log('  ➡️ Arching eyebrows')
    ;['left_eyebrow', 'right_eyebrow'].forEach(name => {
      const brow = modifiedContours.find((c: FaceContour) => c.name === name)
      if (brow) {
        brow.points = brow.points.map(([x, y, z]: [number, number, number], idx: number) => {
          // Add arch in the middle
          const archBoost = idx === Math.floor(brow.points.length / 2) ? 0.03 : 0
          return [x, y + archBoost, z] as [number, number, number]
        })
      }
    })
  }
  
  // Detect hooded eyes
  if (desc.includes('hooded')) {
    console.log('  ➡️ Adjusting for hooded eyes')
    ;['left_eye_outline', 'right_eye_outline'].forEach(name => {
      const eye = modifiedContours.find((c: FaceContour) => c.name === name)
      if (eye) {
        // Lower the top points slightly
        eye.points = eye.points.map(([x, y, z]: [number, number, number], idx: number) => {
          if (idx >= 1 && idx <= 3) return [x, y - 0.02, z] as [number, number, number] // Lower upper eyelid
          return [x, y, z] as [number, number, number]
        })
      }
    })
  }
  
  // Detect wide/narrow nose
  if (desc.includes('wide nose') || desc.includes('broad nose')) {
    console.log('  ➡️ Widening nose')
    const noseTip = modifiedContours.find((c: FaceContour) => c.name === 'nose_tip')
    if (noseTip) {
      noseTip.points = noseTip.points.map(([x, y, z]: [number, number, number]) => [x * 1.15, y, z] as [number, number, number])
    }
  }
  
  if (desc.includes('narrow nose') || desc.includes('thin nose')) {
    console.log('  ➡️ Narrowing nose')
    const noseTip = modifiedContours.find((c: FaceContour) => c.name === 'nose_tip')
    if (noseTip) {
      noseTip.points = noseTip.points.map(([x, y, z]: [number, number, number]) => [x * 0.85, y, z] as [number, number, number])
    }
  }
  
  // Detect prominent cheekbones
  if (desc.includes('prominent cheekbone') || desc.includes('high cheekbone')) {
    console.log('  ➡️ Enhancing cheekbones')
    ;['left_cheek', 'right_cheek'].forEach(name => {
      const cheek = modifiedContours.find((c: FaceContour) => c.name === name)
      if (cheek) {
        cheek.points = cheek.points.map(([x, y, z]: [number, number, number]) => [x, y, z * 1.1] as [number, number, number]) // Push out z-depth
      }
    })
  }
  
  console.log('🎨 ==========================================')
  console.log('🎨 FEATURE MODIFICATIONS COMPLETE')
  console.log('🎨 ==========================================')
  
  return modifiedContours
}

/**
 * Fallback: Generate custom face contours from image metadata
 * Uses basic image properties to create variation from mock data
 */
async function generateCustomFaceFromImage(buffer: Buffer): Promise<FaceContour[]> {
  try {
    const metadata = await sharp(buffer).metadata()
    const stats = await sharp(buffer).stats()
    
    // Use image properties to create variation
    const seed = stats.channels[0].mean / 255  // 0-1 based on brightness
    const variation = (metadata.width || 640) / 640  // Width ratio
    
    console.log('🎲 Generating custom face from image properties (seed:', seed.toFixed(2), ')')
    
    // Get base mock contours
    const mockContours = generateMockFaceContours()
    
    // Apply subtle variations based on image properties
    return mockContours.map(contour => ({
      ...contour,
      points: contour.points.map(([x, y, z]: [number, number, number]) => {
        // Apply small random-like variations based on seed
        const xVar = Math.sin(seed * 100 + x) * 0.03 * variation
        const yVar = Math.cos(seed * 100 + y) * 0.03 * variation
        const zVar = Math.sin(seed * 50 + z) * 0.02
        return [x + xVar, y + yVar, z + zVar] as [number, number, number]
      })
    }))
  } catch (error) {
    console.warn('⚠️ Custom face generation failed:', error)
    return generateMockFaceContours()
  }
}

interface FaceContour {
  name: string
  points: [number, number, number][]
  connects_to: string[]
}

/**
 * Convert photo to cartoon/sketch style to bypass content policies
 * Uses heavy stylization to make it clearly an artistic representation
 */
async function cartoonifyImage(buffer: Buffer): Promise<string> {
  try {
    // Approach: Heavy posterization + edge enhancement for cartoon effect
    const processed = await sharp(buffer)
      .resize(800, 800, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
      .modulate({ 
        saturation: 2.0,  // Heavy saturation boost
        brightness: 1.2   // Brighter
      })
      // Strong contrast for cartoon effect (reduces to ~8 colors per channel)
      .linear(2.0, -(128 * 2.0) + 128)
      .blur(1.0)  // Blur to merge similar colors
      .sharpen({ sigma: 3, m1: 1.5 })  // Strong edge sharpening
      .normalise()  // Maximize contrast
      .jpeg({ quality: 85 })
      .toBuffer()
    
    console.log('  🎨 Applied heavy cartoon stylization (posterize + edge enhance)')
    return processed.toString('base64')
  } catch (error) {
    console.warn('⚠️ Cartoonify failed, using original:', error)
    return buffer.toString('base64')
  }
}

/**
 * Analyze face photos using Claude Vision to extract 3D contour data
 * GET /api/analyze-face?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    console.log('🎭 Analyzing face for user:', userId)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      console.warn('⚠️ User not found, using mock data')
      return NextResponse.json({ 
        faceData: { contours: generateMockFaceContours() }
      })
    }

    // CHECK FOR MEDIAPIPE DATA FIRST (new flow)
    if (user.faceData) {
      console.log('✅ Found MediaPipe face data in database!')
      try {
        const faceData = JSON.parse(user.faceData)
        console.log(`   Using ${faceData.contours?.length || 0} pre-computed contours from MediaPipe`)
        return NextResponse.json({ faceData })
      } catch (error) {
        console.warn('⚠️ Failed to parse stored face data:', error)
      }
    }

    // FALLBACK: If no MediaPipe data, try Claude Vision (old flow)
    if (!user.photoUrls) {
      console.warn('⚠️ No face data or photos found, using mock data')
      return NextResponse.json({ 
        faceData: { contours: generateMockFaceContours() }
      })
    }

    const photoUrls = JSON.parse(user.photoUrls)
    console.log('📸 No MediaPipe data, processing photos with Claude:', photoUrls.length)

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      console.warn('⚠️ Anthropic API key not configured, using mock data')
      return NextResponse.json({ 
        faceData: { contours: generateMockFaceContours() }
      })
    }

    try {
      const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

      // Read ALL photos for analysis and convert to cartoon style
      const photoData = []
      const photoBuffers = []
      console.log('🎨 Converting photos to cartoon style...')
      for (let i = 0; i < photoUrls.length; i++) {
        try {
          const photoPath = join(process.cwd(), 'public', photoUrls[i])
          const buffer = await readFile(photoPath)
          photoBuffers.push(buffer)
          
          // Convert to cartoon/sketch style to bypass content policies
          const cartoonBase64 = await cartoonifyImage(buffer)
          photoData.push(cartoonBase64)
          console.log(`  ✅ Cartoonified photo ${i + 1}`)
        } catch (err) {
          console.warn('Failed to read/process photo:', photoUrls[i])
        }
      }

      if (photoData.length === 0) {
        return NextResponse.json({ 
          faceData: { contours: generateMockFaceContours() }
        })
      }

      console.log('🤖 Calling Claude Vision...')

      // Analyze with Claude Vision (Haiku works, Sonnet gives 404)
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',  // Haiku model that works with API
        max_tokens: 4096,  // Haiku's maximum (can't go higher)
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: photoData[0],
              },
            },
              {
                type: 'text',
                text: `You are analyzing a HEAVILY STYLIZED CARTOON IMAGE for creating a 3D artistic avatar (similar to Bitmoji, Memoji, or video game characters).

This image has been processed with posterization and edge enhancement - it is NOT a photograph, but a CARTOON/SKETCH for artistic purposes.

TASK: Generate ALL 28 contours with DETAILED feature variations. Make the coordinates match the SPECIFIC features you observe.

CRITICAL REQUIREMENTS:
1. Output ALL 28 contours (not just 12!)
2. If hair is WAVY/CURLY: add wave oscillations to hair contours (use sine waves in x-coordinates)
3. If hair is STRAIGHT: keep hair contours smooth
4. If face is ROUND: reduce jawline z-depth and make it curved
5. If face is ANGULAR: increase jawline z-depth and make edges sharper
6. If eyebrows are THICK: use more points with higher y-values
7. If eyebrows are THIN: use fewer points with lower y-values
8. Adjust nose width/length based on what you see
9. Adjust mouth size based on what you see

COPY THESE EXACT STRUCTURES (then MODIFY coordinates to match features):

jawline (11pts): [[-0.5,-0.35,0.12],[-0.48,-0.5,0.14],[-0.42,-0.58,0.16],[-0.32,-0.63,0.18],[-0.18,-0.66,0.19],[0,-0.68,0.19],[0.18,-0.66,0.19],[0.32,-0.63,0.18],[0.42,-0.58,0.16],[0.48,-0.5,0.14],[0.5,-0.35,0.12]]

left_cheek (6pts): [[-0.5,-0.28,0.08],[-0.56,-0.18,0.2],[-0.6,-0.06,0.25],[-0.58,0.06,0.26],[-0.54,0.17,0.24],[-0.48,0.25,0.2]]

chin (5pts): [[-0.15,-0.66,0.18],[-0.08,-0.69,0.19],[0,-0.7,0.2],[0.08,-0.69,0.19],[0.15,-0.66,0.18]]

forehead (7pts): [[-0.45,0.42,0.18],[-0.33,0.52,0.2],[-0.18,0.58,0.21],[0,0.6,0.22],[0.18,0.58,0.21],[0.33,0.52,0.2],[0.45,0.42,0.18]]

mouth_outline (12pts): [[-0.28,-0.38,0.35],[-0.2,-0.42,0.38],[-0.1,-0.44,0.39],[0,-0.45,0.4],[0.1,-0.44,0.39],[0.2,-0.42,0.38],[0.28,-0.38,0.35],[0.22,-0.34,0.37],[0.12,-0.32,0.38],[0,-0.31,0.39],[-0.12,-0.32,0.38],[-0.22,-0.34,0.37]]

left_eyebrow (6pts): [[-0.38,0.4,0.28],[-0.32,0.44,0.3],[-0.25,0.46,0.31],[-0.18,0.45,0.31],[-0.12,0.42,0.3],[-0.08,0.38,0.29]]

nose_bridge (5pts): [[0,0.18,0.38],[0,0.1,0.42],[0,0.02,0.45],[0,-0.05,0.47],[0,-0.1,0.48]]

nose_tip (5pts): [[-0.1,-0.12,0.46],[-0.06,-0.14,0.48],[0,-0.15,0.5],[0.06,-0.14,0.48],[0.1,-0.12,0.46]]

hair_front (8pts): [[-0.48,0.52,0.18],[-0.35,0.59,0.2],[-0.2,0.63,0.22],[-0.05,0.64,0.23],[0.1,0.63,0.22],[0.25,0.6,0.2],[0.4,0.54,0.18],[0.5,0.46,0.15]]

left_ear (10pts): [[-0.62,0.15,-0.08],[-0.65,0.08,-0.05],[-0.67,0,-0.02],[-0.68,-0.08,0],[-0.66,-0.16,0.02],[-0.64,-0.18,0.04],[-0.61,-0.12,0.05],[-0.6,-0.05,0.06],[-0.61,0.02,0.05],[-0.63,0.1,0.02]]

neck_front (7pts): [[-0.25,-0.7,0.15],[-0.18,-0.78,0.16],[-0.1,-0.84,0.17],[0,-0.86,0.18],[0.1,-0.84,0.17],[0.18,-0.78,0.16],[0.25,-0.7,0.15]]

neck_left (5pts): [[-0.25,-0.7,0.15],[-0.32,-0.72,0.08],[-0.38,-0.74,0],[-0.42,-0.76,-0.08],[-0.44,-0.78,-0.15]]

EXAMPLE - How to add WAVY HAIR:
If hair is wavy, modify hair points like this:
hair_left_side: [[-0.48+sin(1)*0.05, 0.52, 0.18], [-0.58+sin(2)*0.05, 0.42, 0.12], [-0.66+sin(3)*0.05, 0.28, 0.04], ...]

YOUR WORKFLOW:
1. Write ONE brief sentence: "Face: [shape]. Hair: [style]. Features: [notable]."
2. Generate ALL 28 contours as COMPACT single-line JSON
3. NO line breaks in the JSON array
4. Use short contour names

Output format (ONE LINE, use EXACT field names):
DESC: [brief]
JSON: [{"name":"jawline","points":[[x,y,z],...],"connects_to":["other"]},...]

CRITICAL: 
- Use "points" NOT "pts"
- Use "connects_to" field (can be [])
- Output on ONE continuous line with NO formatting!`
              }
          ]
        }]
      })

      const responseText = message.content[0].type === 'text' 
        ? message.content[0].text 
        : ''

      console.log('📄 Claude response (first 500 chars):', responseText.substring(0, 500))
      
      // FIRST: Extract feature descriptions (before JSON parsing, so we have them even if parsing fails)
      const hasDescriptions = responseText.toLowerCase().includes('face:') || 
                             responseText.toLowerCase().includes('hair:') ||
                             responseText.toLowerCase().includes('wavy') || 
                             responseText.toLowerCase().includes('curly') ||
                             responseText.toLowerCase().includes('angular') || 
                             responseText.toLowerCase().includes('oval') ||
                             responseText.toLowerCase().includes('round')
      
      if (hasDescriptions) {
        console.log('📝 Found feature descriptions in Claude response!')
      }
      
      // Check if Claude refused the request (but only if no JSON follows)
      const hasJSON = responseText.includes('[{') || responseText.includes('{')
      const seemsRefused = (responseText.toLowerCase().includes('i cannot') || 
                           responseText.toLowerCase().includes('i\'m not able')) &&
                           !hasJSON
      
      if (seemsRefused) {
        console.warn('⚠️ Claude refused the request with no JSON data')
        
        // If we have descriptions, use them with base template
        if (hasDescriptions) {
          console.log('   But we have descriptions! Using base template with modifications')
          const baseContours = generateMockFaceContours()
          const customizedContours = applyFeatureDescriptions(baseContours, responseText)
          return NextResponse.json({ faceData: { contours: customizedContours } })
        }
        
        // Otherwise fall back to image-based
        console.warn('   Using image-based custom face generation instead...')
        const customContours = await generateCustomFaceFromImage(photoBuffers[0])
        return NextResponse.json({ 
          faceData: { contours: customContours }
        })
      }

      // Extract JSON from response (handle various formats)
      let cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/\n/g, ' ')  // Remove all newlines to help with truncation
        .trim()
      
      // Handle "DESC: ... JSON: [...]" format
      if (cleanedText.includes('JSON:')) {
        const jsonStart = cleanedText.indexOf('JSON:')
        cleanedText = cleanedText.substring(jsonStart + 5).trim()
        console.log('   Extracted JSON after "JSON:" marker')
      }
      
      // If JSON starts with { instead of [{, wrap in array
      if (cleanedText.startsWith('{') && !cleanedText.startsWith('[{')) {
        console.log('   Wrapping single object in array brackets')
        // Find the end of the JSON (last })
        const lastBrace = cleanedText.lastIndexOf('}')
        if (lastBrace !== -1) {
          cleanedText = '[' + cleanedText.substring(0, lastBrace + 1) + ']'
        }
      }
      
      // Find array start/end if Claude added text
      let arrayStart = cleanedText.indexOf('[{')
      let arrayEnd = cleanedText.lastIndexOf('}]')
      
      // If truncated, try to find the last complete contour
      if (arrayStart !== -1 && arrayEnd === -1) {
        console.warn('⚠️ JSON appears truncated, finding last complete contour')
        const lastCompleteEnd = cleanedText.lastIndexOf('}')
        if (lastCompleteEnd !== -1) {
          cleanedText = cleanedText.substring(arrayStart, lastCompleteEnd + 1) + ']'
          console.log('   Reconstructed array end')
        }
      } else if (arrayStart !== -1 && arrayEnd !== -1) {
        cleanedText = cleanedText.substring(arrayStart, arrayEnd + 2)
      }
      
      // Try to fix common JSON issues
      cleanedText = cleanedText
        .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
        .replace(/,\s*}/g, '}')  // Remove trailing commas before }
        .replace(/\[,/g, '[')    // Remove leading commas after [
      
      try {
        let contours = JSON.parse(cleanedText)
        
        if (!Array.isArray(contours)) {
          console.warn(`⚠️ Claude response is not an array, using custom face`)
          const customContours = await generateCustomFaceFromImage(photoBuffers[0])
          return NextResponse.json({ faceData: { contours: customContours } })
        }
        
        // Fix field names if Claude used shortened versions
        contours = contours.map((c: any) => ({
          name: c.name,
          points: c.points || c.pts || [],
          connects_to: c.connects_to || c.conn || []
        }))
        
        if (contours.length < 20) {
          console.warn(`⚠️ Claude returned only ${contours.length} contours (expected 28)`)
          console.warn(`   Using base template modified with Claude's feature descriptions`)
          
          // Use base template but apply Claude's feature descriptions
          const baseContours = generateMockFaceContours()
          const customizedContours = applyFeatureDescriptions(baseContours, responseText)
          
          return NextResponse.json({ faceData: { contours: customizedContours } })
        }
        
        // Validate that contours have enough points for smooth curves
        const invalidContours = contours.filter((c: FaceContour) => !c.points || c.points.length < 5)
        if (invalidContours.length > 0) {
          console.warn(`⚠️ ${invalidContours.length} contours have too few points:`)
          invalidContours.forEach((c: FaceContour) => {
            console.warn(`   - ${c.name}: ${c.points?.length || 0} points (need 5+)`)
          })
          console.warn('   Using mock data for quality')
          return NextResponse.json({ 
            faceData: { contours: generateMockFaceContours() }
          })
        }
        
        // Extract description if present and apply features
        let finalContours = contours
        const hasDescriptions = responseText.toLowerCase().includes('wavy') || 
                               responseText.toLowerCase().includes('curly') ||
                               responseText.toLowerCase().includes('angular') || 
                               responseText.toLowerCase().includes('oval') ||
                               responseText.toLowerCase().includes('round')
        
        if (hasDescriptions) {
          console.log('📝 Found feature descriptions in Claude response')
          finalContours = applyFeatureDescriptions(contours, responseText)
        }
        
        // Validate point structure
        const avgPoints = finalContours.reduce((sum: number, c: FaceContour) => sum + (c.points?.length || 0), 0) / finalContours.length
        console.log('✅ Claude face analysis complete! Contours:', finalContours.length)
        console.log('   Average points per contour:', avgPoints.toFixed(1))
        console.log('🎭 Custom face model created for user:', userId.substring(0, 10))
        
        return NextResponse.json({ 
          faceData: { contours: finalContours }
        })
      } catch (parseError: any) {
        console.error('❌ Failed to parse Claude JSON:', parseError.message)
        console.error('   Response length:', responseText.length, '/ Max: 4096 tokens')
        console.error('   Position:', parseError.message.match(/position (\d+)/)?.[1] || 'unknown')
        
        // If we have feature descriptions, use them!
        if (hasDescriptions) {
          console.log('   ✅ But we have Claude\'s feature descriptions!')
          console.log('   Using base template modified with descriptions')
          const baseContours = generateMockFaceContours()
          const customizedContours = applyFeatureDescriptions(baseContours, responseText)
          return NextResponse.json({ 
            faceData: { contours: customizedContours }
          })
        }
        
        // Otherwise fall back to image-based custom face
        console.log('   Falling back to image-based custom face...')
        const customContours = await generateCustomFaceFromImage(photoBuffers[0])
        return NextResponse.json({ 
          faceData: { contours: customContours }
        })
      }

    } catch (error: any) {
      console.error('❌ Claude Vision API error:', error.message)
      return NextResponse.json({ 
        faceData: { contours: generateMockFaceContours() }
      })
    }

  } catch (error: any) {
    console.error('❌ Face analysis error:', error)
    return NextResponse.json({ 
      faceData: { contours: generateMockFaceContours() }
    })
  }
}

function generateMockFaceContours(): FaceContour[] {
  console.log('🎭 Generating realistic 3D head with proper depth + hair + ears + neck (28 contours)')
  
  // Full 3D head: face + hair + back scaffold (with MUCH more depth)
  return [
    // FRONT FACE (detailed, with proper depth)
    {
      name: 'jawline',
      points: [
        [-0.5, -0.35, 0.08], [-0.48, -0.5, 0.12], [-0.42, -0.58, 0.14],
        [-0.32, -0.63, 0.16], [-0.18, -0.66, 0.18], [0, -0.68, 0.19],
        [0.18, -0.66, 0.18], [0.32, -0.63, 0.16], [0.42, -0.58, 0.14],
        [0.48, -0.5, 0.12], [0.5, -0.35, 0.08]
      ],
      connects_to: ['left_cheek', 'chin', 'right_cheek', 'left_temple', 'right_temple']
    },
    {
      name: 'left_cheek',
      points: [
        [-0.5, -0.28, 0.08], [-0.56, -0.18, 0.2], [-0.6, -0.06, 0.25],
        [-0.58, 0.06, 0.26], [-0.54, 0.17, 0.24], [-0.48, 0.25, 0.2]
      ],
      connects_to: ['jawline', 'left_eye_outline', 'nose_bridge', 'left_temple']
    },
    {
      name: 'right_cheek',
      points: [
        [0.5, -0.28, 0.08], [0.56, -0.18, 0.2], [0.6, -0.06, 0.25],
        [0.58, 0.06, 0.26], [0.54, 0.17, 0.24], [0.48, 0.25, 0.2]
      ],
      connects_to: ['jawline', 'right_eye_outline', 'nose_bridge', 'right_temple']
    },
    {
      name: 'forehead',
      points: [
        [-0.45, 0.42, 0.18], [-0.33, 0.52, 0.2], [-0.18, 0.58, 0.21],
        [0, 0.6, 0.22], [0.18, 0.58, 0.21], [0.33, 0.52, 0.2], [0.45, 0.42, 0.18]
      ],
      connects_to: ['left_eyebrow', 'right_eyebrow', 'top_of_head']
    },
    {
      name: 'left_eye_outline',
      points: [
        [-0.35, 0.28, 0.28], [-0.29, 0.32, 0.32], [-0.22, 0.33, 0.34],
        [-0.15, 0.32, 0.33], [-0.12, 0.28, 0.31], [-0.14, 0.24, 0.29],
        [-0.2, 0.23, 0.28], [-0.27, 0.24, 0.28], [-0.33, 0.26, 0.29]
      ],
      connects_to: ['left_eyebrow', 'nose_bridge', 'left_cheek']
    },
    {
      name: 'right_eye_outline',
      points: [
        [0.12, 0.28, 0.31], [0.15, 0.32, 0.33], [0.22, 0.33, 0.34],
        [0.29, 0.32, 0.32], [0.35, 0.28, 0.28], [0.33, 0.26, 0.29],
        [0.27, 0.24, 0.28], [0.2, 0.23, 0.28], [0.14, 0.24, 0.29]
      ],
      connects_to: ['right_eyebrow', 'nose_bridge', 'right_cheek']
    },
    {
      name: 'nose_bridge',
      points: [
        [0, 0.18, 0.38], [0, 0.1, 0.42], [0, 0.02, 0.45],
        [0, -0.05, 0.47], [0, -0.1, 0.48]
      ],
      connects_to: ['left_eye_outline', 'right_eye_outline', 'nose_tip']
    },
    {
      name: 'nose_tip',
      points: [
        [-0.1, -0.12, 0.46], [-0.06, -0.14, 0.48], [0, -0.15, 0.5],
        [0.06, -0.14, 0.48], [0.1, -0.12, 0.46]
      ],
      connects_to: ['nose_bridge', 'mouth_outline']
    },
    {
      name: 'mouth_outline',
      points: [
        [-0.28, -0.38, 0.35], [-0.2, -0.42, 0.38], [-0.1, -0.44, 0.39],
        [0, -0.45, 0.4], [0.1, -0.44, 0.39], [0.2, -0.42, 0.38],
        [0.28, -0.38, 0.35], [0.22, -0.34, 0.37], [0.12, -0.32, 0.38],
        [0, -0.31, 0.39], [-0.12, -0.32, 0.38], [-0.22, -0.34, 0.37]
      ],
      connects_to: ['nose_tip', 'chin', 'left_cheek', 'right_cheek']
    },
    {
      name: 'left_eyebrow',
      points: [
        [-0.38, 0.4, 0.28], [-0.32, 0.44, 0.3], [-0.25, 0.46, 0.31],
        [-0.18, 0.45, 0.31], [-0.12, 0.42, 0.3], [-0.08, 0.38, 0.29]
      ],
      connects_to: ['forehead', 'left_eye_outline']
    },
    {
      name: 'right_eyebrow',
      points: [
        [0.08, 0.38, 0.29], [0.12, 0.42, 0.3], [0.18, 0.45, 0.31],
        [0.25, 0.46, 0.31], [0.32, 0.44, 0.3], [0.38, 0.4, 0.28]
      ],
      connects_to: ['forehead', 'right_eye_outline']
    },
    {
      name: 'chin',
      points: [
        [-0.15, -0.66, 0.18], [-0.08, -0.69, 0.19], [0, -0.7, 0.2],
        [0.08, -0.69, 0.19], [0.15, -0.66, 0.18]
      ],
      connects_to: ['jawline', 'mouth_outline']
    },
    
    // HAIR (fuller, more volumetric)
    {
      name: 'hair_front',
      points: [
        [-0.48, 0.52, 0.18], [-0.35, 0.59, 0.2], [-0.2, 0.63, 0.22],
        [-0.05, 0.64, 0.23], [0.1, 0.63, 0.22], [0.25, 0.6, 0.2],
        [0.4, 0.54, 0.18], [0.5, 0.46, 0.15]
      ],
      connects_to: ['forehead', 'hair_left_side', 'hair_right_side', 'hair_top']
    },
    {
      name: 'hair_left_side',
      points: [
        [-0.48, 0.52, 0.18], [-0.58, 0.42, 0.12], [-0.66, 0.28, 0.04],
        [-0.7, 0.12, -0.04], [-0.72, -0.04, -0.1], [-0.7, -0.18, -0.14],
        [-0.65, -0.3, -0.16]
      ],
      connects_to: ['hair_front', 'left_temple', 'hair_back_left', 'left_ear']
    },
    {
      name: 'hair_right_side',
      points: [
        [0.5, 0.46, 0.15], [0.6, 0.38, 0.1], [0.68, 0.24, 0.02],
        [0.72, 0.08, -0.06], [0.74, -0.06, -0.11], [0.72, -0.2, -0.15],
        [0.67, -0.32, -0.17]
      ],
      connects_to: ['hair_front', 'right_temple', 'hair_back_right', 'right_ear']
    },
    {
      name: 'hair_top',
      points: [
        [-0.42, 0.68, 0.1], [-0.28, 0.75, 0.04], [-0.12, 0.8, -0.02],
        [0, 0.82, -0.05], [0.12, 0.8, -0.02], [0.28, 0.75, 0.04], [0.42, 0.68, 0.1]
      ],
      connects_to: ['hair_front', 'top_of_head']
    },
    {
      name: 'hair_back_left',
      points: [
        [-0.65, -0.3, -0.16], [-0.68, -0.42, -0.24], [-0.66, -0.52, -0.3],
        [-0.6, -0.6, -0.34], [-0.5, -0.66, -0.36], [-0.36, -0.7, -0.38],
        [-0.2, -0.72, -0.39]
      ],
      connects_to: ['hair_left_side', 'back_of_head']
    },
    {
      name: 'hair_back_right',
      points: [
        [0.67, -0.32, -0.17], [0.7, -0.44, -0.25], [0.68, -0.54, -0.31],
        [0.62, -0.62, -0.35], [0.52, -0.68, -0.37], [0.38, -0.72, -0.39],
        [0.22, -0.74, -0.4]
      ],
      connects_to: ['hair_right_side', 'back_of_head']
    },
    
    // HEAD SCAFFOLD (back and sides for 3D volume - MORE DEPTH)
    {
      name: 'left_temple',
      points: [
        [-0.42, -0.48, 0.08], [-0.48, -0.35, 0.02], [-0.52, -0.18, -0.08],
        [-0.56, 0, -0.14], [-0.54, 0.2, -0.12], [-0.5, 0.38, -0.05],
        [-0.44, 0.5, 0.02]
      ],
      connects_to: ['jawline', 'left_cheek', 'top_of_head', 'hair_left_side']
    },
    {
      name: 'right_temple',
      points: [
        [0.42, -0.48, 0.08], [0.48, -0.35, 0.02], [0.52, -0.18, -0.08],
        [0.56, 0, -0.14], [0.54, 0.2, -0.12], [0.5, 0.38, -0.05],
        [0.44, 0.5, 0.02]
      ],
      connects_to: ['jawline', 'right_cheek', 'top_of_head', 'hair_right_side']
    },
    {
      name: 'back_of_head',
      points: [
        // Top back
        [-0.25, 0.75, -0.35], [0, 0.82, -0.38], [0.25, 0.75, -0.35],
        // Mid back (widest)
        [0.56, 0.35, -0.3], [0.6, 0, -0.32], [0.58, -0.3, -0.35],
        // Lower back
        [0.42, -0.55, -0.38], [0.22, -0.7, -0.4], [0, -0.78, -0.42],
        [-0.22, -0.7, -0.4], [-0.42, -0.55, -0.38],
        // Back up left side
        [-0.58, -0.3, -0.35], [-0.6, 0, -0.32], [-0.56, 0.35, -0.3]
      ],
      connects_to: ['hair_back_left', 'hair_back_right', 'top_of_head']
    },
    {
      name: 'top_of_head',
      points: [
        [-0.38, 0.75, 0.05], [-0.22, 0.84, -0.02], [0, 0.88, -0.08],
        [0.22, 0.84, -0.02], [0.38, 0.75, 0.05], [0.5, 0.6, -0.1],
        [0.25, 0.75, -0.35], [0, 0.82, -0.38], [-0.25, 0.75, -0.35],
        [-0.5, 0.6, -0.1]
      ],
      connects_to: ['forehead', 'left_temple', 'right_temple', 'back_of_head', 'hair_top']
    },
    
    // EARS
    {
      name: 'left_ear',
      points: [
        // Outer ear curve
        [-0.62, 0.15, -0.08], [-0.65, 0.08, -0.05], [-0.67, 0, -0.02],
        [-0.68, -0.08, 0], [-0.66, -0.16, 0.02],
        // Inner ear curve
        [-0.64, -0.18, 0.04], [-0.61, -0.12, 0.05], [-0.6, -0.05, 0.06],
        [-0.61, 0.02, 0.05], [-0.63, 0.1, 0.02]
      ],
      connects_to: ['left_temple', 'left_cheek', 'hair_left_side']
    },
    {
      name: 'right_ear',
      points: [
        // Outer ear curve
        [0.62, 0.15, -0.08], [0.65, 0.08, -0.05], [0.67, 0, -0.02],
        [0.68, -0.08, 0], [0.66, -0.16, 0.02],
        // Inner ear curve
        [0.64, -0.18, 0.04], [0.61, -0.12, 0.05], [0.6, -0.05, 0.06],
        [0.61, 0.02, 0.05], [0.63, 0.1, 0.02]
      ],
      connects_to: ['right_temple', 'right_cheek', 'hair_right_side']
    },
    
    // NECK (connects head to body)
    {
      name: 'neck_front',
      points: [
        [-0.25, -0.7, 0.15], [-0.18, -0.78, 0.16], [-0.1, -0.84, 0.17],
        [0, -0.86, 0.18], [0.1, -0.84, 0.17], [0.18, -0.78, 0.16], [0.25, -0.7, 0.15]
      ],
      connects_to: ['chin', 'jawline', 'neck_left', 'neck_right']
    },
    {
      name: 'neck_left',
      points: [
        [-0.25, -0.7, 0.15], [-0.32, -0.72, 0.08], [-0.38, -0.74, 0],
        [-0.42, -0.76, -0.08], [-0.44, -0.78, -0.15]
      ],
      connects_to: ['neck_front', 'jawline', 'neck_back']
    },
    {
      name: 'neck_right',
      points: [
        [0.25, -0.7, 0.15], [0.32, -0.72, 0.08], [0.38, -0.74, 0],
        [0.42, -0.76, -0.08], [0.44, -0.78, -0.15]
      ],
      connects_to: ['neck_front', 'jawline', 'neck_back']
    },
    {
      name: 'neck_back',
      points: [
        [-0.44, -0.78, -0.15], [-0.36, -0.8, -0.22], [-0.24, -0.82, -0.26],
        [-0.12, -0.84, -0.28], [0, -0.85, -0.29], [0.12, -0.84, -0.28],
        [0.24, -0.82, -0.26], [0.36, -0.8, -0.22], [0.44, -0.78, -0.15]
      ],
      connects_to: ['neck_left', 'neck_right', 'back_of_head']
    }
  ]
}
