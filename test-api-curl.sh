#!/bin/bash

echo "🚀 Testing API Endpoints..."
echo ""

# Variables
BACKEND_URL="http://localhost:3001"
GEMINI_KEY="AIzaSyC3Bd9zuFof6T1bFjddbfQVGhSaYNSkPmU"
TEST_TOKEN="test-token-123"

echo "📌 Test 1: GET /api/ai-billing/api-keys/user"
echo "---"
curl -s -X GET "$BACKEND_URL/api/ai-billing/api-keys/user" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" | jq . 2>&1 | head -30

echo ""
echo "📌 Test 2: GET /api/ai-billing/api-keys/user/full"
echo "---"
curl -s -X GET "$BACKEND_URL/api/ai-billing/api-keys/user/full" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" | jq . 2>&1 | head -30

echo ""
echo "📌 Test 3: PUT /api/ai-billing/api-keys/user (Save Gemini Key)"
echo "---"
curl -s -X PUT "$BACKEND_URL/api/ai-billing/api-keys/user" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"geminiApiKey\": \"$GEMINI_KEY\",
    \"defaultProvider\": \"gemini\",
    \"defaultModel\": \"gemini-1.5-pro\"
  }" | jq . 2>&1

echo ""
echo "📌 Test 4: Verify Gemini API Key (Direct)"
echo "---"
curl -s -X GET "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_KEY" | jq '.models | length' 2>&1 || echo "❌ API Call failed"

echo ""
echo "✅ Tests complete"
