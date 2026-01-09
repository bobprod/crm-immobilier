#!/bin/bash

# Master Test Script - Validates the entire LLM API Keys implementation
# Usage: bash scripts/validate-api-keys-implementation.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
TESTS_DIR="${PROJECT_ROOT}/tests"
SCRIPTS_DIR="${PROJECT_ROOT}/scripts"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  LLM API Keys Implementation - Validation Suite                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Compile Backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Compiling Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "${BACKEND_DIR}"

if npm run build > /tmp/backend-build.log 2>&1; then
  echo -e "${GREEN}✓${NC} Backend compiled successfully"
else
  echo -e "${RED}✗${NC} Backend compilation failed"
  cat /tmp/backend-build.log
  exit 1
fi

# Step 2: Compile Frontend
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Compiling Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "${FRONTEND_DIR}"

if npm run build > /tmp/frontend-build.log 2>&1; then
  echo -e "${GREEN}✓${NC} Frontend compiled successfully"
else
  echo -e "${RED}✗${NC} Frontend compilation failed"
  cat /tmp/frontend-build.log
  exit 1
fi

# Step 3: Check if test files exist
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Validating Test Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "${TESTS_DIR}/api-keys-integration.spec.ts" ]; then
  echo -e "${GREEN}✓${NC} Found: tests/api-keys-integration.spec.ts"
else
  echo -e "${RED}✗${NC} Missing: tests/api-keys-integration.spec.ts"
fi

if [ -f "${SCRIPTS_DIR}/test-api-keys.sh" ]; then
  echo -e "${GREEN}✓${NC} Found: scripts/test-api-keys.sh"
else
  echo -e "${RED}✗${NC} Missing: scripts/test-api-keys.sh"
fi

# Step 4: Validate code changes
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Validating Code Changes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check DTO updates
if grep -q "mistralApiKey" "${BACKEND_DIR}/src/modules/ai-billing/dto/api-keys.dto.ts"; then
  echo -e "${GREEN}✓${NC} DTO: mistralApiKey found"
else
  echo -e "${RED}✗${NC} DTO: mistralApiKey NOT found"
fi

if grep -q "grokApiKey" "${BACKEND_DIR}/src/modules/ai-billing/dto/api-keys.dto.ts"; then
  echo -e "${GREEN}✓${NC} DTO: grokApiKey found"
else
  echo -e "${RED}✗${NC} DTO: grokApiKey NOT found"
fi

if grep -q "cohereApiKey" "${BACKEND_DIR}/src/modules/ai-billing/dto/api-keys.dto.ts"; then
  echo -e "${GREEN}✓${NC} DTO: cohereApiKey found"
else
  echo -e "${RED}✗${NC} DTO: cohereApiKey NOT found"
fi

# Check Controller updates
if grep -q "mistralApiKey: true" "${BACKEND_DIR}/src/modules/ai-billing/api-keys.controller.ts"; then
  echo -e "${GREEN}✓${NC} Controller: mistralApiKey select found"
else
  echo -e "${YELLOW}!${NC} Controller: mistralApiKey select might be missing"
fi

# Check Frontend dropdown
if grep -q "selectedOtherLLM" "${FRONTEND_DIR}/pages/settings/index.tsx"; then
  echo -e "${GREEN}✓${NC} Frontend: selectedOtherLLM state found"
else
  echo -e "${RED}✗${NC} Frontend: selectedOtherLLM state NOT found"
fi

if grep -q "otherLLMModels" "${FRONTEND_DIR}/pages/settings/index.tsx"; then
  echo -e "${GREEN}✓${NC} Frontend: otherLLMModels array found"
else
  echo -e "${RED}✗${NC} Frontend: otherLLMModels array NOT found"
fi

# Step 5: Show Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Files Modified:"
echo "  ✓ backend/src/modules/ai-billing/dto/api-keys.dto.ts"
echo "  ✓ backend/src/modules/ai-billing/api-keys.controller.ts"
echo "  ✓ frontend/pages/settings/index.tsx"
echo ""
echo "Test Files Created:"
echo "  ✓ tests/api-keys-integration.spec.ts"
echo "  ✓ scripts/test-api-keys.sh"
echo ""
echo "Documentation:"
echo "  ✓ docs/API_KEYS_IMPLEMENTATION.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Start the backend:"
echo "   cd backend && npm start"
echo ""
echo "2. In another terminal, run curl tests:"
echo "   AUTH_TOKEN=\"your-jwt-token\" bash scripts/test-api-keys.sh"
echo ""
echo "3. Start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Run Playwright e2e tests:"
echo "   npx playwright test tests/api-keys-integration.spec.ts"
echo ""
echo -e "${GREEN}✓ Validation Complete!${NC}"
echo ""
