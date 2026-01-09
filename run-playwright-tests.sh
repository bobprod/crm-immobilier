#!/bin/bash

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  LLM API Keys E2E Tests${NC}"
echo -e "${BLUE}=====================================${NC}\n"

# Aller au répertoire racine du projet
PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)
cd "$PROJECT_ROOT"

# Vérifier si le frontend est lancé
echo -e "${BLUE}[1/4] Vérifying services...${NC}"
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}✗ Frontend not running on http://localhost:3000${NC}"
    echo -e "${BLUE}Start frontend with: cd frontend && npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend running${NC}"

if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${RED}✗ Backend not running on http://localhost:3001${NC}"
    echo -e "${BLUE}Start backend with: cd backend && npm run start:dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backend running${NC}"

# Installer Playwright si nécessaire
echo -e "\n${BLUE}[2/4] Installing Playwright dependencies...${NC}"
if ! command -v npx &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

# Installer les dépendances Playwright
npx playwright install --with-deps 2>&1 | tail -5

echo -e "\n${BLUE}[3/4] Running API Keys tests...${NC}"
echo -e "${BLUE}Tests location: ${PROJECT_ROOT}/tests/llm-api-keys-e2e.spec.ts${NC}\n"

# Lancer les tests Playwright
npx playwright test tests/llm-api-keys-e2e.spec.ts --headed --reporter=html

TEST_RESULT=$?

echo -e "\n${BLUE}[4/4] Test Summary${NC}"
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo -e "${BLUE}View detailed report: npx playwright show-report${NC}"
else
    echo -e "${RED}✗ Some tests failed. Check output above.${NC}"
    echo -e "${BLUE}For debugging:${NC}"
    echo -e "  - Use --debug flag: npx playwright test tests/llm-api-keys-e2e.spec.ts --debug"
    echo -e "  - View traces: npx playwright show-trace"
fi

echo ""
exit $TEST_RESULT
