#!/bin/bash

# Button Click Test Script - Simple Curl + Manual Test

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔘 Button Click Test - Enregistrer les clés LLM             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Check if servers are running
echo "1️⃣  Checking servers..."
echo ""

FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/settings" 2>/dev/null)
BACKEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/ai-billing/api-keys/user" -H "Authorization: Bearer test" 2>/dev/null)

if [ "$FRONTEND_CHECK" = "200" ]; then
  echo "   ✅ Frontend: Running on http://localhost:3000"
else
  echo "   ❌ Frontend: NOT responding (code: $FRONTEND_CHECK)"
fi

if [ "$BACKEND_CHECK" != "000" ]; then
  echo "   ✅ Backend: Running on http://localhost:3001"
else
  echo "   ❌ Backend: NOT responding"
fi

echo ""

# 2. Test the API endpoint directly
echo "2️⃣  Testing API endpoint directly..."
echo ""

echo "   Making PUT request to /ai-billing/api-keys/user..."

RESPONSE=$(curl -s -X PUT http://localhost:3001/ai-billing/api-keys/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-12345" \
  -d '{
    "openaiApiKey":"sk-test123",
    "defaultProvider":"openai",
    "defaultModel":"gpt-4o"
  }' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "   Response Code: $HTTP_CODE"
echo "   Response Body: $BODY"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "   ✅ API endpoint working"
else
  echo "   ⚠️  API responded with $HTTP_CODE"
fi

echo ""

# 3. Instructions for manual testing
echo "3️⃣  Manual Testing Instructions:"
echo ""
echo "   Step 1: Open browser: http://localhost:3000/settings"
echo "   Step 2: Open DevTools (F12)"
echo "   Step 3: Go to Console tab"
echo "   Step 4: Click on 'LLM / IA' tab"
echo "   Step 5: Select a provider (OpenAI, Gemini, etc.)"
echo "   Step 6: Select a model"
echo "   Step 7: Enter an API key (e.g., 'sk-test123')"
echo "   Step 8: Click 'Enregistrer les clés LLM' button"
echo ""
echo "   Expected Results:"
echo "   ✅ Console should show: '🔄 Sending data: {...}'"
echo "   ✅ Console should show: '✅ Save response: {...}'"
echo "   ✅ A GREEN TOAST should appear with 'Clés LLM sauvegardées!'"
echo "   ✅ Toast auto-dismisses after 4 seconds"
echo ""
echo "   If you see errors:"
echo "   ❌ Check 'Authentification requise' - You need to be logged in"
echo "   ❌ Check network errors in Network tab"
echo "   ❌ Check browser console for JavaScript errors"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🎯 What Changed:                                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "  ✅ Added fallback to 'http://localhost:3001' if env not set"
echo "  ✅ Both loadApiKeys() and handleSave() now use fallback"
echo "  ✅ No more undefined API URL"
echo "  ✅ Button should work now even without env variable"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  📝 What to Check:                                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "  1. Are you logged in? (Check localStorage)"
echo "  2. Is backend running? (Should be on :3001)"
echo "  3. Is frontend built? (npm run build in frontend folder)"
echo "  4. Check DevTools Console for any errors"
echo "  5. Check Network tab to see API requests"
echo ""

echo ""
echo "Done! Now test manually in the browser."
echo ""
