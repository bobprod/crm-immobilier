#!/bin/bash

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================"
echo -e "LLM API Keys Implementation Diagnostic${NC}"
echo -e "${BLUE}========================================\n${NC}"

ERRORS=0
WARNINGS=0

# 1. Vérifier le schéma Prisma
echo -e "${BLUE}[1] Vérification du schéma Prisma...${NC}"
SCHEMA_FILE="backend/prisma/schema.prisma"
if [ -f "$SCHEMA_FILE" ]; then
    for field in mistralApiKey grokApiKey cohereApiKey togetherAiApiKey replicateApiKey perplexityApiKey huggingfaceApiKey alephAlphaApiKey nlpCloudApiKey; do
        if grep -q "$field" "$SCHEMA_FILE"; then
            echo -e "${GREEN}✓${NC} Found $field in schema"
        else
            echo -e "${RED}✗${NC} Missing $field in schema"
            ((ERRORS++))
        fi
    done
else
    echo -e "${RED}✗${NC} Schema file not found: $SCHEMA_FILE"
    ((ERRORS++))
fi

# 2. Vérifier le contrôleur backend
echo -e "\n${BLUE}[2] Vérification du contrôleur API...${NC}"
CONTROLLER_FILE="backend/src/modules/ai-billing/api-keys.controller.ts"
if [ -f "$CONTROLLER_FILE" ]; then
    for field in mistralApiKey grokApiKey cohereApiKey togetherAiApiKey replicateApiKey perplexityApiKey huggingfaceApiKey alephAlphaApiKey nlpCloudApiKey; do
        if grep -q "$field" "$CONTROLLER_FILE"; then
            echo -e "${GREEN}✓${NC} Found $field in controller"
        else
            echo -e "${RED}✗${NC} Missing $field in controller"
            ((ERRORS++))
        fi
    done
else
    echo -e "${RED}✗${NC} Controller file not found: $CONTROLLER_FILE"
    ((ERRORS++))
fi

# 3. Vérifier le DTO backend
echo -e "\n${BLUE}[3] Vérification des DTOs...${NC}"
DTO_FILE="backend/src/modules/ai-billing/dto/api-keys.dto.ts"
if [ -f "$DTO_FILE" ]; then
    for field in mistralApiKey grokApiKey cohereApiKey togetherAiApiKey replicateApiKey perplexityApiKey huggingfaceApiKey alephAlphaApiKey nlpCloudApiKey; do
        if grep -q "$field" "$DTO_FILE"; then
            echo -e "${GREEN}✓${NC} Found $field in DTO"
        else
            echo -e "${RED}✗${NC} Missing $field in DTO"
            ((ERRORS++))
        fi
    done
else
    echo -e "${RED}✗${NC} DTO file not found: $DTO_FILE"
    ((ERRORS++))
fi

# 4. Vérifier le composant frontend
echo -e "\n${BLUE}[4] Vérification du composant frontend...${NC}"
FRONTEND_FILE="frontend/src/pages/settings/ai-api-keys.tsx"
if [ -f "$FRONTEND_FILE" ]; then
    echo -e "${GREEN}✓${NC} API Keys page found"

    # Vérifier les interface type
    if grep -q "mistralApiKey\?" "$FRONTEND_FILE"; then
        echo -e "${GREEN}✓${NC} Found mistralApiKey in interface"
    else
        echo -e "${YELLOW}⚠${NC} Missing mistralApiKey in interface"
    fi

    # Vérifier les inputs
    for field in mistralApiKey grokApiKey cohereApiKey togetherAiApiKey replicateApiKey perplexityApiKey huggingfaceApiKey alephAlphaApiKey nlpCloudApiKey; do
        if grep -q "input#${field}\|id=${field}" "$FRONTEND_FILE"; then
            echo -e "${GREEN}✓${NC} Found input for $field"
        else
            echo -e "${RED}✗${NC} Missing input for $field"
            ((ERRORS++))
        fi
    done
else
    echo -e "${RED}✗${NC} Frontend file not found: $FRONTEND_FILE"
    ((ERRORS++))
fi

# 5. Vérifier la migration Prisma
echo -e "\n${BLUE}[5] Vérification de la migration Prisma...${NC}"
MIGRATION_FILE="backend/prisma/migrations/20260109_add_llm_api_keys/migration.sql"
if [ -f "$MIGRATION_FILE" ]; then
    echo -e "${GREEN}✓${NC} Migration file found"

    for field in mistralApiKey grokApiKey cohereApiKey togetherAiApiKey replicateApiKey perplexityApiKey huggingfaceApiKey alephAlphaApiKey nlpCloudApiKey; do
        if grep -q "$field" "$MIGRATION_FILE"; then
            echo -e "${GREEN}✓${NC} Found ALTER for $field"
        else
            echo -e "${YELLOW}⚠${NC} Missing ALTER for $field"
        fi
    done
else
    echo -e "${RED}✗${NC} Migration file not found: $MIGRATION_FILE"
    ((ERRORS++))
fi

# 6. Vérifier les tests
echo -e "\n${BLUE}[6] Vérification des tests...${NC}"
TEST_FILE="tests/llm-api-keys-e2e.spec.ts"
if [ -f "$TEST_FILE" ]; then
    echo -e "${GREEN}✓${NC} E2E test file found"

    # Vérifier les sélecteurs
    if grep -q "input#mistralApiKey" "$TEST_FILE"; then
        echo -e "${GREEN}✓${NC} Found correct selectors in tests"
    else
        echo -e "${YELLOW}⚠${NC} Verify selectors in tests"
    fi
else
    echo -e "${RED}✗${NC} Test file not found: $TEST_FILE"
    ((ERRORS++))
fi

# Résumé
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}RÉSUMÉ:${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    echo -e "1. Start backend:  cd backend && npm run start:dev"
    echo -e "2. Start frontend: cd frontend && npm run dev"
    echo -e "3. Run tests:      ./run-playwright-tests.sh (or .bat on Windows)"
else
    echo -e "${RED}✗ $ERRORS errors found - Fix them before running tests${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warnings${NC}"
fi

echo ""
exit $ERRORS
