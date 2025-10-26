#!/bin/bash

###############################################################################
# SAFE API Testing Script - Uses Environment Variables
# 
# This script shows how to safely test Fish Audio API without hardcoding keys
# 
# Usage:
#   1. Make sure your .env file contains FISH_AUDIO_API_KEY
#   2. Run: ./scripts/test_api_example.sh
###############################################################################

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo "✓ Loaded .env file"
else
  echo "❌ Error: .env file not found!"
  echo "   Create .env file with: FISH_AUDIO_API_KEY=your_key_here"
  exit 1
fi

# Check if API key is set
if [ -z "$FISH_AUDIO_API_KEY" ]; then
  echo "❌ Error: FISH_AUDIO_API_KEY not set in .env"
  exit 1
fi

echo "🐠 Testing Fish Audio API..."
echo "   Using key: ${FISH_AUDIO_API_KEY:0:10}... (hidden for security)"
echo ""

# Example: List available models
echo "📋 Fetching available models..."
curl -s -X GET "https://api.fish.audio/v1/models" \
  -H "Authorization: Bearer $FISH_AUDIO_API_KEY" \
  | jq '.' || echo "Error: jq not installed (install with: brew install jq)"

echo ""
echo "✅ Done! Remember: Never commit files with hardcoded API keys!"

