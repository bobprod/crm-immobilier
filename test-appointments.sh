#!/bin/bash

# ============================================
# Script de test pour le module Appointments
# ============================================

echo "=================================================="
echo "🧪 TESTS DU MODULE APPOINTMENTS"
echo "=================================================="
echo ""

# Couleurs pour les logs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# ============================================
# CONFIGURATION
# ============================================

API_URL="${API_URL:-http://localhost:3001/api}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo -e "${BLUE}Configuration:${NC}"
echo "  API URL: $API_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo ""

# ============================================
# VÉRIFICATION DES SERVICES
# ============================================

check_service() {
    local url=$1
    local name=$2

    echo -n "Vérification $name... "

    if curl -s -f -o /dev/null "$url"; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ ERREUR${NC}"
        return 1
    fi
}

echo "=================================================="
echo "🔍 Vérification des services"
echo "=================================================="

check_service "$API_URL/health" "Backend API"
backend_status=$?

check_service "$FRONTEND_URL" "Frontend"
frontend_status=$?

if [ $backend_status -ne 0 ]; then
    echo -e "${RED}⚠️  Backend non disponible. Certains tests échoueront.${NC}"
fi

echo ""

# ============================================
# TESTS JEST (CRUD)
# ============================================

echo "=================================================="
echo "🧪 Tests CRUD (Jest)"
echo "=================================================="

if [ -f "tests/appointments/appointments-crud.test.ts" ]; then
    echo "Lancement des tests CRUD..."

    # Exécuter les tests Jest
    npx jest tests/appointments/appointments-crud.test.ts --verbose --colors

    jest_status=$?

    if [ $jest_status -eq 0 ]; then
        echo -e "${GREEN}✅ Tests CRUD réussis${NC}"
    else
        echo -e "${RED}❌ Tests CRUD échoués${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Fichier de tests CRUD non trouvé${NC}"
fi

echo ""

# ============================================
# TESTS PLAYWRIGHT (E2E)
# ============================================

echo "=================================================="
echo "🎭 Tests E2E (Playwright)"
echo "=================================================="

if [ -f "tests/appointments/appointments-e2e.spec.ts" ]; then
    echo "Lancement des tests E2E..."

    # Vérifier si Playwright est installé
    if command -v npx &> /dev/null; then
        # Exécuter les tests Playwright
        npx playwright test tests/appointments/appointments-e2e.spec.ts --reporter=list

        playwright_status=$?

        if [ $playwright_status -eq 0 ]; then
            echo -e "${GREEN}✅ Tests E2E réussis${NC}"
        else
            echo -e "${RED}❌ Tests E2E échoués${NC}"
        fi

        # Générer le rapport HTML
        echo ""
        echo "Génération du rapport HTML..."
        npx playwright show-report
    else
        echo -e "${YELLOW}⚠️  Playwright non installé. Installation...${NC}"
        npm install -D @playwright/test
        npx playwright install
    fi
else
    echo -e "${YELLOW}⚠️  Fichier de tests E2E non trouvé${NC}"
fi

echo ""

# ============================================
# TESTS MANUELS (API)
# ============================================

echo "=================================================="
echo "🔧 Tests manuels API"
echo "=================================================="

if [ $backend_status -eq 0 ]; then
    echo "Test de création d'un rendez-vous..."

    # Créer un rendez-vous de test
    START_TIME=$(date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%S.000Z")
    END_TIME=$(date -u -d "+1 day +1 hour" +"%Y-%m-%dT%H:%M:%S.000Z")

    CREATE_RESPONSE=$(curl -s -X POST "$API_URL/appointments" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"Test Appointment - $(date +%s)\",
            \"type\": \"visit\",
            \"priority\": \"medium\",
            \"startTime\": \"$START_TIME\",
            \"endTime\": \"$END_TIME\"
        }")

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Création réussie${NC}"
        echo "Réponse: $CREATE_RESPONSE"

        # Extraire l'ID si possible
        APPOINTMENT_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

        if [ ! -z "$APPOINTMENT_ID" ]; then
            echo ""
            echo "Test de récupération du rendez-vous..."

            GET_RESPONSE=$(curl -s "$API_URL/appointments/$APPOINTMENT_ID")

            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Récupération réussie${NC}"
                echo "Réponse: $GET_RESPONSE"
            else
                echo -e "${RED}❌ Erreur de récupération${NC}"
            fi

            echo ""
            echo "Test de suppression du rendez-vous..."

            DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/appointments/$APPOINTMENT_ID")

            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Suppression réussie${NC}"
            else
                echo -e "${RED}❌ Erreur de suppression${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ Erreur de création${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Backend non disponible, tests API ignorés${NC}"
fi

echo ""

# ============================================
# RÉSUMÉ
# ============================================

echo "=================================================="
echo "📊 RÉSUMÉ DES TESTS"
echo "=================================================="

total_tests=0
passed_tests=0
failed_tests=0

if [ -f "tests/appointments/appointments-crud.test.ts" ]; then
    total_tests=$((total_tests + 1))
    if [ $jest_status -eq 0 ]; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
fi

if [ -f "tests/appointments/appointments-e2e.spec.ts" ]; then
    total_tests=$((total_tests + 1))
    if [ $playwright_status -eq 0 ]; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
fi

echo "Total de suites de tests: $total_tests"
echo -e "${GREEN}✅ Réussis: $passed_tests${NC}"
echo -e "${RED}❌ Échoués: $failed_tests${NC}"

echo ""

if [ $failed_tests -eq 0 ] && [ $total_tests -gt 0 ]; then
    echo -e "${GREEN}🎉 Tous les tests sont passés avec succès!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Certains tests ont échoué${NC}"
    exit 1
fi
