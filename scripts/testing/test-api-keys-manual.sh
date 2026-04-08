#!/bin/bash

# Script de Test Manuel - AI API Keys
# =====================================

echo "🧪 Script de Test Manuel - Sauvegarde et Chargement des API Keys"
echo "=================================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:4000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
TOKEN="${TOKEN:-}"

echo "📋 Configuration:"
echo "   - API URL: $API_URL"
echo "   - Frontend URL: $FRONTEND_URL"
echo ""

# Function to test API endpoint
test_api_endpoint() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📡 Test 1: Vérifier l'endpoint API"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ -z "$TOKEN" ]; then
        echo -e "${YELLOW}⚠️  TOKEN non fourni. Essayez de le récupérer depuis localStorage...${NC}"
        echo ""
        echo "Pour obtenir votre token:"
        echo "1. Ouvrez http://localhost:3000 dans votre navigateur"
        echo "2. Ouvrez la console (F12)"
        echo "3. Tapez: localStorage.getItem('token')"
        echo "4. Copiez le token et définissez: export TOKEN='votre-token'"
        echo ""
        return 1
    fi

    echo "Testing GET /api/ai-billing/api-keys/user"

    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        "$API_URL/ai-billing/api-keys/user")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    echo "HTTP Status: $HTTP_CODE"

    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✅ GET Request successful!${NC}"
        echo "Response:"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    else
        echo -e "${RED}❌ GET Request failed!${NC}"
        echo "Response: $BODY"
        return 1
    fi

    echo ""
}

# Function to test saving API keys
test_save_api_keys() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "💾 Test 2: Sauvegarder des clés API"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ TOKEN requis pour ce test${NC}"
        return 1
    fi

    echo "Envoi de données de test..."

    DATA='{
        "geminiApiKey": "AIzaSyC3Bd9zuFof6T1bFjddbfQVGhSaYNSkPmU",
        "defaultProvider": "gemini",
        "defaultModel": "gemini-2.0-flash"
    }'

    echo "Données à envoyer:"
    echo "$DATA" | jq '.'
    echo ""

    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X PUT \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$DATA" \
        "$API_URL/ai-billing/api-keys/user")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    echo "HTTP Status: $HTTP_CODE"

    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
        echo -e "${GREEN}✅ PUT Request successful!${NC}"
        echo "Response:"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    else
        echo -e "${RED}❌ PUT Request failed!${NC}"
        echo "Response: $BODY"
        return 1
    fi

    echo ""
}

# Function to verify saved data
test_verify_saved_data() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔍 Test 3: Vérifier les données sauvegardées"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ TOKEN requis pour ce test${NC}"
        return 1
    fi

    echo "Récupération des données sauvegardées..."

    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        "$API_URL/ai-billing/api-keys/user")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    echo "HTTP Status: $HTTP_CODE"

    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✅ Data retrieved successfully!${NC}"
        echo ""

        # Check for specific fields
        GEMINI_KEY=$(echo "$BODY" | jq -r '.geminiApiKey // empty')
        DEFAULT_PROVIDER=$(echo "$BODY" | jq -r '.defaultProvider // empty')
        DEFAULT_MODEL=$(echo "$BODY" | jq -r '.defaultModel // empty')

        echo "📊 Vérification des données:"

        if [ ! -z "$GEMINI_KEY" ]; then
            echo -e "${GREEN}✅ geminiApiKey: présente (${#GEMINI_KEY} caractères)${NC}"
        else
            echo -e "${RED}❌ geminiApiKey: absente${NC}"
        fi

        if [ "$DEFAULT_PROVIDER" == "gemini" ]; then
            echo -e "${GREEN}✅ defaultProvider: $DEFAULT_PROVIDER${NC}"
        else
            echo -e "${YELLOW}⚠️  defaultProvider: $DEFAULT_PROVIDER (attendu: gemini)${NC}"
        fi

        if [ "$DEFAULT_MODEL" == "gemini-2.0-flash" ]; then
            echo -e "${GREEN}✅ defaultModel: $DEFAULT_MODEL${NC}"
        else
            echo -e "${YELLOW}⚠️  defaultModel: $DEFAULT_MODEL (attendu: gemini-2.0-flash)${NC}"
        fi

        echo ""
        echo "Données complètes:"
        echo "$BODY" | jq '.'
    else
        echo -e "${RED}❌ Failed to retrieve data!${NC}"
        echo "Response: $BODY"
        return 1
    fi

    echo ""
}

# Function to test frontend
test_frontend() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 Test 4: Vérifier le Frontend"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    echo "Vérification de l'accessibilité..."

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/settings/ai-api-keys")

    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✅ Page accessible: $FRONTEND_URL/settings/ai-api-keys${NC}"
        echo ""
        echo "🎯 Tests manuels recommandés:"
        echo "1. Ouvrir: $FRONTEND_URL/settings/ai-api-keys"
        echo "2. Sélectionner provider: Gemini"
        echo "3. Sélectionner modèle: gemini-2.0-flash"
        echo "4. Remplir clé: AIzaSyC3Bd9zuFof6T1bFjddbfQVGhSaYNSkPmU"
        echo "5. Cliquer 'Enregistrer'"
        echo "6. Recharger la page (F5)"
        echo "7. Vérifier que les données persistent"
    else
        echo -e "${RED}❌ Page non accessible (HTTP $HTTP_CODE)${NC}"
        echo "Assurez-vous que le serveur frontend est démarré:"
        echo "  cd frontend && npm run dev"
        return 1
    fi

    echo ""
}

# Main execution
main() {
    echo ""

    # Run tests
    test_api_endpoint
    TEST1=$?

    test_save_api_keys
    TEST2=$?

    test_verify_saved_data
    TEST3=$?

    test_frontend
    TEST4=$?

    # Summary
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 RÉSUMÉ DES TESTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    [ $TEST1 -eq 0 ] && echo -e "${GREEN}✅ Test 1: GET API Keys${NC}" || echo -e "${RED}❌ Test 1: GET API Keys${NC}"
    [ $TEST2 -eq 0 ] && echo -e "${GREEN}✅ Test 2: Save API Keys${NC}" || echo -e "${RED}❌ Test 2: Save API Keys${NC}"
    [ $TEST3 -eq 0 ] && echo -e "${GREEN}✅ Test 3: Verify Saved Data${NC}" || echo -e "${RED}❌ Test 3: Verify Saved Data${NC}"
    [ $TEST4 -eq 0 ] && echo -e "${GREEN}✅ Test 4: Frontend Accessible${NC}" || echo -e "${RED}❌ Test 4: Frontend Accessible${NC}"

    echo ""

    TOTAL_PASSED=$((4 - TEST1 - TEST2 - TEST3 - TEST4))

    if [ $TOTAL_PASSED -eq 4 ]; then
        echo -e "${GREEN}🎉 TOUS LES TESTS RÉUSSIS! ($TOTAL_PASSED/4)${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $TOTAL_PASSED/4 tests réussis${NC}"
        return 1
    fi
}

# Run main
main
