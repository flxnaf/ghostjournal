#!/bin/bash
API_KEY="4c1f8ef557b841eabc941f7cb57cdcbf"

echo "=== Testing Fish Audio Model Creation ==="

# Test 1: Try POST /model (create)
echo "1. Try POST /model to create custom voice:"
curl -X POST "https://api.fish.audio/model" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Voice","description":"Test"}' \
  -w "\nHTTP Status: %{http_code}\n\n" \
  --max-time 10 \
  2>&1 | head -30

# Test 2: Try uploading to /v1/model
echo ""
echo "2. Try POST /v1/model:"
curl -X POST "https://api.fish.audio/v1/model" \
  -H "Authorization: Bearer $API_KEY" \
  -w "\nHTTP Status: %{http_code}\n\n" \
  --max-time 10 \
  2>&1

# Test 3: Check SDK-based endpoints
echo ""
echo "3. Try /v1/model/upload:"
curl -X POST "https://api.fish.audio/v1/model/upload" \
  -H "Authorization: Bearer $API_KEY" \
  -w "\nHTTP Status: %{http_code}\n\n" \
  --max-time 10 \
  2>&1
