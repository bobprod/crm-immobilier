#!/bin/bash

# Test Frontend API Key Validators
# This script tests the direct API key validation from the browser console

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Frontend Direct API Key Validation - Test Script           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

GEMINI_KEY="AIzaSyB6ZOSlEVDIXpWdMB6zgDvmDiC-3pxPDSw"

echo "Tests à exécuter depuis la console du navigateur:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Ouvrir: http://localhost:3000/settings"
echo "2. Aller à: API Keys tab"
echo "3. Entrer ta clé Gemini:"
echo "   ${GEMINI_KEY}"
echo "4. Cliquer sur le bouton [Test]"
echo "5. Attendre le résultat ✅ ou ❌"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ou tester directement via curl (test des endpoints):"
echo ""

# Test Gemini via direct API call
echo "🧪 Testing Gemini API directly..."
echo ""
echo "Command:"
echo "curl -X POST 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"contents\":[{\"parts\":[{\"text\":\"test\"}]}]}'"
echo ""
echo "Expected: HTTP 200 or 429 (both mean key is valid)"
echo ""

# Test OpenAI with fake key
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing OpenAI API directly (with fake key)..."
echo ""
echo "Command:"
echo "curl -H 'Authorization: Bearer sk-fake' https://api.openai.com/v1/models"
echo ""
echo "Expected: HTTP 401 (Unauthorized - key is invalid)"
echo ""

# Test Anthropic with fake key
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing Anthropic API directly (with fake key)..."
echo ""
echo "Command:"
echo "curl -H 'x-api-key: sk-ant-fake' https://api.anthropic.com/v1/models"
echo ""
echo "Expected: HTTP 401 (Unauthorized - key is invalid)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test Plan Created!"
echo ""
echo "Files Modified:"
echo "  ✓ frontend/utils/api-key-validators.ts (NEW)"
echo "  ✓ frontend/pages/settings/index.tsx (updated)"
echo ""
echo "Next Steps:"
echo "  1. npm run dev (start frontend)"
echo "  2. Navigate to Settings → API Keys"
echo "  3. Enter API key and click Test button"
echo "  4. Observe result message"
echo ""
