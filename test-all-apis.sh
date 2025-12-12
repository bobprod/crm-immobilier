#!/bin/bash

echo "======================================"
echo "🧪 TEST DE TOUS LES ENDPOINTS API"
echo "======================================"
echo ""

BASE_URL="http://localhost:3001/api"
ORIGIN="http://localhost:3000"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour tester un endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local use_auth=$4
    local description=$5

    echo -e "${YELLOW}Testing:${NC} $method $endpoint"
    echo "Description: $description"

    if [ "$use_auth" = "true" ] && [ -n "$TOKEN" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "${BASE_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -H "Origin: $ORIGIN" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "${BASE_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -H "Origin: $ORIGIN" \
            -d "$data" 2>&1)
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo -e "${GREEN}✓ SUCCESS${NC} (HTTP $http_code)"
        echo "$body" | head -c 200
        echo ""
    elif [[ $http_code -ge 400 && $http_code -lt 500 ]]; then
        echo -e "${YELLOW}⚠ CLIENT ERROR${NC} (HTTP $http_code)"
        echo "$body"
    else
        echo -e "${RED}✗ ERROR${NC} (HTTP $http_code)"
        echo "$body"
    fi
    echo ""
    echo "---"
    echo ""
}

# 1. Test de l'API racine
echo "======================================"
echo "1. API ROOT"
echo "======================================"
test_endpoint "GET" "" "" "false" "Health check de l'API"

# 2. Login
echo "======================================"
echo "2. AUTHENTICATION"
echo "======================================"
test_endpoint "POST" "/auth/login" '{"email":"admin@crm.com","password":"Admin123!"}' "false" "Login avec admin"

# Extraire le token de la réponse
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -H "Origin: $ORIGIN" \
    -d '{"email":"admin@crm.com","password":"Admin123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to get auth token. Stopping tests.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Token obtained successfully${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""

# 3. Test Auth/Me
test_endpoint "GET" "/auth/me" "" "true" "Get current user info"

# 4. Test Users
echo "======================================"
echo "3. USERS ENDPOINTS"
echo "======================================"
test_endpoint "GET" "/users" "" "true" "List all users"

# 5. Test Properties
echo "======================================"
echo "4. PROPERTIES ENDPOINTS"
echo "======================================"
test_endpoint "GET" "/properties" "" "true" "List all properties"
test_endpoint "GET" "/properties/stats" "" "true" "Get properties statistics"

# 6. Test Prospects
echo "======================================"
echo "5. PROSPECTS ENDPOINTS"
echo "======================================"
test_endpoint "GET" "/prospects" "" "true" "List all prospects"

# 7. Test Appointments
echo "======================================"
echo "6. APPOINTMENTS ENDPOINTS"
echo "======================================"
test_endpoint "GET" "/appointments" "" "true" "List all appointments"
test_endpoint "GET" "/appointments/upcoming" "" "true" "Get upcoming appointments"

# 8. Test Tasks
echo "======================================"
echo "7. TASKS ENDPOINTS"
echo "======================================"
test_endpoint "GET" "/tasks" "" "true" "List all tasks"

# 9. Test Matching
echo "======================================"
echo "8. MATCHING ENDPOINTS"
echo "======================================"
test_endpoint "GET" "/matching" "" "true" "List all matches"
test_endpoint "GET" "/matching/stats" "" "true" "Get matching statistics"

# 10. Test Prospecting
echo "======================================"
echo "9. PROSPECTING ENDPOINTS"
echo "======================================"
test_endpoint "GET" "/prospecting/campaigns" "" "true" "List prospecting campaigns"
test_endpoint "GET" "/prospecting/stats" "" "true" "Get prospecting statistics"

# 11. Test Settings
echo "======================================"
echo "10. SETTINGS ENDPOINTS"
echo "======================================"
test_endpoint "GET" "/settings" "" "true" "Get all settings"

# 12. Test Notifications
echo "======================================"
echo "11. NOTIFICATIONS ENDPOINTS"
echo "======================================"
test_endpoint "GET" "/notifications" "" "true" "List all notifications"

# 13. Test Analytics
echo "======================================"
echo "12. ANALYTICS ENDPOINTS"
echo "======================================"
test_endpoint "GET" "/analytics/dashboard" "" "true" "Get dashboard analytics"

# 14. Test LLM Config
echo "======================================"
echo "13. LLM CONFIG ENDPOINTS"
echo "======================================"
test_endpoint "GET" "/llm-config" "" "true" "Get LLM configuration"
test_endpoint "GET" "/llm-config/providers" "" "true" "Get available LLM providers"

echo ""
echo "======================================"
echo "✅ TESTS COMPLETED"
echo "======================================"
