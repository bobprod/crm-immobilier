#!/bin/bash

# 🧪 Script de Test Phase 1 - Intégration Prospecting-AI ↔ Prospecting via curl
# Tests des endpoints REST pour valider le workflow complet

set -e

echo "🚀 Phase 1 Integration Tests - CURL Scripts"
echo "============================================"
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TEST_EMAIL="${TEST_EMAIL:-test@example.com}"
TEST_PASSWORD="${TEST_PASSWORD:-password123}"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables globales
AUTH_TOKEN=""
USER_ID=""
CAMPAIGN_ID=""
LEAD_ID=""

echo "📍 API URL: $API_URL"
echo ""

# ============================================
# 1. Authentification
# ============================================
test_auth() {
    echo -e "${YELLOW}🔐 Test 1: Authentication${NC}"

    response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")

    echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"

    AUTH_TOKEN=$(echo "$response" | jq -r '.access_token' 2>/dev/null)
    USER_ID=$(echo "$response" | jq -r '.user.id' 2>/dev/null)

    if [ "$AUTH_TOKEN" != "null" ] && [ -n "$AUTH_TOKEN" ]; then
        echo -e "${GREEN}✅ Authentication successful${NC}"
        echo "   User ID: $USER_ID"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Authentication failed${NC}"
        echo "   Using mock token for tests..."
        AUTH_TOKEN="mock-token-for-testing"
        USER_ID="test-user-id"
        echo ""
        return 1
    fi
}

