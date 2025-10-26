#!/usr/bin/env node

/**
 * Check which users have voice models trained
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkVoices() {
  console.log('═══════════════════════════════════════════')
  console.log('🎤 CHECKING USER VOICE MODELS')
  console.log('═══════════════════════════════════════════\n')

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        voiceModelId: true,
        audioUrl: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 Found ${users.length} users total\n`)

    for (const user of users) {
      console.log('─────────────────────────────────────────')
      console.log(`👤 User: ${user.username || user.name || user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Created: ${user.createdAt}`)
      console.log(`   🎤 Voice Model ID: ${user.voiceModelId || '❌ NULL'}`)
      console.log(`   📼 Audio URL: ${user.audioUrl ? '✅ Present' : '❌ NULL'}`)
      
      if (!user.voiceModelId && user.audioUrl) {
        console.log(`   ⚠️  WARNING: Has audio but no voice model (training incomplete?)`)
      } else if (user.voiceModelId) {
        console.log(`   ✅ Voice model ready!`)
      } else {
        console.log(`   ⏸️  No voice training yet`)
      }
      console.log()
    }

    console.log('═══════════════════════════════════════════')
    
    const withVoice = users.filter(u => u.voiceModelId).length
    console.log(`\n📈 Summary:`)
    console.log(`   Total users: ${users.length}`)
    console.log(`   With voice models: ${withVoice}`)
    console.log(`   Without voice models: ${users.length - withVoice}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkVoices()

