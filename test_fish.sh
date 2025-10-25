#!/bin/bash
API_KEY="4c1f8ef557b841eabc941f7cb57cdcbf"
echo "Testing Fish Audio API..."
curl -X GET "https://api.fish.audio/v1/voices" \
  -H "Authorization: Bearer $API_KEY" \
  -w "\nHTTP Status: %{http_code}\n" \
  --max-time 10 \
  2>&1 | head -50
