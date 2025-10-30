import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

/**
 * Save or update user's Minecraft username
 * Also validates username with Mojang API
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, minecraftUsername } = await request.json()

    if (!userId || !minecraftUsername) {
      return NextResponse.json(
        { error: 'userId and minecraftUsername required' },
        { status: 400 }
      )
    }

    // Validate Minecraft username exists
    const mojangProfile = await fetchMinecraftProfile(minecraftUsername)

    if (!mojangProfile) {
      return NextResponse.json(
        { error: 'Minecraft username not found' },
        { status: 404 }
      )
    }

    // Update user record
    const user = await prisma.user.update({
      where: { id: userId },
      data: { minecraftUsername }
    })

    return NextResponse.json({
      success: true,
      minecraftUsername,
      skinUrl: mojangProfile.skinUrl,
      uuid: mojangProfile.uuid
    })

  } catch (error: any) {
    console.error('Minecraft username update error:', error)
    return NextResponse.json(
      { error: 'Failed to update Minecraft username', details: error.message },
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
    console.log('🎮 Fetching Minecraft profile for:', username)

    // Step 1: Get UUID from username
    const uuidResponse = await axios.get(
      `https://api.mojang.com/users/profiles/minecraft/${username}`,
      { timeout: 5000 }
    )

    if (!uuidResponse.data || !uuidResponse.data.id) {
      console.log('❌ Minecraft username not found')
      return null
    }

    const uuid = uuidResponse.data.id
    console.log('✅ Found UUID:', uuid)

    // Step 2: Get profile with skin data
    const profileResponse = await axios.get(
      `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`,
      { timeout: 5000 }
    )

    if (!profileResponse.data) {
      console.log('❌ Failed to fetch profile')
      return null
    }

    // Step 3: Decode skin URL from base64 textures
    const texturesProperty = profileResponse.data.properties.find(
      (prop: any) => prop.name === 'textures'
    )

    if (!texturesProperty) {
      console.log('⚠️ No textures property found')
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
    console.log('✅ Skin URL:', skinUrl || 'None (using default)')

    return {
      uuid,
      username: profileResponse.data.name,
      skinUrl
    }

  } catch (error: any) {
    console.error('❌ Mojang API error:', error.message)
    return null
  }
}
