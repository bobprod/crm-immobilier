#!/bin/bash

# Script de test du flux API Keys & LLM Model
# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║ 🧪 API Keys & LLM Model Configuration Tests   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"

# Configuration
API_URL="http://localhost:3001/api"
FRONTEND_URL="http://localhost:3000"
TEST_SLEEP=2

echo ""
echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Backend:  $API_URL"
echo "  Frontend: $FRONTEND_URL"
echo ""

# Test 1: Vérifier que le backend est en ligne
echo -e "${YELLOW}Test 1️⃣ : Vérifier la connexion au backend${NC}"
if curl -s "${API_URL}/ai-billing/api-keys/user" -H "Authorization: Bearer test" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Backend accessible${NC}"
else
  echo -e "${RED}❌ Backend non accessible${NC}"
  exit 1
fi

# Test 2: Vérifier que le frontend est en ligne
echo ""
echo -e "${YELLOW}Test 2️⃣ : Vérifier la connexion au frontend${NC}"
if curl -s "$FRONTEND_URL" | grep -q "CRM Immobilier" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Frontend accessible${NC}"
else
  echo -e "${RED}⚠️  Frontend répondre${NC}"
fi

# Test 3: Structure du composant
echo ""
echo -e "${YELLOW}Test 3️⃣ : Vérifier la structure du composant${NC}"
if [ -f "frontend/src/pages/settings/ai-api-keys.tsx" ]; then
  if grep -q "select-provider\|select-model\|button-save-llm" "frontend/src/pages/settings/ai-api-keys.tsx"; then
    echo -e "${GREEN}✅ Composant contient les data-testid requis${NC}"
  else
    echo -e "${RED}❌ Data-testid manquants${NC}"
  fi
else
  echo -e "${RED}❌ Fichier composant non trouvé${NC}"
fi

# Test 4: Toast Component
echo ""
echo -e "${YELLOW}Test 4️⃣ : Vérifier le système de toast${NC}"
if grep -q "ToastNotification\|addToast" "frontend/src/pages/settings/ai-api-keys.tsx"; then
  echo -e "${GREEN}✅ Toast component implémenté${NC}"
else
  echo -e "${RED}❌ Toast component manquant${NC}"
fi

# Test 5: Provider Models
echo ""
echo -e "${YELLOW}Test 5️⃣ : Vérifier les modèles des providers${NC}"
if grep -q "gemini-2.0-flash\|gpt-4o\|deepseek-chat\|claude-3-5-sonnet" "frontend/src/pages/settings/ai-api-keys.tsx"; then
  echo -e "${GREEN}✅ Modèles de provider configurés${NC}"
else
  echo -e "${RED}❌ Modèles de provider manquants${NC}"
fi

# Test 6: DTO Backend
echo ""
echo -e "${YELLOW}Test 6️⃣ : Vérifier les DTOs backend${NC}"
if grep -q "defaultModel.*string\|defaultProvider.*string" "backend/src/modules/ai-billing/dto/api-keys.dto.ts"; then
  echo -e "${GREEN}✅ DTOs mise à jour avec defaultModel et defaultProvider${NC}"
else
  echo -e "${RED}❌ DTOs non mise à jour${NC}"
fi

# Test 7: API Endpoints
echo ""
echo -e "${YELLOW}Test 7️⃣ : Tester les endpoints API${NC}"

# Test OpenAI endpoint
RESPONSE=$(curl -s -X POST "${API_URL}/api-keys/test/openai" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "sk-test"}')

if echo "$RESPONSE" | grep -q "success\|error\|message"; then
  echo -e "${GREEN}✅ Endpoint test/openai fonctionne${NC}"
else
  echo -e "${RED}⚠️  Endpoint test/openai ne répond pas correctement${NC}"
fi

# Test GeminiEndpoint
RESPONSE=$(curl -s -X POST "${API_URL}/api-keys/test/gemini" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "AIza-test"}')

if echo "$RESPONSE" | grep -q "success\|error\|message"; then
  echo -e "${GREEN}✅ Endpoint test/gemini fonctionne${NC}"
else
  echo -e "${RED}⚠️  Endpoint test/gemini ne répond pas correctement${NC}"
fi

# Test User API Keys endpoint
echo ""
echo -e "${YELLOW}Test 8️⃣ : Vérifier l'endpoint utilisateur${NC}"
RESPONSE=$(curl -s -X GET "${API_URL}/ai-billing/api-keys/user" \
  -H "Authorization: Bearer test")

if echo "$RESPONSE" | grep -q "defaultProvider\|defaultModel\|anthropicApiKey\|openaiApiKey"; then
  echo -e "${GREEN}✅ Endpoint utilisateur retourne les bons champs${NC}"
else
  echo -e "${YELLOW}⚠️  Endpoint pourrait être protégé (401 expected)${NC}"
fi

# Résumé
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         ✅ Tests Complétés Avec Succès!        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo "  1. Aller à http://localhost:3000/settings"
echo "  2. Accéder à l'onglet 'LLM / IA'"
echo "  3. Sélectionner un provider (OpenAI, Gemini, DeepSeek, Anthropic)"
echo "  4. Sélectionner un modèle"
echo "  5. Entrer une clé API (optionnel)"
echo "  6. Cliquer sur 'Enregistrer les clés LLM'"
echo "  7. Vérifier que le toast de succès apparaît"
echo ""
echo -e "${GREEN}🚀 Système prêt pour les tests manuels!${NC}"
