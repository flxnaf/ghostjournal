import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

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

    // Fetch Minecraft skin if username is set
    let minecraftSkinUrl = null
    if (user.minecraftUsername) {
      const mojangProfile = await fetchMinecraftProfile(user.minecraftUsername)
      minecraftSkinUrl = mojangProfile?.skinUrl || null
    }

    // Return minimal data needed for Minecraft
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

    return NextResponse.json(twinData)

  } catch (error: any) {
    console.error('Export API error:', error)
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
    const uuidResponse = await axios.get(
      `https://api.mojang.com/users/profiles/minecraft/${username}`,
      { timeout: 5000 }
    )

    if (!uuidResponse.data || !uuidResponse.data.id) {
      return null
    }

    const uuid = uuidResponse.data.id

    const profileResponse = await axios.get(
      `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`,
      { timeout: 5000 }
    )

    if (!profileResponse.data) {
      return null
    }

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
