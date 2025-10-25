#!/bin/bash
API_KEY="4c1f8ef557b841eabc941f7cb57cdcbf"

echo "=== Testing Fish Audio Reference Audio Cloning ==="

# Create tiny test audio (base64)
echo "Testing with reference audio in request..."

curl -X POST "https://api.fish.audio/v1/tts" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test of voice cloning.",
    "references": [{
      "audio": "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
      "text": ""
    }],
    "format": "mp3"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  --max-time 15 \
  2>&1 | head -50

echo ""
echo "=== Testing multipart form-data approach ==="

# Test if they want multipart instead
curl -X POST "https://api.fish.audio/v1/tts" \
  -H "Authorization: Bearer $API_KEY" \
  -F "text=Hello world" \
  -F "format=mp3" \
  -w "\nHTTP Status: %{http_code}\n" \
  --max-time 10 \
  2>&1 | head -30
