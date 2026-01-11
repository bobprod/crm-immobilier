#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🧪 MASTER TEST RUNNER - API Keys & LLM Model Save
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

clear
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║     🚀 API Keys & LLM Model Save - Master Test Runner       ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if servers are running
echo "📋 Pre-flight checks..."
echo ""

# Check backend
echo -n "  Checking Backend (localhost:3001)... "
BACKEND=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/ai-billing/api-keys/user" \
  -H "Authorization: Bearer test-token" 2>/dev/null)
if [ "$BACKEND" != "000" ] && [ "$BACKEND" != "404" ]; then
  echo "✅ Running (HTTP $BACKEND)"
else
  echo "❌ Not responding"
fi
echo ""

# Check frontend
echo -n "  Checking Frontend (localhost:3000)... "
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/" 2>/dev/null)
if [ "$FRONTEND" != "000" ] && [ "$FRONTEND" != "404" ]; then
  echo "✅ Running (HTTP $FRONTEND)"
else
  echo "❌ Not responding"
fi
echo ""

# Display menu
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                      TEST OPTIONS                             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "  [1] 🔵 CURL Tests (API Endpoints) - ~5 seconds"
echo "  [2] 🎭 Playwright Tests (UI & Integration) - ~30 seconds"
echo "  [3] 👨‍💻 Manual Testing Guide (Visual)"
echo "  [4] 📊 View Implementation Summary"
echo "  [5] 📖 View Quick Start Guide"
echo "  [6] 🔄 Run All Tests"
echo "  [0] ❌ Exit"
echo ""
echo -n "Select option (0-6): "
read -r option

case $option in
  1)
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                   🔵 CURL TESTS                              ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    bash test-curl-flow.sh
    ;;
  2)
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                 🎭 PLAYWRIGHT TESTS                          ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    cd frontend || exit 1

    if ! command -v npx &> /dev/null; then
      echo "❌ Node.js is not installed"
      cd ..
      exit 1
    fi

    if [ ! -d "node_modules/@playwright" ]; then
      echo "📦 Installing Playwright..."
      npm install @playwright/test 2>/dev/null
    fi

    echo ""
    echo "Running Playwright tests..."
    echo ""
    npx playwright test ../test-full-flow.spec.ts --reporter=list

    cd ..
    ;;
  3)
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║              👨‍💻 MANUAL TESTING GUIDE                         ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Follow these steps to manually test the feature:"
    echo ""
    echo "1️⃣  Open browser: http://localhost:3000/settings"
    echo "2️⃣  Click tab: 'LLM / IA'"
    echo "3️⃣  Select provider: 'OpenAI (GPT)'"
    echo "4️⃣  Select model: 'gpt-4o'"
    echo "5️⃣  Enter API key: 'sk-test123456789'"
    echo "6️⃣  Click button: 'Enregistrer les clés LLM'"
    echo ""
    echo "✅ Expected Results:"
    echo "   • Green toast appears: '✅ Clés LLM sauvegardées! Provider: OPENAI, Modèle: gpt-4o'"
    echo "   • Toast auto-dismisses after 4 seconds"
    echo "   • API key field shows the entered value"
    echo ""
    echo "7️⃣  Reload page: Press F5 or Ctrl+R"
    echo ""
    echo "✅ Expected After Reload:"
    echo "   • Provider: Still shows 'OpenAI (GPT)'"
    echo "   • Model: Still shows 'gpt-4o'"
    echo "   • API key field: Shows masked value (sk-****...****)"
    echo ""
    echo "🎉 If all above is true, the feature works perfectly!"
    echo ""
    ;;
  4)
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║          📊 IMPLEMENTATION SUMMARY                           ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    if [ -f "COMPLETE_IMPLEMENTATION_SUMMARY.md" ]; then
      cat COMPLETE_IMPLEMENTATION_SUMMARY.md | head -100
      echo ""
      echo "... (use 'cat COMPLETE_IMPLEMENTATION_SUMMARY.md' to see full file)"
    else
      echo "❌ File not found: COMPLETE_IMPLEMENTATION_SUMMARY.md"
    fi
    ;;
  5)
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║              📖 QUICK START GUIDE                            ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    if [ -f "QUICK_START.md" ]; then
      cat QUICK_START.md | head -80
      echo ""
      echo "... (use 'cat QUICK_START.md' to see full file)"
    else
      echo "❌ File not found: QUICK_START.md"
    fi
    ;;
  6)
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                🔄 RUNNING ALL TESTS                          ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""

    # Test 1: CURL
    echo "📍 Test 1/2: CURL Tests..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    bash test-curl-flow.sh 2>&1
    CURL_RESULT=$?
    echo ""

    # Test 2: Playwright (only if available)
    if command -v npx &> /dev/null; then
      echo "📍 Test 2/2: Playwright Tests..."
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      cd frontend || exit 1

      if [ ! -d "node_modules/@playwright" ]; then
        echo "📦 Installing Playwright..."
        npm install @playwright/test 2>/dev/null
      fi

      npx playwright test ../test-full-flow.spec.ts --reporter=list 2>&1
      PLAYWRIGHT_RESULT=$?
      cd ..
    fi

    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                    📊 RESULTS SUMMARY                        ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    if [ "$CURL_RESULT" -eq 0 ]; then
      echo "✅ CURL Tests: PASSED"
    else
      echo "❌ CURL Tests: FAILED (or exited with code $CURL_RESULT)"
    fi

    if [ -z "$PLAYWRIGHT_RESULT" ]; then
      echo "⏭️  Playwright Tests: SKIPPED (Node.js not available)"
    elif [ "$PLAYWRIGHT_RESULT" -eq 0 ]; then
      echo "✅ Playwright Tests: PASSED"
    else
      echo "❌ Playwright Tests: FAILED (or exited with code $PLAYWRIGHT_RESULT)"
    fi
    echo ""
    ;;
  0)
    echo ""
    echo "👋 Goodbye!"
    echo ""
    exit 0
    ;;
  *)
    echo ""
    echo "❌ Invalid option. Please select 0-6"
    echo ""
    ;;
esac

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                  ✅ TEST EXECUTION COMPLETE                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Next Steps:"
echo "  1. Review test results above"
echo "  2. Check for any failures or errors"
echo "  3. Fix issues if any (follow troubleshooting guide in QUICK_START.md)"
echo "  4. Re-run tests to confirm fixes"
echo ""
echo "📚 Documentation:"
echo "  • QUICK_START.md - Quick reference guide"
echo "  • COMPLETE_IMPLEMENTATION_SUMMARY.md - Detailed documentation"
echo "  • COMPLETION_REPORT.md - Final implementation report"
echo ""
