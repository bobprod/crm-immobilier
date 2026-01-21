#!/bin/bash

# Configuration
API_URL="http://localhost:3001"
BACKEND_DIR="c:/Users/DELL/Desktop/project dev/CRM_IMMOBILIER_COMPLET_FINAL/.git/crm-immobilier/backend"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}TEST API - Clés API & Configuration LLM${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. Test de connexion au serveur
echo -e "\n${YELLOW}1. Test de connexion au serveur...${NC}"
if curl -s "${API_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Serveur accessible${NC}"
else
    echo -e "${RED}✗ Serveur non accessible à ${API_URL}${NC}"
    echo -e "${YELLOW}Assurez-vous que le backend est lancé avec: npm run dev${NC}"
    exit 1
fi

# 2. Authentification (test login)
echo -e "\n${YELLOW}2. Test d'authentification...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

echo "Réponse: $LOGIN_RESPONSE"

# Extraire le token (simple extraction)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "undefined" ]; then
    echo -e "${RED}✗ Authentification échouée${NC}"
    echo -e "${YELLOW}Le test nécessite un utilisateur existant. Créez d'abord un compte ou utilisez les identifiants de test.${NC}"

    # Essayer avec des identifiants admin
    echo -e "\n${YELLOW}Tentative avec identifiants admin...${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@example.com","password":"admin"}')

    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

    if [ -z "$TOKEN" ] || [ "$TOKEN" = "undefined" ]; then
        echo -e "${RED}✗ Impossible d'obtenir un token valide${NC}"
        echo -e "${YELLOW}Tests curl non disponibles. Utilisez Playwright e2e à la place.${NC}"
        exit 0
    fi
fi

echo -e "${GREEN}✓ Token obtenu: ${TOKEN:0:20}...${NC}"

# 3. Test GET clés API (masquées)
echo -e "\n${YELLOW}3. Test GET /api/ai-billing/api-keys/user (clés masquées)...${NC}"
GET_RESPONSE=$(curl -s "${API_URL}/api/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Réponse: $GET_RESPONSE"

if echo "$GET_RESPONSE" | grep -q "openaiApiKey\|deepseekApiKey"; then
    echo -e "${GREEN}✓ Récupération des clés OK${NC}"
else
    echo -e "${YELLOW}⚠ Aucune clé trouvée (normal si c'est la première visite)${NC}"
fi

# 4. Test GET clés complètes
echo -e "\n${YELLOW}4. Test GET /api/ai-billing/api-keys/user/full (clés complètes)...${NC}"
GET_FULL_RESPONSE=$(curl -s "${API_URL}/api/ai-billing/api-keys/user/full" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Réponse: $GET_FULL_RESPONSE"

if echo "$GET_FULL_RESPONSE" | grep -q "deepseekApiKey\|openaiApiKey"; then
    echo -e "${GREEN}✓ Récupération des clés complètes OK${NC}"
else
    echo -e "${YELLOW}⚠ Aucune clé trouvée${NC}"
fi

# 5. Test VALIDATION clé Deepseek (invalide)
echo -e "\n${YELLOW}5. Test POST /api/ai-billing/api-keys/validate (clé invalide)...${NC}"
VALIDATE_INVALID=$(curl -s -X POST "${API_URL}/api/ai-billing/api-keys/validate" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"provider":"deepseek","apiKey":"invalid-key-123"}')

echo "Réponse: $VALIDATE_INVALID"

if echo "$VALIDATE_INVALID" | grep -q "valid.*false\|invalide\|Erreur"; then
    echo -e "${GREEN}✓ Validation correctement rejetée${NC}"
else
    echo -e "${YELLOW}⚠ Vérifiez la réponse de validation${NC}"
fi

# 6. Test SAUVEGARDE clé Deepseek
echo -e "\n${YELLOW}6. Test PUT /api/ai-billing/api-keys/user (sauvegarde Deepseek)...${NC}"
SAVE_RESPONSE=$(curl -s -X PUT "${API_URL}/api/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "deepseekApiKey":"sk-test-deepseek-key-12345",
    "defaultProvider":"deepseek",
    "defaultModel":"deepseek-chat"
  }')

echo "Réponse: $SAVE_RESPONSE"

if echo "$SAVE_RESPONSE" | grep -q "success.*true\|mise à jour\|sauvegardée"; then
    echo -e "${GREEN}✓ Sauvegarde OK${NC}"
else
    echo -e "${RED}✗ Erreur de sauvegarde${NC}"
fi

# 7. Vérifier la sauvegarde
echo -e "\n${YELLOW}7. Vérification de la sauvegarde...${NC}"
VERIFY_RESPONSE=$(curl -s "${API_URL}/api/ai-billing/api-keys/user/full" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Réponse: $VERIFY_RESPONSE"

if echo "$VERIFY_RESPONSE" | grep -q "deepseekApiKey.*sk-test"; then
    echo -e "${GREEN}✓ Clé Deepseek sauvegardée correctement${NC}"
else
    echo -e "${YELLOW}⚠ Vérifiez la sauvegarde${NC}"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}Tests curl complétés!${NC}"
echo -e "${BLUE}========================================${NC}"
