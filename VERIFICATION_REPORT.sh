#!/bin/bash

# ============================================================================
# Verification Report - Frontend Direct API Key Validation
# ============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║        Frontend Direct API Key Validation - Verification Report            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FILES_OK=0
FILES_TOTAL=0

# Check file existence
echo -e "${BLUE}📁 Checking Files...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_file() {
  local file=$1
  local description=$2
  FILES_TOTAL=$((FILES_TOTAL + 1))

  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $description"
    echo "  Path: $file"
    FILES_OK=$((FILES_OK + 1))
  else
    echo -e "${RED}✗${NC} $description"
    echo "  Expected: $file"
  fi
  echo ""
}

check_file "${PROJECT_ROOT}/frontend/utils/api-key-validators.ts" "API Key Validators (NEW)"
check_file "${PROJECT_ROOT}/frontend/pages/settings/index.tsx" "Settings Page (MODIFIED)"
check_file "${PROJECT_ROOT}/FRONTEND_DIRECT_API_VALIDATION.md" "Technical Documentation"
check_file "${PROJECT_ROOT}/QUICK_START_FRONTEND_VALIDATION.md" "Quick Start Guide"
check_file "${PROJECT_ROOT}/scripts/test-frontend-validators.sh" "Test Script"
check_file "${PROJECT_ROOT}/IMPLEMENTATION_SUMMARY.sh" "Implementation Summary"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check validators in TypeScript file
echo -e "${BLUE}🔍 Checking Validators...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

VALIDATORS=(
  "validateGeminiKey"
  "validateOpenAIKey"
  "validateAnthropicKey"
  "validateMistralKey"
  "validateDeepseekKey"
  "validateOpenRouterKey"
  "validateGrokKey"
  "validateApiKey"
)

VALIDATORS_FOUND=0
VALIDATORS_TOTAL=${#VALIDATORS[@]}

for validator in "${VALIDATORS[@]}"; do
  if grep -q "export async function $validator" "${PROJECT_ROOT}/frontend/utils/api-key-validators.ts"; then
    echo -e "${GREEN}✓${NC} $validator"
    VALIDATORS_FOUND=$((VALIDATORS_FOUND + 1))
  else
    echo -e "${RED}✗${NC} $validator not found"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Settings page import
echo -e "${BLUE}📦 Checking Settings Page Integration...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if grep -q "import { validateApiKey }" "${PROJECT_ROOT}/frontend/pages/settings/index.tsx"; then
  echo -e "${GREEN}✓${NC} Import statement found"
else
  echo -e "${RED}✗${NC} Import statement not found"
fi

if grep -q "await validateApiKey(provider, apiKey)" "${PROJECT_ROOT}/frontend/pages/settings/index.tsx"; then
  echo -e "${GREEN}✓${NC} Function call found"
else
  echo -e "${RED}✗${NC} Function call not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
echo -e "${BLUE}📊 Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Files Check:       $FILES_OK / $FILES_TOTAL"
echo "Validators Found:  $VALIDATORS_FOUND / $VALIDATORS_TOTAL"

if [ $FILES_OK -eq $FILES_TOTAL ] && [ $VALIDATORS_FOUND -eq $VALIDATORS_TOTAL ]; then
  echo -e "${GREEN}Overall Status:    ✅ ALL CHECKS PASSED${NC}"
else
  echo -e "${RED}Overall Status:    ❌ SOME CHECKS FAILED${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Next steps
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo ""
echo "1. Start Frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "2. Open Browser:"
echo "   http://localhost:3000/settings"
echo ""
echo "3. Test API Keys:"
echo "   - Go to 'API Keys' tab"
echo "   - Enter Gemini key: AIzaSyB6ZOSlEVDIXpWdMB6zgDvmDiC-3pxPDSw"
echo "   - Click [Test] button"
echo "   - See result: ✅ or ❌"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Verification Complete!${NC}"
echo ""
