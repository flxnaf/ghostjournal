import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

/**
 * Analyze hair style from a photo using Claude Vision
 * Returns structured hair characteristics
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    console.log('💇 Analyzing hair style with Claude Vision...')

    // Convert image to base64
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    const base64Image = imageBuffer.toString('base64')
    const mediaType = imageFile.type.includes('png') ? 'image/png' : 'image/jpeg'

    // Ask Claude to analyze ONLY the hair
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Image
            }
          },
          {
            type: 'text',
            text: `Analyze ONLY the hair in this photo. Describe it in this EXACT format (one line each):

LENGTH: [very short / short / medium / long / very long]
VOLUME: [flat / low / medium / high / very high]
DIRECTION: [down/flat / neutral / up/spiky / messy]
TEXTURE: [straight / wavy / curly / very curly]
STYLE: [brief description, e.g. "buzz cut", "side part", "spiky", "wavy medium"]

Be specific and concise. Focus on what you actually see, not assumptions.`
          }
        ]
      }]
    })

    const analysisText = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log('📝 Claude hair analysis:', analysisText)

    // Parse the structured response
    const hairStyle = parseHairAnalysis(analysisText)
    
    console.log('✅ Parsed hair style:', hairStyle)

    return NextResponse.json({ hairStyle })

  } catch (error: any) {
    console.error('❌ Hair analysis error:', error)
    return NextResponse.json(
      { error: 'Hair analysis failed', details: error.message },
      { status: 500 }
    )
  }
}

interface HairStyle {
  length: string
  volume: string
  direction: string
  texture: string
  style: string
}

function parseHairAnalysis(text: string): HairStyle {
  const lines = text.split('\n')
  
  const hairStyle: HairStyle = {
    length: 'medium',
    volume: 'medium',
    direction: 'neutral',
    texture: 'straight',
    style: 'medium hair'
  }

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.startsWith('length:')) {
      hairStyle.length = line.split(':')[1]?.trim() || 'medium'
    } else if (lower.startsWith('volume:')) {
      hairStyle.volume = line.split(':')[1]?.trim() || 'medium'
    } else if (lower.startsWith('direction:')) {
      hairStyle.direction = line.split(':')[1]?.trim() || 'neutral'
    } else if (lower.startsWith('texture:')) {
      hairStyle.texture = line.split(':')[1]?.trim() || 'straight'
    } else if (lower.startsWith('style:')) {
      hairStyle.style = line.split(':')[1]?.trim() || 'medium hair'
    }
  }

  return hairStyle
}

