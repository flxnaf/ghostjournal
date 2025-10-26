import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

/**
 * Minecraft Export API - Username Lookup
 *
 * Returns twin data by username instead of UUID
 * Includes Minecraft skin URL if minecraftUsername is set
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params

    console.log('🎮 Minecraft export request for username:', username)

    // Find user by username (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { name: { equals: username, mode: 'insensitive' } }
        ]
      }
    })

    if (!user) {
      console.log('❌ User not found:', username)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User found:', user.name || user.username)
    console.log('═══════════════════════════════════════════')
    console.log('🎤 USER VOICE DATA:')
    console.log('   voiceModelId:', user.voiceModelId || 'NULL')
    console.log('   audioUrl:', user.audioUrl || 'NULL')
    console.log('═══════════════════════════════════════════')

    // Fetch Minecraft skin if username is set
    let minecraftSkinUrl = null
    if (user.minecraftUsername) {
      console.log('🎨 Fetching Minecraft skin for:', user.minecraftUsername)
      const mojangProfile = await fetchMinecraftProfile(user.minecraftUsername)
      minecraftSkinUrl = mojangProfile?.skinUrl || null
      console.log('🎨 Skin URL:', minecraftSkinUrl || 'None (will use Steve)')
    }

    // Return twin data
    const twinData = {
      twin_id: user.id,
      username: user.username || user.name,
      name: user.name || 'Unknown',
      display_name: user.name || 'Digital Twin',
      voice_model_id: user.voiceModelId,
      minecraft_username: user.minecraftUsername,
      minecraft_skin_url: minecraftSkinUrl,
      api_endpoint: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/speak`,
      created_at: user.createdAt.toISOString()
    }

    console.log('✅ Returning twin data with voice_model_id:', twinData.voice_model_id || 'NULL')
    return NextResponse.json(twinData)

  } catch (error: any) {
    console.error('❌ Export API error:', error)
    return NextResponse.json(
      { error: 'Failed to export twin data', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Fetch Minecraft profile from Mojang API
 */
async function fetchMinecraftProfile(username: string): Promise<{
  uuid: string
  username: string
  skinUrl: string | null
} | null> {
  try {
    // Step 1: Get UUID from username
    const uuidResponse = await axios.get(
      `https://api.mojang.com/users/profiles/minecraft/${username}`,
      { timeout: 5000 }
    )

    if (!uuidResponse.data || !uuidResponse.data.id) {
      return null
    }

    const uuid = uuidResponse.data.id

    // Step 2: Get profile with skin data
    const profileResponse = await axios.get(
      `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`,
      { timeout: 5000 }
    )

    if (!profileResponse.data) {
      return null
    }

    // Step 3: Decode skin URL from base64 textures
    const texturesProperty = profileResponse.data.properties.find(
      (prop: any) => prop.name === 'textures'
    )

    if (!texturesProperty) {
      return {
        uuid,
        username: profileResponse.data.name,
        skinUrl: null
      }
    }

    const texturesData = JSON.parse(
      Buffer.from(texturesProperty.value, 'base64').toString()
    )

    const skinUrl = texturesData.textures?.SKIN?.url || null

    return {
      uuid,
      username: profileResponse.data.name,
      skinUrl
    }

  } catch (error: any) {
    console.error('Mojang API error:', error.message)
    return null
  }
}
