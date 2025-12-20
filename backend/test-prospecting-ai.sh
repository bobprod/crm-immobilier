#!/bin/bash

# Script de test automatisé pour les modules AI Orchestrator et Prospecting AI
# Usage: ./test-prospecting-ai.sh [TOKEN]

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
TOKEN="${1}"

echo -e "${GREEN}=== Test des Modules AI Orchestrator & Prospecting AI ===${NC}\n"

# Vérifier si le token est fourni
if [ -z "$TOKEN" ]; then
  echo -e "${RED}Erreur: Token JWT manquant${NC}"
  echo "Usage: $0 <JWT_TOKEN>"
  echo ""
  echo "Pour obtenir un token:"
  echo "  curl -X POST $API_URL/api/auth/login \\"
  echo "    -H 'Content-Type: application/json' \\"
  echo "    -d '{\"email\": \"test@example.com\", \"password\": \"password\"}'"
  exit 1
fi

echo -e "${YELLOW}API URL: $API_URL${NC}"
echo -e "${YELLOW}Token: ${TOKEN:0:20}...${NC}\n"

# Fonction pour tester un endpoint
test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected_status="$5"

  echo -e "${YELLOW}Test: $name${NC}"

  if [ "$method" == "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN")
  else
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$status" == "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $status"
    echo "$body" | jq -C '.' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}✗ FAIL${NC} - Expected: $expected_status, Got: $status"
    echo "$body"
  fi

  echo ""
}

# Test 1: API Health
echo -e "${GREEN}=== 1. Test API Health ===${NC}\n"
test_endpoint "API Root" "GET" "/api" "" "200"

# Test 2: AI Orchestrator
echo -e "${GREEN}=== 2. Test AI Orchestrator ===${NC}\n"
orchestration_data='{
  "objective": "prospection",
  "context": {
    "zone": "Paris 15",
    "targetType": "VENDEURS",
    "maxResults": 3
  },
  "options": {
    "executionMode": "auto",
    "maxCost": 1
  }
}'

echo -e "${YELLOW}Lancement de l'orchestration...${NC}"
orchestration_response=$(curl -s -X POST "$API_URL/api/ai/orchestrate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$orchestration_data")

echo "$orchestration_response" | jq -C '.' 2>/dev/null || echo "$orchestration_response"
echo ""

# Test 3: Prospecting AI - Start
echo -e "${GREEN}=== 3. Test Prospecting AI - Start ===${NC}\n"
prospection_data='{
  "zone": "Paris 15",
  "targetType": "VENDEURS",
  "propertyType": "APPARTEMENT",
  "maxLeads": 5,
  "options": {
    "engine": "internal",
    "maxCost": 2
  }
}'

echo -e "${YELLOW}Lancement de la prospection...${NC}"
prospection_response=$(curl -s -X POST "$API_URL/api/prospecting-ai/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$prospection_data")

echo "$prospection_response" | jq -C '.' 2>/dev/null || echo "$prospection_response"

# Extraire le prospectionId
prospection_id=$(echo "$prospection_response" | jq -r '.prospectionId' 2>/dev/null)

if [ "$prospection_id" != "null" ] && [ -n "$prospection_id" ]; then
  echo -e "\n${GREEN}Prospection ID: $prospection_id${NC}\n"

  # Test 4: Get Result
  echo -e "${GREEN}=== 4. Test Prospecting AI - Get Result ===${NC}\n"
  test_endpoint "Récupération du résultat" "GET" "/api/prospecting-ai/$prospection_id" "" "200"

  # Test 5: Export JSON
  echo -e "${GREEN}=== 5. Test Prospecting AI - Export JSON ===${NC}\n"
  echo -e "${YELLOW}Export JSON...${NC}"
  curl -s "$API_URL/api/prospecting-ai/$prospection_id/export?format=json" \
    -H "Authorization: Bearer $TOKEN" \
    -o "prospection-$prospection_id.json"

  if [ -f "prospection-$prospection_id.json" ]; then
    echo -e "${GREEN}✓ Fichier créé: prospection-$prospection_id.json${NC}"
    cat "prospection-$prospection_id.json" | jq -C '.' 2>/dev/null || cat "prospection-$prospection_id.json"
  else
    echo -e "${RED}✗ Erreur: fichier non créé${NC}"
  fi
  echo ""

  # Test 6: Export CSV
  echo -e "${GREEN}=== 6. Test Prospecting AI - Export CSV ===${NC}\n"
  echo -e "${YELLOW}Export CSV...${NC}"
  curl -s "$API_URL/api/prospecting-ai/$prospection_id/export?format=csv" \
    -H "Authorization: Bearer $TOKEN" \
    -o "prospection-$prospection_id.csv"

  if [ -f "prospection-$prospection_id.csv" ]; then
    echo -e "${GREEN}✓ Fichier créé: prospection-$prospection_id.csv${NC}"
    head -n 5 "prospection-$prospection_id.csv"
  else
    echo -e "${RED}✗ Erreur: fichier non créé${NC}"
  fi
  echo ""

  # Test 7: Convert to Prospects
  echo -e "${GREEN}=== 7. Test Prospecting AI - Convert to Prospects ===${NC}\n"
  test_endpoint "Conversion en prospects CRM" "POST" "/api/prospecting-ai/$prospection_id/convert-to-prospects" "" "200"
else
  echo -e "${YELLOW}Prospection ID non disponible, tests 4-7 ignorés${NC}\n"
fi

# Test 8: Validation - Zone vide (doit échouer)
echo -e "${GREEN}=== 8. Test Validation - Zone vide ===${NC}\n"
invalid_data='{
  "zone": "",
  "targetType": "VENDEURS"
}'
test_endpoint "Zone vide (doit échouer avec 400)" "POST" "/api/prospecting-ai/start" "$invalid_data" "400"

# Test 9: Validation - maxLeads trop élevé (doit échouer)
echo -e "${GREEN}=== 9. Test Validation - maxLeads > 100 ===${NC}\n"
invalid_data2='{
  "zone": "Paris",
  "targetType": "VENDEURS",
  "maxLeads": 500
}'
test_endpoint "maxLeads trop élevé (doit échouer avec 400)" "POST" "/api/prospecting-ai/start" "$invalid_data2" "400"

# Test 10: Métriques
echo -e "${GREEN}=== 10. Test Métriques AI ===${NC}\n"
test_endpoint "Statistiques d'utilisation" "GET" "/api/ai-metrics/stats" "" "200"

# Résumé
echo -e "${GREEN}=== Résumé ===${NC}\n"
echo -e "${GREEN}✓ Tests terminés${NC}"
echo ""

if [ -n "$prospection_id" ]; then
  echo "Fichiers générés:"
  echo "  - prospection-$prospection_id.json"
  echo "  - prospection-$prospection_id.csv"
  echo ""
fi

echo "Pour voir les métriques détaillées:"
echo "  curl -H 'Authorization: Bearer \$TOKEN' $API_URL/api/ai-metrics/history"
echo ""
echo "Pour voir l'historique des orchestrations:"
echo "  npx prisma studio"
echo "  → Table: ai_orchestrations"
