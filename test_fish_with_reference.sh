#!/bin/bash
API_KEY="4c1f8ef557b841eabc941f7cb57cdcbf"

echo "=== Testing Fish Audio TTS with Reference Audio (Multipart) ==="

# Find a user's audio file to test with
USER_AUDIO=$(find public/uploads -name "recording.webm" | head -1)

if [ -z "$USER_AUDIO" ]; then
  echo "❌ No user audio found. Creating dummy audio file..."
  # Create a tiny dummy audio file
  echo "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=" | base64 -d > /tmp/test_audio.wav
  USER_AUDIO="/tmp/test_audio.wav"
fi

echo "📁 Using audio: $USER_AUDIO"

# Test multipart with reference audio
curl -X POST "https://api.fish.audio/v1/tts" \
  -H "Authorization: Bearer $API_KEY" \
  -F "text=Hello, this is your custom voice clone speaking!" \
  -F "reference_audio=@$USER_AUDIO" \
  -F "reference_text=" \
  -F "format=mp3" \
  -o /tmp/test_clone_output.mp3 \
  -w "\nHTTP Status: %{http_code}\n" \
  --max-time 20 \
  2>&1

if [ -f /tmp/test_clone_output.mp3 ]; then
  SIZE=$(wc -c < /tmp/test_clone_output.mp3)
  echo "✅ Generated audio: $SIZE bytes"
  echo "📄 Saved to: /tmp/test_clone_output.mp3"
else
  echo "❌ No audio generated"
fi
