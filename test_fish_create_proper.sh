#!/bin/bash
API_KEY="4c1f8ef557b841eabc941f7cb57cdcbf"

echo "=== Creating Fish Audio Model with Proper Parameters ==="

curl -X POST "https://api.fish.audio/model" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tts",
    "train_mode": "fast",
    "title": "Test Clone Voice",
    "description": "AI voice clone test"
  }' \
  -w "\nHTTP Status: %{http_code}\n\n" \
  --max-time 10 \
  2>&1
