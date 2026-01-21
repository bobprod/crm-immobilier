#!/bin/bash

# Vérification de la configuration des clés API

echo "🔍 Vérification de la configuration des clés API Deepseek"
echo "=========================================================="
echo ""

# 1. Vérifier le frontend
echo "📱 Vérification du code Frontend..."
FRONTEND_FILE="frontend/src/pages/settings/ai-api-keys.tsx"

if [ -f "$FRONTEND_FILE" ]; then
    echo "✓ Fichier trouvé: $FRONTEND_FILE"

    # Vérifier les modifications
    if grep -q "getAuthToken" "$FRONTEND_FILE"; then
        echo "  ✓ Fonction getAuthToken() trouvée"
    else
        echo "  ✗ Fonction getAuthToken() manquante"
    fi

    if grep -q "handleTestApiKey" "$FRONTEND_FILE"; then
        echo "  ✓ Fonction handleTestApiKey() trouvée"
    else
        echo "  ✗ Fonction handleTestApiKey() manquante"
    fi

    if grep -q "TestTube" "$FRONTEND_FILE"; then
        echo "  ✓ Icone TestTube importée"
    else
        echo "  ✗ Icone TestTube manquante"
    fi

    if grep -q "validatedKeys" "$FRONTEND_FILE"; then
        echo "  ✓ État validatedKeys trouvé"
    else
        echo "  ✗ État validatedKeys manquant"
    fi
else
    echo "✗ Fichier $FRONTEND_FILE introuvable"
fi

echo ""

# 2. Vérifier le backend
echo "🖥️  Vérification du code Backend..."
CONTROLLER_FILE="backend/src/modules/ai-billing/api-keys.controller.ts"

if [ -f "$CONTROLLER_FILE" ]; then
    echo "✓ Fichier trouvé: $CONTROLLER_FILE"

    # Vérifier les modifications
    if grep -q "validateApiKey" "$CONTROLLER_FILE"; then
        echo "  ✓ Endpoint /validate trouvé"
    else
        echo "  ✗ Endpoint /validate manquant"
    fi

    if grep -q "getDefaultModelsForProvider" "$CONTROLLER_FILE"; then
        echo "  ✓ Fonction getDefaultModelsForProvider() trouvée"
    else
        echo "  ✗ Fonction getDefaultModelsForProvider() manquante"
    fi

    if grep -q "user/full" "$CONTROLLER_FILE"; then
        echo "  ✓ Endpoint /user/full trouvé"
    else
        echo "  ✗ Endpoint /user/full manquant"
    fi
else
    echo "✗ Fichier $CONTROLLER_FILE introuvable"
fi

echo ""

# 3. Vérifier le service
echo "🔧 Vérification du Service API..."
SERVICE_FILE="backend/src/shared/services/api-keys.service.ts"

if [ -f "$SERVICE_FILE" ]; then
    echo "✓ Fichier trouvé: $SERVICE_FILE"

    # Vérifier les modifications
    if grep -q "validateApiKey" "$SERVICE_FILE"; then
        echo "  ✓ Fonction validateApiKey() trouvée"
    else
        echo "  ✗ Fonction validateApiKey() manquante"
    fi

    if grep -q "validateDeepseekKey" "$SERVICE_FILE"; then
        echo "  ✓ Fonction validateDeepseekKey() trouvée"
    else
        echo "  ✗ Fonction validateDeepseekKey() manquante"
    fi

    if grep -q "validateOpenAIKey" "$SERVICE_FILE"; then
        echo "  ✓ Fonction validateOpenAIKey() trouvée"
    else
        echo "  ✗ Fonction validateOpenAIKey() manquante"
    fi
else
    echo "✗ Fichier $SERVICE_FILE introuvable"
fi

echo ""

# 4. Vérifier les tests
echo "🧪 Vérification des fichiers de test..."
TEST_FILE="frontend/tests/api-keys-deepseek.spec.ts"

if [ -f "$TEST_FILE" ]; then
    echo "✓ Fichier de test trouvé: $TEST_FILE"
else
    echo "⚠ Fichier de test manquant: $TEST_FILE"
fi

TEST_SCRIPT="test-api-keys.sh"

if [ -f "$TEST_SCRIPT" ]; then
    echo "✓ Script de test trouvé: $TEST_SCRIPT"
else
    echo "⚠ Script de test manquant: $TEST_SCRIPT"
fi

echo ""

# 5. Résumé
echo "📋 Résumé:"
echo "=========================================================="
echo ""
echo "✅ Modifications effectuées:"
echo "  1. Frontend: Correction du token localStorage"
echo "  2. Frontend: Bouton de test pour les clés"
echo "  3. Backend: Endpoint /api/ai-billing/api-keys/validate"
echo "  4. Service: Validations pour chaque provider"
echo "  5. Tests: Playwright e2e et script curl"
echo ""
echo "🚀 Prochaines étapes:"
echo "  1. Lancer le backend: npm run dev (dans /backend)"
echo "  2. Lancer le frontend: npm run dev (dans /frontend)"
echo "  3. Naviguer vers: http://localhost:3000/settings/ai-api-keys"
echo "  4. Tester avec Deepseek ou OpenAI"
echo "  5. Lancer les tests: npm run test:e2e"
echo ""
echo "📝 Documentation:"
echo "  Consultez: TEST_API_KEYS_GUIDE.md"
echo ""
echo "=========================================================="
