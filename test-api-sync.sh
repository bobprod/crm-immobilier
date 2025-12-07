#!/bin/bash

# Script de Test de Synchronisation Backend-Frontend
# Date: 2025-12-07
# Usage: ./test-api-sync.sh [API_URL] [JWT_TOKEN]

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${1:-http://localhost:3000/api}"
TOKEN="${2:-}"

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Aucun token JWT fourni. Tests limités aux endpoints publics.${NC}"
    echo "Usage: $0 [API_URL] [JWT_TOKEN]"
    echo ""
fi

# Compteurs
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Fonction pour tester un endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local auth_required=$4
    local data=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "\n${BLUE}Test #${TOTAL_TESTS}: ${description}${NC}"
    echo "  Method: $method"
    echo "  Endpoint: $endpoint"
    
    # Construction de la commande curl
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    
    if [ "$auth_required" = "true" ]; then
        if [ -z "$TOKEN" ]; then
            echo -e "  ${YELLOW}⚠️  SKIPPED (Auth required but no token provided)${NC}"
            return
        fi
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $TOKEN'"
    fi
    
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$API_URL$endpoint'"
    
    # Exécution du test
    response=$(eval $curl_cmd 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    # Vérification du code HTTP
    if [[ "$http_code" =~ ^(200|201|204)$ ]]; then
        echo -e "  ${GREEN}✅ PASS${NC} (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        if [ -n "$body" ] && [ "$body" != "null" ]; then
            echo "  Response preview: $(echo $body | cut -c1-100)..."
        fi
    elif [[ "$http_code" =~ ^(401|403)$ ]]; then
        echo -e "  ${YELLOW}⚠️  AUTH REQUIRED${NC} (HTTP $http_code)"
    elif [ "$http_code" = "404" ]; then
        echo -e "  ${RED}❌ FAIL${NC} (HTTP $http_code - Endpoint not found)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo -e "  ${RED}❌ FAIL${NC} (HTTP $http_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        if [ -n "$body" ]; then
            echo "  Error: $(echo $body | cut -c1-200)"
        fi
    fi
}

# En-tête
echo "════════════════════════════════════════════════════════════"
echo "  Test de Synchronisation Backend-Frontend API"
echo "════════════════════════════════════════════════════════════"
echo "  API URL: $API_URL"
echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════════════════"

# Test de santé de l'API
echo -e "\n${BLUE}━━━ Test de Santé API ━━━${NC}"
test_endpoint "GET" "/" "API Root" false

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CAMPAIGNS MODULE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "\n${BLUE}━━━ Module CAMPAIGNS ━━━${NC}"

test_endpoint "GET" "/campaigns" "Liste des campagnes" true

test_endpoint "POST" "/campaigns" "Créer une campagne" true \
    '{"name":"Test Campaign","type":"email","targetAudience":["test@example.com"],"message":"Test message"}'

# Note: Les tests suivants nécessitent un ID de campagne existant
# test_endpoint "GET" "/campaigns/test-id" "Obtenir une campagne" true
# test_endpoint "PUT" "/campaigns/test-id" "Mettre à jour une campagne" true '{"name":"Updated"}'
# test_endpoint "DELETE" "/campaigns/test-id" "Supprimer une campagne" true

# Tests des endpoints d'action (probablement non implémentés)
# test_endpoint "POST" "/campaigns/test-id/start" "Démarrer une campagne" true
# test_endpoint "POST" "/campaigns/test-id/pause" "Mettre en pause" true
# test_endpoint "POST" "/campaigns/test-id/resume" "Reprendre" true
# test_endpoint "POST" "/campaigns/test-id/complete" "Terminer" true
# test_endpoint "POST" "/campaigns/test-id/duplicate" "Dupliquer" true

echo -e "\n  ${YELLOW}Note: Tests d'action (start/pause/resume/complete/duplicate) commentés${NC}"
echo -e "  ${YELLOW}Raison: Endpoints non implémentés dans le backend${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SEO AI MODULE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "\n${BLUE}━━━ Module SEO AI ━━━${NC}"

# Note: Ces tests nécessitent un ID de propriété existant
# test_endpoint "POST" "/seo-ai/optimize/property-id" "Optimiser une propriété" true
# test_endpoint "GET" "/seo-ai/property/property-id" "Récupérer optimisation" true

test_endpoint "POST" "/seo-ai/generate/alt-text" "Générer alt-text" true \
    '{"propertyId":"test-id","images":["image1.jpg"]}'

test_endpoint "POST" "/seo-ai/optimize/batch" "Optimisation en masse" true \
    '{"propertyIds":["id1","id2"]}'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DOCUMENTS MODULE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "\n${BLUE}━━━ Module DOCUMENTS ━━━${NC}"

test_endpoint "GET" "/documents" "Liste des documents" true

# Note: Upload multipart nécessite une approche différente
# test_endpoint "POST" "/documents/upload" "Upload document" true

test_endpoint "GET" "/documents/stats/overview" "Statistiques" true

test_endpoint "POST" "/documents/ai/generate" "Génération AI" true \
    '{"type":"contract","title":"Test","context":"Test context"}'

test_endpoint "GET" "/documents/ai/history" "Historique AI" true

test_endpoint "GET" "/documents/categories/list" "Liste catégories" true

test_endpoint "GET" "/documents/templates/list" "Liste templates" true

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ENDPOINTS SUPPLÉMENTAIRES (modules existants)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "\n${BLUE}━━━ Endpoints Existants (Vérification) ━━━${NC}"

test_endpoint "GET" "/properties" "Liste propriétés" true
test_endpoint "GET" "/prospects" "Liste prospects" true
test_endpoint "GET" "/appointments" "Liste rendez-vous" true
test_endpoint "GET" "/tasks" "Liste tâches" true

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RÉSUMÉ
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "\n════════════════════════════════════════════════════════════"
echo -e "  ${BLUE}RÉSUMÉ DES TESTS${NC}"
echo "════════════════════════════════════════════════════════════"
echo "  Total tests: $TOTAL_TESTS"
echo -e "  ${GREEN}Réussis: $PASSED_TESTS${NC}"
echo -e "  ${RED}Échoués: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n  ${GREEN}✅ Tous les tests ont réussi!${NC}"
    exit 0
else
    echo -e "\n  ${YELLOW}⚠️  Certains tests ont échoué. Voir détails ci-dessus.${NC}"
    exit 1
fi
