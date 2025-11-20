#!/bin/bash

# ============================================
# Script de Test Complet pour Backend NestJS
# ============================================

API_URL="http://localhost:3000"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Fonction pour afficher les résultats
print_result() {
    local test_name=$1
    local response=$2
    local http_code=$3

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo -e "${GREEN}✓ SUCCESS${NC} - $test_name (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAILED${NC} - $test_name (HTTP $http_code)"
        echo -e "  Response: $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Fonction pour afficher un titre de section
print_section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Variables pour stocker les tokens
ADMIN_TOKEN=""
MANAGER_TOKEN=""
AGENT_TOKEN=""

echo -e "${YELLOW}"
echo "╔════════════════════════════════════════╗"
echo "║  Test Complet Backend NestJS CRM       ║"
echo "║  API URL: $API_URL              ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# 1. TEST DE SANTÉ DU SERVEUR
# ============================================
print_section "1. Test de Santé du Serveur"

response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/health" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "Health Check" "$body" "$http_code"

# ============================================
# 2. CRÉATION DES UTILISATEURS
# ============================================
print_section "2. Création des Utilisateurs de Test"

# Créer Admin
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crm-immobilier.local",
    "password": "Admin@123456",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "Créer utilisateur Admin" "$body" "$http_code"

# Créer Manager
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@crm-immobilier.local",
    "password": "Manager@123456",
    "firstName": "Manager",
    "lastName": "User",
    "role": "manager"
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "Créer utilisateur Manager" "$body" "$http_code"

# Créer Agent
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@crm-immobilier.local",
    "password": "Agent@123456",
    "firstName": "Agent",
    "lastName": "User",
    "role": "agent"
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "Créer utilisateur Agent" "$body" "$http_code"

# ============================================
# 3. CONNEXION DES UTILISATEURS
# ============================================
print_section "3. Connexion des Utilisateurs"

# Login Admin
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crm-immobilier.local",
    "password": "Admin@123456"
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
ADMIN_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
print_result "Login Admin" "$body" "$http_code"

# Login Manager
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@crm-immobilier.local",
    "password": "Manager@123456"
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
MANAGER_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
print_result "Login Manager" "$body" "$http_code"

# Login Agent
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@crm-immobilier.local",
    "password": "Agent@123456"
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
AGENT_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
print_result "Login Agent" "$body" "$http_code"

# Vérifier si on a au moins un token
if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}ERREUR: Impossible d'obtenir le token Admin. Arrêt des tests.${NC}"
    exit 1
fi

# ============================================
# 4. TEST DES ENDPOINTS UTILISATEURS
# ============================================
print_section "4. Test des Endpoints Utilisateurs"

# GET /users
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /users - Lister tous les utilisateurs" "$body" "$http_code"

# GET /users/me
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /users/me - Profil utilisateur" "$body" "$http_code"

# ============================================
# 5. TEST DES ENDPOINTS PROPRIÉTÉS
# ============================================
print_section "5. Test des Endpoints Propriétés"

# POST /properties - Créer une propriété
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/properties" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Villa Luxueuse Test",
    "description": "Belle villa avec piscine pour les tests",
    "price": 500000,
    "address": "123 Rue Example",
    "city": "Paris",
    "zipCode": "75001",
    "propertyType": "villa",
    "status": "available",
    "surface": 200,
    "rooms": 5,
    "bedrooms": 3,
    "bathrooms": 2
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
PROPERTY_ID=$(echo "$body" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
print_result "POST /properties - Créer une propriété" "$body" "$http_code"

# GET /properties
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/properties" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /properties - Lister toutes les propriétés" "$body" "$http_code"

# GET /properties/:id
if [ ! -z "$PROPERTY_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/properties/$PROPERTY_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    print_result "GET /properties/:id - Obtenir une propriété" "$body" "$http_code"
fi

# ============================================
# 6. TEST DES ENDPOINTS PROSPECTS
# ============================================
print_section "6. Test des Endpoints Prospects"

# POST /prospects - Créer un prospect
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/prospects" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "phone": "+33612345678",
    "status": "new",
    "source": "website"
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
PROSPECT_ID=$(echo "$body" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
print_result "POST /prospects - Créer un prospect" "$body" "$http_code"

# GET /prospects
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/prospects" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /prospects - Lister tous les prospects" "$body" "$http_code"

# GET /prospects/:id
if [ ! -z "$PROSPECT_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/prospects/$PROSPECT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    print_result "GET /prospects/:id - Obtenir un prospect" "$body" "$http_code"
fi

# ============================================
# 7. TEST DES ENDPOINTS RENDEZ-VOUS
# ============================================
print_section "7. Test des Endpoints Rendez-vous"

# POST /appointments - Créer un rendez-vous
if [ ! -z "$PROSPECT_ID" ] && [ ! -z "$PROPERTY_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/appointments" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"prospectId\": \"$PROSPECT_ID\",
        \"propertyId\": \"$PROPERTY_ID\",
        \"startDate\": \"2025-12-01T10:00:00.000Z\",
        \"endDate\": \"2025-12-01T11:00:00.000Z\",
        \"type\": \"visit\",
        \"status\": \"scheduled\"
      }" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    APPOINTMENT_ID=$(echo "$body" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    print_result "POST /appointments - Créer un rendez-vous" "$body" "$http_code"
fi

# GET /appointments
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/appointments" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /appointments - Lister tous les rendez-vous" "$body" "$http_code"

# ============================================
# 8. TEST DES ENDPOINTS DOCUMENTS
# ============================================
print_section "8. Test des Endpoints Documents"

# GET /documents
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/documents" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /documents - Lister tous les documents" "$body" "$http_code"

# ============================================
# 9. TEST DES ENDPOINTS ANALYTICS
# ============================================
print_section "9. Test des Endpoints Analytics"

# GET /analytics/dashboard
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/analytics/dashboard" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /analytics/dashboard - Statistiques du tableau de bord" "$body" "$http_code"

# ============================================
# 10. TEST DES ENDPOINTS NOTIFICATIONS
# ============================================
print_section "10. Test des Endpoints Notifications"

# GET /notifications
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/notifications" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /notifications - Lister toutes les notifications" "$body" "$http_code"

# ============================================
# RÉSUMÉ FINAL
# ============================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}           RÉSUMÉ DES TESTS${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total de tests   : ${TOTAL_TESTS}"
echo -e "${GREEN}Tests réussis    : ${PASSED_TESTS}${NC}"
echo -e "${RED}Tests échoués    : ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS!${NC}"
    echo ""
    echo -e "${YELLOW}Identifiants créés:${NC}"
    echo -e "  Admin   : admin@crm-immobilier.local / Admin@123456"
    echo -e "  Manager : manager@crm-immobilier.local / Manager@123456"
    echo -e "  Agent   : agent@crm-immobilier.local / Agent@123456"
    exit 0
else
    echo -e "${RED}✗ CERTAINS TESTS ONT ÉCHOUÉ${NC}"
    echo -e "${YELLOW}Vérifiez que le backend NestJS est bien démarré sur $API_URL${NC}"
    exit 1
fi
