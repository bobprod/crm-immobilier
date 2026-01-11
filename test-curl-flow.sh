#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# API Keys Save Test Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API_URL="http://localhost:3001"
TEST_TOKEN="test-token-$(date +%s)"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      API Keys & LLM Model Save - Integration Tests        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Test 1: Check if backend is responding
echo "🔍 Test 1: Check backend connectivity"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null)
if [ "$HEALTH" != "000" ]; then
  echo "✅ Backend is responding (HTTP $HEALTH)"
else
  echo "❌ Backend not responding"
  echo "⏹️  Stopping tests - backend needs to be running"
  exit 1
fi
echo ""

# Test 2: Save API keys with provider and model
echo "💾 Test 2: Save API keys with provider and model"
SAVE_RESPONSE=$(curl -s -X PUT "$API_URL/ai-billing/api-keys/user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "openaiApiKey":"sk-test-key-12345",
    "defaultProvider":"openai",
    "defaultModel":"gpt-4o"
  }' 2>&1)

echo "Response:"
echo "$SAVE_RESPONSE" | head -10
echo ""

# Test 3: Retrieve saved data
echo "📖 Test 3: Retrieve saved API keys"
GET_RESPONSE=$(curl -s -X GET "$API_URL/ai-billing/api-keys/user" \
  -H "Authorization: Bearer $TEST_TOKEN" 2>&1)

echo "Response:"
echo "$GET_RESPONSE" | head -15

# Check if defaultProvider is in response
if echo "$GET_RESPONSE" | grep -q "defaultProvider"; then
  echo "✅ defaultProvider field found in response"
else
  echo "❌ defaultProvider field NOT found in response"
fi

if echo "$GET_RESPONSE" | grep -q "defaultModel"; then
  echo "✅ defaultModel field found in response"
else
  echo "❌ defaultModel field NOT found in response"
fi

echo ""

# Test 4: Switch to different provider
echo "🔄 Test 4: Switch to different provider (gemini)"
SWITCH_RESPONSE=$(curl -s -X PUT "$API_URL/ai-billing/api-keys/user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "geminiApiKey":"AIzaSyD-test123",
    "defaultProvider":"gemini",
    "defaultModel":"gemini-2.0-flash"
  }' 2>&1)

echo "Response:"
echo "$SWITCH_RESPONSE" | head -5
echo ""

# Test 5: Verify switched provider
echo "✓ Test 5: Verify provider was switched"
VERIFY_RESPONSE=$(curl -s -X GET "$API_URL/ai-billing/api-keys/user" \
  -H "Authorization: Bearer $TEST_TOKEN" 2>&1)

if echo "$VERIFY_RESPONSE" | grep -q '"defaultProvider":"gemini"'; then
  echo "✅ Provider successfully switched to gemini"
elif echo "$VERIFY_RESPONSE" | grep -q 'defaultProvider.*gemini'; then
  echo "✅ Provider successfully switched to gemini"
else
  echo "⚠️  Could not verify provider switch"
  echo "$VERIFY_RESPONSE" | head -10
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Tests Completed                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
