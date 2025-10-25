#!/bin/bash
API_KEY="4c1f8ef557b841eabc941f7cb57cdcbf"

echo "=== Testing Fish Audio API ==="
echo ""
echo "1. Check API Key Status:"
curl -X GET "https://api.fish.audio/v1/voices" \
  -H "Authorization: Bearer $API_KEY" \
  -w "\nHTTP Status: %{http_code}\n\n" \
  --max-time 10 \
  2>&1

echo ""
echo "2. Check User Info / Credits:"
curl -X GET "https://api.fish.audio/v1/user" \
  -H "Authorization: Bearer $API_KEY" \
  -w "\nHTTP Status: %{http_code}\n\n" \
  --max-time 10 \
  2>&1

echo ""
echo "3. Test TTS endpoint (simpler than voice cloning):"
curl -X POST "https://api.fish.audio/v1/tts" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"test","reference_id":"default"}' \
  -w "\nHTTP Status: %{http_code}\n\n" \
  --max-time 10 \
  2>&1 | head -20
