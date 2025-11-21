#!/bin/bash

# ============================================
# Script de Test COMPLET - Tous les Endpoints
# ============================================

API_URL="http://localhost:3000/api"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Variables pour stocker les IDs
ADMIN_TOKEN=""
USER_ID=""
PROPERTY_ID=""
PROSPECT_ID=""
APPOINTMENT_ID=""
TASK_ID=""
DOCUMENT_ID=""
CATEGORY_ID=""
TEMPLATE_ID=""
CAMPAIGN_ID=""
MATCH_ID=""
PAGE_ID=""

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
        echo -e "  ${YELLOW}Response:${NC} $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Fonction pour afficher un titre de section
print_section() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

# Fonction pour extraire un ID de la réponse JSON
extract_id() {
    echo "$1" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4
}

echo -e "${YELLOW}"
echo "╔════════════════════════════════════════════════════╗"
echo "║  Test COMPLET de Tous les Endpoints API           ║"
echo "║  CRM Immobilier - Backend NestJS                   ║"
echo "║  API URL: $API_URL                          ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# 1. AUTHENTIFICATION
# ============================================
print_section "1. Authentification"

# Register Admin
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test-api.local",
    "password": "Admin@123456",
    "firstName": "Admin",
    "lastName": "Test"
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
USER_ID=$(extract_id "$body")
print_result "Register Admin" "$body" "$http_code"

# Login Admin
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test-api.local",
    "password": "Admin@123456"
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
ADMIN_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
print_result "Login Admin" "$body" "$http_code"

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}ERREUR: Impossible d'obtenir le token. Arrêt des tests.${NC}"
    exit 1
fi

