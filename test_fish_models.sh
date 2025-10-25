#!/bin/bash
API_KEY="4c1f8ef557b841eabc941f7cb57cdcbf"

echo "=== Testing Fish Audio Model API ==="
echo ""

echo "1. Try to list models:"
curl -X GET "https://api.fish.audio/model" \
  -H "Authorization: Bearer $API_KEY" \
  -w "\nHTTP Status: %{http_code}\n\n" \
  --max-time 10 \
  2>&1 | head -20

echo ""
echo "2. Try v1/model:"
curl -X GET "https://api.fish.audio/v1/model" \
  -H "Authorization: Bearer $API_KEY" \
  -w "\nHTTP Status: %{http_code}\n\n" \
  --max-time 10 \
  2>&1 | head -20

echo ""
echo "3. Try to get account info:"
curl -X GET "https://api.fish.audio/v1/account" \
  -H "Authorization: Bearer $API_KEY" \
  -w "\nHTTP Status: %{http_code}\n\n" \
  --max-time 10 \
  2>&1