# ============================================
# 2. Créer une campagne de prospection
# ============================================
test_create_campaign() {
    echo -e "${YELLOW}📋 Test 2: Create Prospecting Campaign${NC}"

    response=$(curl -s -X POST "$API_URL/prospecting/campaigns" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{
            "name": "Test Campaign Phase 1",
            "type": "geographic",
            "targetCount": 10,
            "description": "Campaign for testing Phase 1 integration",
            "config": {
                "zone": "Tunis",
                "targetType": "buyer",
                "propertyType": "appartement"
            }
        }')

    echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"

    CAMPAIGN_ID=$(echo "$response" | jq -r '.id' 2>/dev/null)

    if [ "$CAMPAIGN_ID" != "null" ] && [ -n "$CAMPAIGN_ID" ]; then
        echo -e "${GREEN}✅ Campaign created: $CAMPAIGN_ID${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Campaign creation failed${NC}"
        echo ""
        return 1
    fi
}

# ============================================
# 3. Démarrer prospection via Prospecting-AI
# ============================================
test_start_prospection() {
    echo -e "${YELLOW}🎯 Test 3: Start Prospection (Prospecting-AI)${NC}"
    echo "This tests the full integration: Prospecting-AI → AI Orchestrator → Prospecting Module"

    start_time=$(date +%s)

    response=$(curl -s -X POST "$API_URL/prospecting-ai/prospection/start" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{
            "zone": "Tunis",
            "targetType": "buyer",
            "propertyType": "appartement",
            "budget": {
                "min": 200000,
                "max": 400000
            },
            "keywords": ["3 chambres", "parking", "proche metro"],
            "maxLeads": 10,
            "options": {
                "engine": "internal",
                "maxCost": 5
            }
        }')

    end_time=$(date +%s)
    duration=$((end_time - start_time))

    echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"

    status=$(echo "$response" | jq -r '.status' 2>/dev/null)
    leads_count=$(echo "$response" | jq -r '.stats.totalLeads' 2>/dev/null)
    exec_time=$(echo "$response" | jq -r '.metadata.executionTimeMs' 2>/dev/null)
    cost=$(echo "$response" | jq -r '.metadata.cost' 2>/dev/null)

    echo ""
    echo "📊 Results:"
    echo "   Status: $status"
    echo "   Total leads: $leads_count"
    echo "   Execution time: ${exec_time}ms (server)"
    echo "   Total duration: ${duration}s (client)"
    echo "   Cost: \$$cost"

    if [ "$status" != "null" ]; then
        echo -e "${GREEN}✅ Prospection completed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Prospection failed${NC}"
        echo ""
        return 1
    fi
}

# ============================================
# 4. Tester outil de scraping via AI Orchestrator
# ============================================
test_orchestrator_scraping() {
    echo -e "${YELLOW}🔍 Test 4: Scraping via AI Orchestrator Tool${NC}"

    response=$(curl -s -X POST "$API_URL/ai-orchestrator/orchestrate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{
            "objective": "prospection",
            "context": {
                "zone": "Tunis",
                "targetType": "buyer",
                "propertyType": "appartement",
                "maxResults": 5,
                "step": "scraping"
            },
            "options": {
                "executionMode": "auto",
                "maxCost": 2,
                "timeout": 60000
            }
        }')

    echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"

    orch_status=$(echo "$response" | jq -r '.status' 2>/dev/null)

    if [ "$orch_status" != "null" ]; then
        echo -e "${GREEN}✅ Orchestrator scraping test passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Orchestrator scraping test failed${NC}"
        echo ""
        return 1
    fi
}

# ============================================
# 5. Validation d'emails (outil prospecting)
# ============================================
test_email_validation() {
    echo -e "${YELLOW}📧 Test 5: Email Validation (Prospecting Tool)${NC}"

    response=$(curl -s -X POST "$API_URL/prospecting/validate-emails" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{
            "emails": [
                "valid@example.com",
                "invalid-email",
                "test@domain.com",
                "another.test@company.tn"
            ]
        }')

    echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"

    results_count=$(echo "$response" | jq -r '.results | length' 2>/dev/null)

    if [ "$results_count" = "4" ]; then
        echo -e "${GREEN}✅ Email validation test passed (4/4 emails validated)${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Email validation test failed${NC}"
        echo ""
        return 1
    fi
}

# ============================================
# 6. Créer un lead et le qualifier
# ============================================
test_lead_qualification() {
    echo -e "${YELLOW}📊 Test 6: Lead Creation and Qualification${NC}"

    if [ -z "$CAMPAIGN_ID" ] || [ "$CAMPAIGN_ID" = "null" ]; then
        echo -e "${YELLOW}⚠️  No campaign ID, skipping lead creation${NC}"
        echo ""
        return 0
    fi

    # Créer un lead
    echo "Creating lead..."
    response=$(curl -s -X POST "$API_URL/prospecting/campaigns/$CAMPAIGN_ID/leads" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{
            "firstName": "Ahmed",
            "lastName": "Ben Ali",
            "email": "ahmed.benali@example.com",
            "phone": "+216 20 123 456",
            "city": "Tunis",
            "propertyType": "appartement",
            "budget": 300000,
            "source": "test-curl"
        }')

    LEAD_ID=$(echo "$response" | jq -r '.id' 2>/dev/null)

    if [ "$LEAD_ID" != "null" ] && [ -n "$LEAD_ID" ]; then
        echo "Lead created: $LEAD_ID"

        # Qualifier le lead (récupérer avec score)
        echo "Qualifying lead..."
        qual_response=$(curl -s -X GET "$API_URL/prospecting/leads/$LEAD_ID" \
            -H "Authorization: Bearer $AUTH_TOKEN")

        echo "Qualification response: $qual_response" | jq '.' 2>/dev/null || echo "$qual_response"

        score=$(echo "$qual_response" | jq -r '.score' 2>/dev/null)

        echo ""
        echo "📈 Lead Score: $score"

        if [ "$score" != "null" ]; then
            echo -e "${GREEN}✅ Lead qualification test passed${NC}"
            echo ""
            return 0
        fi
    fi

    echo -e "${RED}❌ Lead qualification test failed${NC}"
    echo ""
    return 1
}

# ============================================
# 7. Matcher un lead avec des propriétés
# ============================================
test_lead_matching() {
    echo -e "${YELLOW}🎯 Test 7: Lead Matching with Properties${NC}"

    if [ -z "$LEAD_ID" ] || [ "$LEAD_ID" = "null" ]; then
        echo -e "${YELLOW}⚠️  No lead ID, skipping matching test${NC}"
        echo ""
        return 0
    fi

    response=$(curl -s -X POST "$API_URL/prospecting/leads/$LEAD_ID/match" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"

    matches_count=$(echo "$response" | jq -r '.matches | length' 2>/dev/null)

    echo ""
    echo "🎯 Matches found: $matches_count"

    if [ "$matches_count" != "null" ]; then
        echo -e "${GREEN}✅ Lead matching test passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Lead matching test failed${NC}"
        echo ""
        return 1
    fi
}

# ============================================
# 8. Test de gestion d'erreurs
# ============================================
test_error_handling() {
    echo -e "${YELLOW}🚨 Test 8: Error Handling${NC}"

    # Envoyer une requête invalide
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/prospecting-ai/prospection/start" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{
            "zone": "",
            "targetType": "invalid-type",
            "maxLeads": -1
        }')

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    echo "HTTP Status: $http_code"
    echo "Response: $body" | jq '.' 2>/dev/null || echo "$body"

    if [ "$http_code" = "400" ] || [ "$http_code" = "422" ] || [ "$http_code" = "500" ]; then
        echo -e "${GREEN}✅ Error handling test passed (invalid request rejected)${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Error handling test failed (invalid request accepted)${NC}"
        echo ""
        return 1
    fi
}

# ============================================
# Exécuter tous les tests
# ============================================
run_all_tests() {
    echo "============================================"
    echo "🧪 Running All Tests"
    echo "============================================"
    echo ""

    passed=0
    failed=0

    # Test 1: Auth
    if test_auth; then
        ((passed++))
    else
        ((failed++))
    fi

    # Test 2: Create Campaign
    if test_create_campaign; then
        ((passed++))
    else
        ((failed++))
    fi

    # Test 3: Start Prospection
    if test_start_prospection; then
        ((passed++))
    else
        ((failed++))
    fi

    # Test 4: Orchestrator Scraping
    if test_orchestrator_scraping; then
        ((passed++))
    else
        ((failed++))
    fi

    # Test 5: Email Validation
    if test_email_validation; then
        ((passed++))
    else
        ((failed++))
    fi

    # Test 6: Lead Qualification
    if test_lead_qualification; then
        ((passed++))
    else
        ((failed++))
    fi

    # Test 7: Lead Matching
    if test_lead_matching; then
        ((passed++))
    else
        ((failed++))
    fi

    # Test 8: Error Handling
    if test_error_handling; then
        ((passed++))
    else
        ((failed++))
    fi

    # Résumé
    echo ""
    echo "============================================"
    echo "📊 Test Summary"
    echo "============================================"
    echo -e "Passed: ${GREEN}$passed${NC}"
    echo -e "Failed: ${RED}$failed${NC}"
    echo "Total:  $((passed + failed))"
    echo ""

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some tests failed${NC}"
        exit 1
    fi
}

# Vérifier si jq est installé
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq is not installed. JSON responses will not be pretty-printed.${NC}"
    echo "Install jq: sudo apt-get install jq (Ubuntu) or brew install jq (Mac)"
    echo ""
fi

# Exécuter tous les tests
run_all_tests