# Update role to admin
if [ ! -z "$USER_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/users/$USER_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"role": "admin"}' 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    print_result "Update role to Admin" "$body" "$http_code"
fi

# Re-login with admin role
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test-api.local",
    "password": "Admin@123456"
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
ADMIN_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
print_result "Re-login with Admin role" "$body" "$http_code"

# Get current user profile
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /auth/me - Current user profile" "$body" "$http_code"

# ============================================
# 2. UTILISATEURS
# ============================================
print_section "2. Utilisateurs"

# List all users
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /users - List all users" "$body" "$http_code"

# Get user by ID
if [ ! -z "$USER_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/users/$USER_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    print_result "GET /users/:id - Get user by ID" "$body" "$http_code"
fi

# ============================================
# 3. PROPRIÉTÉS
# ============================================
print_section "3. Propriétés"

# Create property
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/properties" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Villa Moderne Test",
    "description": "Belle villa pour tests API",
    "type": "villa",
    "category": "sale",
    "price": 850000,
    "area": 250,
    "bedrooms": 4,
    "bathrooms": 3,
    "address": "10 Avenue Test",
    "city": "Nice",
    "zipCode": "06000"
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
PROPERTY_ID=$(extract_id "$body")
print_result "POST /properties - Create property" "$body" "$http_code"

# List properties
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/properties" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /properties - List all properties" "$body" "$http_code"

# Get property by ID
if [ ! -z "$PROPERTY_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/properties/$PROPERTY_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    print_result "GET /properties/:id - Get property by ID" "$body" "$http_code"

    # Update property
    response=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/properties/$PROPERTY_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"price": 800000}' 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    print_result "PUT /properties/:id - Update property" "$body" "$http_code"
fi

# ============================================
# 4. PROSPECTS
# ============================================
print_section "4. Prospects"

# Create prospect
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/prospects" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Marie",
    "lastName": "Test",
    "email": "marie.test@example.com",
    "phone": "+33612345678",
    "type": "buyer",
    "budget": 500000,
    "source": "api_test"
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
PROSPECT_ID=$(extract_id "$body")
print_result "POST /prospects - Create prospect" "$body" "$http_code"

# List prospects
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/prospects" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /prospects - List all prospects" "$body" "$http_code"

# Get prospect by ID
if [ ! -z "$PROSPECT_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/prospects/$PROSPECT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    print_result "GET /prospects/:id - Get prospect by ID" "$body" "$http_code"

    # Add interaction
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/prospects/$PROSPECT_ID/interactions" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"type": "call", "notes": "Test interaction"}' 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    print_result "POST /prospects/:id/interactions - Add interaction" "$body" "$http_code"

    # Get interactions
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/prospects/$PROSPECT_ID/interactions" \
      -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    print_result "GET /prospects/:id/interactions - Get interactions" "$body" "$http_code"
fi

# ============================================
# 5. RENDEZ-VOUS
# ============================================
print_section "5. Rendez-vous (Appointments)"

# Create appointment
if [ ! -z "$PROSPECT_ID" ] && [ ! -z "$PROPERTY_ID" ]; then
    # Générer des dates futures dynamiques pour éviter les conflits
    # Ajouter des heures aléatoires basées sur l'heure actuelle
    RANDOM_HOURS=$((RANDOM % 72 + 24))  # Entre 24 et 96 heures dans le futur
    START_TIME=$(date -u -d "+${RANDOM_HOURS} hours" +"%Y-%m-%dT%H:00:00Z" 2>/dev/null || date -u -v+${RANDOM_HOURS}H +"%Y-%m-%dT%H:00:00Z" 2>/dev/null || echo "2025-12-25T14:00:00Z")
    END_TIME=$(date -u -d "+${RANDOM_HOURS} hours +1 hour" +"%Y-%m-%dT%H:00:00Z" 2>/dev/null || date -u -v+${RANDOM_HOURS}H -v+1H +"%Y-%m-%dT%H:00:00Z" 2>/dev/null || echo "2025-12-25T15:00:00Z")

    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/appointments" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"title\": \"Visite Test API\",
        \"description\": \"Test automatique\",
        \"startTime\": \"$START_TIME\",
        \"endTime\": \"$END_TIME\",
        \"type\": \"visit\",
        \"status\": \"scheduled\",
        \"prospectId\": \"$PROSPECT_ID\",
        \"propertyId\": \"$PROPERTY_ID\"
      }" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    APPOINTMENT_ID=$(extract_id "$body")
    print_result "POST /appointments - Create appointment" "$body" "$http_code"
fi

# List appointments
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/appointments" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /appointments - List all appointments" "$body" "$http_code"

# Get upcoming appointments
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/appointments/upcoming?limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /appointments/upcoming - Get upcoming" "$body" "$http_code"

# Get today's appointments
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/appointments/today" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /appointments/today - Get today's appointments" "$body" "$http_code"

# Get stats
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/appointments/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /appointments/stats - Get stats" "$body" "$http_code"

# ============================================
# 6. TÂCHES
# ============================================
print_section "6. Tâches (Tasks)"

# Create task
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/tasks" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tâche Test API",
    "description": "Description test",
    "dueDate": "2025-12-25T18:00:00Z",
    "priority": "high",
    "status": "todo"
  }' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
TASK_ID=$(extract_id "$body")
print_result "POST /tasks - Create task" "$body" "$http_code"

# List tasks
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/tasks" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /tasks - List all tasks" "$body" "$http_code"

# Get tasks stats
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/tasks/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /tasks/stats - Get tasks stats" "$body" "$http_code"

# Get today's tasks
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/tasks/today" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /tasks/today - Get today's tasks" "$body" "$http_code"

# Get overdue tasks
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/tasks/overdue" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /tasks/overdue - Get overdue tasks" "$body" "$http_code"

# ============================================
# 7. ANALYTICS
# ============================================
print_section "7. Analytics"

# Dashboard analytics
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/analytics/dashboard" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /analytics/dashboard - Dashboard analytics" "$body" "$http_code"

# Prospects stats
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/analytics/prospects" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /analytics/prospects - Prospects stats" "$body" "$http_code"

# Properties stats
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/analytics/properties" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /analytics/properties - Properties stats" "$body" "$http_code"

# KPIs
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/analytics/kpis" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /analytics/kpis - Get KPIs" "$body" "$http_code"

# Trends
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/analytics/trends?period=month" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /analytics/trends - Get trends" "$body" "$http_code"

# ============================================
# 8. DOCUMENTS
# ============================================
print_section "8. Documents"

# List documents
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/documents" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /documents - List all documents" "$body" "$http_code"

# List categories
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/documents/categories/list" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /documents/categories/list - List categories" "$body" "$http_code"

# Get documents stats
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/documents/stats/overview" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /documents/stats/overview - Get stats" "$body" "$http_code"

# Get AI settings
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/documents/ai/settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /documents/ai/settings - Get AI settings" "$body" "$http_code"

# ============================================
# 9. COMMUNICATIONS
# ============================================
print_section "9. Communications"

# Get history
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/communications/history" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /communications/history - Get history" "$body" "$http_code"

# List templates
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/communications/templates" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /communications/templates - List templates" "$body" "$http_code"

# Get stats
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/communications/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /communications/stats - Get stats" "$body" "$http_code"

# ============================================
# 10. SETTINGS
# ============================================
print_section "10. Settings"

# Get all settings
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /settings - Get all settings" "$body" "$http_code"

# Get Pica AI config
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/settings/pica-ai/config" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /settings/pica-ai/config - Get Pica AI config" "$body" "$http_code"

# ============================================
# 11. DASHBOARD
# ============================================
print_section "11. Dashboard"

# Get dashboard stats
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/dashboard/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /dashboard/stats - Get stats" "$body" "$http_code"

# Get charts
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/dashboard/charts" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /dashboard/charts - Get charts data" "$body" "$http_code"

# Get activities
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/dashboard/activities" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /dashboard/activities - Get activities" "$body" "$http_code"

# Get top performers
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/dashboard/top-performers" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /dashboard/top-performers - Get top performers" "$body" "$http_code"

# Get alerts
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/dashboard/alerts" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /dashboard/alerts - Get alerts" "$body" "$http_code"

# ============================================
# 12. INTEGRATIONS
# ============================================
print_section "12. Integrations"

# List integrations
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/integrations" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /integrations - List all integrations" "$body" "$http_code"

# ============================================
# 13. CAMPAIGNS
# ============================================
print_section "13. Marketing Campaigns"

# List campaigns
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/campaigns" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /campaigns - List all campaigns" "$body" "$http_code"

# ============================================
# 14. MATCHING
# ============================================
print_section "14. Matching AI"

# Generate matches
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/matching/generate" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "POST /matching/generate - Generate matches" "$body" "$http_code"

# List matches
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/matching" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /matching - List matches" "$body" "$http_code"

# Get interactions
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/matching/interactions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /matching/interactions - Get interactions" "$body" "$http_code"

# ============================================
# 15. PROSPECTING
# ============================================
print_section "15. Prospecting"

# Get campaigns
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/prospecting/campaigns" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /prospecting/campaigns - Get campaigns" "$body" "$http_code"

# Get stats
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/prospecting/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /prospecting/stats - Get stats" "$body" "$http_code"

# ============================================
# 16. PAGE BUILDER
# ============================================
print_section "16. Page Builder"

# Get pages
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/page-builder/pages" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /page-builder/pages - Get pages" "$body" "$http_code"

# Get templates
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/page-builder/templates" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /page-builder/templates - Get templates" "$body" "$http_code"

# ============================================
# 17. VITRINE
# ============================================
print_section "17. Vitrine Publique"

# Get vitrine config
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/vitrine/config" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /vitrine/config - Get config" "$body" "$http_code"

# Get published properties
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/vitrine/published-properties" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /vitrine/published-properties - Get published" "$body" "$http_code"

# Get analytics
response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/vitrine/analytics" \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
print_result "GET /vitrine/analytics - Get analytics" "$body" "$http_code"

# ============================================
# RÉSUMÉ FINAL
# ============================================
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${YELLOW}         RÉSUMÉ COMPLET DES TESTS${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "Total de tests   : ${TOTAL_TESTS}"
echo -e "${GREEN}Tests réussis    : ${PASSED_TESTS}${NC}"
echo -e "${RED}Tests échoués    : ${FAILED_TESTS}${NC}"
echo ""

PERCENTAGE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
echo -e "Taux de réussite : ${PERCENTAGE}%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓✓✓ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS! ✓✓✓${NC}"
    echo ""
    echo -e "${YELLOW}Credentials créés:${NC}"
    echo -e "  Email    : admin@test-api.local"
    echo -e "  Password : Admin@123456"
    echo -e "  Role     : admin"
    echo -e "  User ID  : $USER_ID"
    echo ""
    echo -e "${YELLOW}Ressources créées:${NC}"
    echo -e "  Property ID    : $PROPERTY_ID"
    echo -e "  Prospect ID    : $PROSPECT_ID"
    echo -e "  Appointment ID : $APPOINTMENT_ID"
    echo -e "  Task ID        : $TASK_ID"
    exit 0
else
    echo -e "${RED}✗ CERTAINS TESTS ONT ÉCHOUÉ${NC}"
    echo -e "${YELLOW}Vérifiez que le backend NestJS est bien démarré${NC}"
    echo -e "${YELLOW}URL: http://localhost:3000${NC}"
    exit 1
fi
