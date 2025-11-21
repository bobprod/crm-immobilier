#!/bin/bash

# Script de test des endpoints qui ont échoué précédemment
# Ce script teste uniquement les 5 APIs qui ont rencontré des erreurs

# Configuration
API_URL="http://localhost:3001/api"
TOKEN=""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TOTAL=0
SUCCESS=0
FAILED=0

# Fonction pour tester un endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4

    TOTAL=$((TOTAL + 1))
    echo -e "\n${YELLOW}Test $TOTAL: $description${NC}"
    echo "  → $method $endpoint"

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✓ SUCCESS${NC} (HTTP $http_code)"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "  ${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo -e "  ${RED}Response: $body${NC}"
        FAILED=$((FAILED + 1))
    fi
}

echo "=========================================="
echo "  Test des Endpoints Précédemment Échoués"
echo "=========================================="

# Vérifier que le serveur est accessible
echo -e "\n${YELLOW}Vérification de la disponibilité du serveur...${NC}"
if ! curl -s -f "$API_URL" > /dev/null 2>&1; then
    echo -e "${RED}Erreur: Le serveur n'est pas accessible à $API_URL${NC}"
    echo "Assurez-vous que le backend NestJS est démarré avec 'npm run start:dev'"
    exit 1
fi
echo -e "${GREEN}✓ Serveur accessible${NC}"

# Login pour obtenir le token
echo -e "\n${YELLOW}Connexion pour obtenir le token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Password123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Erreur: Impossible d'obtenir le token d'authentification${NC}"
    echo "Réponse: $LOGIN_RESPONSE"
    echo ""
    echo "Assurez-vous qu'un utilisateur avec les identifiants suivants existe:"
    echo "  Email: test@example.com"
    echo "  Password: Password123!"
    exit 1
fi

echo -e "${GREEN}✓ Token obtenu${NC}"

# ==========================================
# TESTS DES ENDPOINTS ÉCHOUÉS
# ==========================================

echo -e "\n=========================================="
echo "  1. POST /tasks - Validation Status"
echo "=========================================="

test_endpoint "POST" "/tasks" '{
  "title": "Tâche de test fixée",
  "description": "Test après correction du statut",
  "status": "todo",
  "priority": "high",
  "dueDate": "2025-12-31"
}' "Créer une tâche avec status valide"

echo -e "\n=========================================="
echo "  2. GET /dashboard/stats - Error Handling"
echo "=========================================="

test_endpoint "GET" "/dashboard/stats" "" "Obtenir les statistiques du dashboard"

echo -e "\n=========================================="
echo "  3. GET /vitrine/config - Module Import"
echo "=========================================="

test_endpoint "GET" "/vitrine/config" "" "Obtenir la configuration vitrine"

echo -e "\n=========================================="
echo "  4. GET /vitrine/published-properties"
echo "=========================================="

test_endpoint "GET" "/vitrine/published-properties" "" "Obtenir les propriétés publiées"

echo -e "\n=========================================="
echo "  5. GET /vitrine/analytics"
echo "=========================================="

test_endpoint "GET" "/vitrine/analytics" "" "Obtenir les analytics vitrine"

# ==========================================
# RÉSUMÉ
# ==========================================

echo ""
echo "=========================================="
echo "           RÉSUMÉ DES TESTS"
echo "=========================================="
echo -e "Total:   $TOTAL tests"
echo -e "${GREEN}Succès:  $SUCCESS${NC}"
echo -e "${RED}Échecs:  $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Tous les tests sont passés avec succès!${NC}"
    echo "Les corrections apportées ont résolu tous les problèmes:"
    echo "  ✓ Validation du statut des tâches (todo/in_progress/done)"
    echo "  ✓ Gestion d'erreur robuste dans dashboard.service.ts"
    echo "  ✓ Import du VitrineModule dans app.module.ts"
    exit 0
else
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($SUCCESS/$TOTAL)*100}")
    echo -e "\n${YELLOW}Taux de réussite: $SUCCESS_RATE%${NC}"
    exit 1
fi
