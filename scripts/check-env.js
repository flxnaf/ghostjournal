#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * Validates that all required environment variables are set
 */

const requiredVars = [
  'FISH_AUDIO_API_KEY',
  'ANTHROPIC_API_KEY',
  'DATABASE_URL',
]

const optionalVars = [
  'CHROMA_HOST',
  'CHROMA_PORT',
  'FETCH_AI_API_KEY',
  'NEXT_PUBLIC_BASE_URL',
]

console.log('🔍 Checking environment configuration...\n')

let hasErrors = false
let hasWarnings = false

// Check required variables
console.log('📋 Required Variables:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (!value || value.includes('your_') || value.includes('_here')) {
    console.log(`  ❌ ${varName}: NOT SET or placeholder value`)
    hasErrors = true
  } else {
    const preview = value.length > 20 
      ? value.substring(0, 20) + '...' 
      : value
    console.log(`  ✅ ${varName}: ${preview}`)
  }
})

console.log('\n📋 Optional Variables:')
optionalVars.forEach(varName => {
  const value = process.env[varName]
  if (!value) {
    console.log(`  ⚠️  ${varName}: Not set (optional)`)
    hasWarnings = true
  } else {
    const preview = value.length > 30 
      ? value.substring(0, 30) + '...' 
      : value
    console.log(`  ✅ ${varName}: ${preview}`)
  }
})

console.log('\n' + '='.repeat(50))

if (hasErrors) {
  console.log('\n❌ Configuration errors found!')
  console.log('\nPlease update your .env file with the required values.')
  console.log('See SETUP.md for instructions on obtaining API keys.\n')
  process.exit(1)
} else if (hasWarnings) {
  console.log('\n⚠️  Some optional variables are not set.')
  console.log('The app will work but some features may be limited.\n')
  process.exit(0)
} else {
  console.log('\n✅ All configuration looks good!\n')
  process.exit(0)
}

