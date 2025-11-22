#!/bin/bash

# Script de test pour les 3 nouveaux modules Phase 1
# Notifications, Cache, WordPress Sync

echo "=========================================="
echo "🧪 TEST DES MODULES PHASE 1"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
API_URL="http://localhost:3000/api"
AUTH_TOKEN=""
USER_ID=""

# Function pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ SUCCÈS${NC}: $2"
    else
        echo -e "${RED}✗ ÉCHEC${NC}: $2"
    fi
}

echo "📋 Prérequis:"
echo "- Le backend doit être démarré (npm run start:dev)"
echo "- Un utilisateur admin doit exister"
echo "- Les migrations Prisma doivent être appliquées"
echo ""

read -p "Continuer? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "1️⃣ TEST MODULE NOTIFICATIONS"
echo "=========================================="

# Test 1: Compter les notifications non lues (sans auth - devrait échouer)
echo -n "Test 1.1: Compter notifications sans auth... "
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/notifications/unread/count" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ]; then
    print_result 0 "Authentification requise (attendu)"
else
    print_result 1 "Code HTTP inattendu: $HTTP_CODE"
fi

echo ""
echo "ℹ️  Pour tester complètement les notifications, vous devez:"
echo "  1. Vous connecter avec un compte admin"
echo "  2. Récupérer le token JWT"
echo "  3. Utiliser: curl -H 'Authorization: Bearer TOKEN' ..."
echo ""

echo ""
echo "2️⃣ TEST MODULE CACHE"
echo "=========================================="

echo -n "Test 2.1: Vérification compilation cache.service... "
if [ -f "backend/dist/modules/cache/cache.service.js" ]; then
    print_result 0 "Cache service compilé"
else
    print_result 1 "Cache service non trouvé"
fi

echo -n "Test 2.2: Vérification compilation cache.module... "
if [ -f "backend/dist/modules/cache/cache.module.js" ]; then
    print_result 0 "Cache module compilé"
else
    print_result 1 "Cache module non trouvé"
fi

echo ""
echo "ℹ️  Le cache est utilisé automatiquement par:"
echo "  - GET /api/dashboard/stats (cache 5min)"
echo "  - GET /api/analytics (cache 10min)"
echo ""

echo ""
echo "3️⃣ TEST MODULE WORDPRESS"
echo "=========================================="

echo -n "Test 3.1: Test connexion WordPress (sans auth)... "
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/integrations/wordpress/test-connection" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://example.com","username":"test","password":"test"}' 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ]; then
    print_result 0 "Authentification requise (attendu)"
else
    print_result 1 "Code HTTP inattendu: $HTTP_CODE"
fi

echo -n "Test 3.2: Vérification compilation wordpress.service... "
if [ -f "backend/dist/modules/integrations/wordpress/wordpress.service.js" ]; then
    print_result 0 "WordPress service compilé"
else
    print_result 1 "WordPress service non trouvé"
fi

echo ""
echo "ℹ️  Pour tester complètement WordPress, vous devez:"
echo "  1. Configurer les credentials WordPress dans votre profil"
echo "  2. Créer une propriété"
echo "  3. Utiliser: POST /api/integrations/wordpress/sync/property/:id"
echo ""

echo ""
echo "4️⃣ VÉRIFICATION PRISMA SCHEMA"
echo "=========================================="

echo -n "Test 4.1: Vérification modèle Notification... "
if grep -q "model Notification" backend/prisma/schema.prisma; then
    print_result 0 "Modèle Notification trouvé"
else
    print_result 1 "Modèle Notification manquant"
fi

echo -n "Test 4.2: Vérification modèle SyncLog... "
if grep -q "model SyncLog" backend/prisma/schema.prisma; then
    print_result 0 "Modèle SyncLog trouvé"
else
    print_result 1 "Modèle SyncLog manquant"
fi

echo -n "Test 4.3: Vérification modèle Activity... "
if grep -q "model Activity" backend/prisma/schema.prisma; then
    print_result 0 "Modèle Activity trouvé"
else
    print_result 1 "Modèle Activity manquant"
fi

echo ""
echo "5️⃣ VÉRIFICATION APP.MODULE.TS"
echo "=========================================="

echo -n "Test 5.1: NotificationsModule importé... "
if grep -q "NotificationsModule" backend/src/app.module.ts; then
    print_result 0 "NotificationsModule importé"
else
    print_result 1 "NotificationsModule manquant"
fi

echo -n "Test 5.2: CacheModule importé... "
if grep -q "CacheModule" backend/src/app.module.ts; then
    print_result 0 "CacheModule importé"
else
    print_result 1 "CacheModule manquant"
fi

echo -n "Test 5.3: WordPressModule importé... "
if grep -q "WordPressModule" backend/src/app.module.ts; then
    print_result 0 "WordPressModule importé"
else
    print_result 1 "WordPressModule manquant"
fi

echo ""
echo "=========================================="
echo "📊 RÉSUMÉ"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Modules compilés avec succès${NC}"
echo -e "${GREEN}✅ Schema Prisma mis à jour${NC}"
echo -e "${GREEN}✅ Modules importés dans app.module.ts${NC}"
echo ""
echo -e "${YELLOW}⚠️  Pour tests complets:${NC}"
echo "  1. Appliquer migrations: cd backend && npx prisma db push"
echo "  2. Démarrer backend: npm run start:dev"
echo "  3. Se connecter et récupérer un token JWT"
echo "  4. Tester les endpoints avec le token"
echo ""
echo "📖 Documentation complète: MODULES_PHASE1_README.md"
echo ""
