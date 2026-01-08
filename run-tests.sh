#!/bin/bash

# Script pour exécuter les tests E2E dans Docker
# Usage: ./run-tests.sh [options]
# Options:
#   --build    : Force rebuild des images Docker
#   --clean    : Nettoyer l'environnement après les tests
#   --headed   : Exécuter les tests avec l'interface graphique
#   --debug    : Exécuter les tests en mode debug

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
BUILD_FLAG=""
CLEAN_FLAG=false
PLAYWRIGHT_ARGS=""

# Parser les arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --build) BUILD_FLAG="--build" ;;
        --clean) CLEAN_FLAG=true ;;
        --headed) PLAYWRIGHT_ARGS="$PLAYWRIGHT_ARGS --headed" ;;
        --debug) PLAYWRIGHT_ARGS="$PLAYWRIGHT_ARGS --debug" ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${BLUE}🐳 CRM Immobilier - Test Environment${NC}"
echo "========================================"

# 1. Démarrer les services de test
echo -e "\n${YELLOW}📦 Starting test services...${NC}"
docker-compose -f docker-compose.test.yml up -d $BUILD_FLAG db-test backend-test frontend-test

# 2. Attendre que les services soient prêts
echo -e "\n${YELLOW}⏳ Waiting for services to be ready...${NC}"

# Attendre la base de données
echo -n "   - Database... "
until docker-compose -f docker-compose.test.yml exec -T db-test pg_isready -U crm_test_user -d crm_test > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✓${NC}"

# Attendre le backend
echo -n "   - Backend... "
max_retries=30
retry_count=0
until curl -f http://localhost:3002/api/health > /dev/null 2>&1; do
    retry_count=$((retry_count + 1))
    if [ $retry_count -ge $max_retries ]; then
        echo -e "${RED}✗ Timeout${NC}"
        echo -e "${RED}❌ Backend failed to start${NC}"
        docker-compose -f docker-compose.test.yml logs backend-test
        exit 1
    fi
    sleep 2
done
echo -e "${GREEN}✓${NC}"

# Attendre le frontend
echo -n "   - Frontend... "
retry_count=0
until curl -f http://localhost:3003 > /dev/null 2>&1; do
    retry_count=$((retry_count + 1))
    if [ $retry_count -ge $max_retries ]; then
        echo -e "${RED}✗ Timeout${NC}"
        echo -e "${RED}❌ Frontend failed to start${NC}"
        docker-compose -f docker-compose.test.yml logs frontend-test
        exit 1
    fi
    sleep 2
done
echo -e "${GREEN}✓${NC}"

# 3. Seed de la base de données
echo -e "\n${YELLOW}🌱 Seeding test database...${NC}"
docker-compose -f docker-compose.test.yml exec -T backend-test npm run seed:test

# 4. Exécuter les tests Playwright
echo -e "\n${YELLOW}🎭 Running Playwright tests...${NC}"
docker-compose -f docker-compose.test.yml run --rm playwright-test npx playwright test $PLAYWRIGHT_ARGS

TEST_EXIT_CODE=$?

# 5. Afficher les résultats
echo -e "\n${BLUE}📊 Test Results${NC}"
echo "========================================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed (exit code: $TEST_EXIT_CODE)${NC}"
fi

# 6. Générer le rapport HTML
echo -e "\n${YELLOW}📄 Generating test report...${NC}"
docker-compose -f docker-compose.test.yml run --rm playwright-test npx playwright show-report --host 0.0.0.0 || true

# 7. Nettoyer si demandé
if [ "$CLEAN_FLAG" = true ]; then
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    docker-compose -f docker-compose.test.yml down -v
    echo -e "${GREEN}✓ Cleanup completed${NC}"
else
    echo -e "\n${BLUE}💡 Tip: Use --clean to remove containers after tests${NC}"
    echo -e "${BLUE}💡 Logs available with: docker-compose -f docker-compose.test.yml logs${NC}"
fi

exit $TEST_EXIT_CODE
