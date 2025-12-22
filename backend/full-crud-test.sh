#!/bin/bash

# Test complet CRUD de toutes les APIs du backend CRM Immobilier
BASE_URL="http://localhost:3001/api"
TOKEN=""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    local method=$1
    local endpoint=$2
    local status=$3

    if [ "$status" = "200" ] || [ "$status" = "201" ]; then
        echo -e "${GREEN}✅ $method $endpoint (HTTP $status)${NC}"
    elif [ "$status" = "204" ]; then
        echo -e "${GREEN}✅ $method $endpoint (HTTP $status - No Content)${NC}"
    else
        echo -e "${RED}❌ $method $endpoint (HTTP $status)${NC}"
    fi
}

# Login et récupération du token
echo "🔐 Authentification..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"Admin123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
LOGGED_USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"userId":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Login OK${NC}\n"

# Variables pour stocker les IDs créés
USER_ID=""
PROPERTY_ID=""
PROSPECT_ID=""
APPOINTMENT_ID=""
TASK_ID=""
NOTIFICATION_ID=""
CAMPAIGN_ID=""
LEAD_ID=""

echo "========================================="
echo "          TESTS CRUD - USERS"
echo "========================================="

# GET Users
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN")
print_result "GET" "/users" "$STATUS"

# POST User
CREATE_USER=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser_'$(date +%s)'@test.com",
    "password":"Test123!",
    "firstName":"Test",
    "lastName":"User",
    "role":"agent"
  }')
STATUS=$(echo "$CREATE_USER" | tail -1)
USER_ID=$(echo "$CREATE_USER" | head -n -1 | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
print_result "POST" "/users (register)" "$STATUS"

# GET User by ID
if [ ! -z "$USER_ID" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/users/$USER_ID" \
      -H "Authorization: Bearer $TOKEN")
    print_result "GET" "/users/:id" "$STATUS"

    # PUT User
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE_URL/users/$USER_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"firstName":"Updated","lastName":"User"}')
    print_result "PUT" "/users/:id" "$STATUS"

    # DELETE User
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/users/$USER_ID" \
      -H "Authorization: Bearer $TOKEN")
    print_result "DELETE" "/users/:id" "$STATUS"
fi

echo ""
echo "========================================="
echo "        TESTS CRUD - PROPERTIES"
echo "========================================="

# GET Properties
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/properties" \
  -H "Authorization: Bearer $TOKEN")
print_result "GET" "/properties" "$STATUS"

# POST Property
CREATE_PROPERTY=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/properties" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Property",
    "type":"apartment",
    "status":"available",
    "price":250000,
    "surface":85,
    "rooms":3,
    "bedrooms":2,
    "address":"123 Test Street",
    "city":"Paris",
    "zipCode":"75001",
    "description":"Test property for CRUD testing"
  }')
STATUS=$(echo "$CREATE_PROPERTY" | tail -1)
PROPERTY_ID=$(echo "$CREATE_PROPERTY" | head -n -1 | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
print_result "POST" "/properties" "$STATUS"

# GET Property by ID
if [ ! -z "$PROPERTY_ID" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/properties/$PROPERTY_ID" \
      -H "Authorization: Bearer $TOKEN")
    print_result "GET" "/properties/:id" "$STATUS"

    # PUT Property
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE_URL/properties/$PROPERTY_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"title":"Updated Property","price":275000}')
    print_result "PUT" "/properties/:id" "$STATUS"

    # DELETE Property
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/properties/$PROPERTY_ID" \
      -H "Authorization: Bearer $TOKEN")
    print_result "DELETE" "/properties/:id" "$STATUS"
fi

echo ""
echo "========================================="
echo "        TESTS CRUD - PROSPECTS"
echo "========================================="

# GET Prospects
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/prospects" \
  -H "Authorization: Bearer $TOKEN")
print_result "GET" "/prospects" "$STATUS"

# POST Prospect
CREATE_PROSPECT=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/prospects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"John",
    "lastName":"Doe",
    "email":"john.doe.'$(date +%s)'@test.com",
    "phone":"+33612345678",
    "status":"active",
    "source":"web"
  }')
STATUS=$(echo "$CREATE_PROSPECT" | tail -1)
PROSPECT_ID=$(echo "$CREATE_PROSPECT" | head -n -1 | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
print_result "POST" "/prospects" "$STATUS"

# GET Prospect by ID
if [ ! -z "$PROSPECT_ID" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/prospects/$PROSPECT_ID" \
      -H "Authorization: Bearer $TOKEN")
    print_result "GET" "/prospects/:id" "$STATUS"

    # PUT Prospect
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE_URL/prospects/$PROSPECT_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"firstName":"John Updated","status":"qualified"}')
    print_result "PUT" "/prospects/:id" "$STATUS"

    # DELETE Prospect
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/prospects/$PROSPECT_ID" \
      -H "Authorization: Bearer $TOKEN")
    print_result "DELETE" "/prospects/:id" "$STATUS"
fi

echo ""
echo "========================================="
echo "       TESTS CRUD - APPOINTMENTS"
echo "========================================="

# GET Appointments
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/appointments" \
  -H "Authorization: Bearer $TOKEN")
print_result "GET" "/appointments" "$STATUS"

# POST Appointment (nécessite un prospect valide)
if [ ! -z "$PROSPECT_ID" ]; then
    CREATE_APPOINTMENT=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/appointments" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "prospectId":"'$PROSPECT_ID'",
        "title":"Test Meeting",
        "type":"visit",
        "startTime":"2025-12-20T10:00:00Z",
        "endTime":"2025-12-20T11:00:00Z",
        "status":"scheduled"
      }')
    STATUS=$(echo "$CREATE_APPOINTMENT" | tail -1)
    APPOINTMENT_ID=$(echo "$CREATE_APPOINTMENT" | head -n -1 | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    print_result "POST" "/appointments" "$STATUS"

    # GET Appointment by ID
    if [ ! -z "$APPOINTMENT_ID" ]; then
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/appointments/$APPOINTMENT_ID" \
          -H "Authorization: Bearer $TOKEN")
        print_result "GET" "/appointments/:id" "$STATUS"

        # PUT Appointment
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE_URL/appointments/$APPOINTMENT_ID" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"title":"Updated Meeting","status":"confirmed"}')
        print_result "PUT" "/appointments/:id" "$STATUS"

        # DELETE Appointment
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/appointments/$APPOINTMENT_ID" \
          -H "Authorization: Bearer $TOKEN")
        print_result "DELETE" "/appointments/:id" "$STATUS"
    fi
fi

echo ""
echo "========================================="
echo "          TESTS CRUD - TASKS"
echo "========================================="

# GET Tasks
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN")
print_result "GET" "/tasks" "$STATUS"

# POST Task
CREATE_TASK=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Task",
    "description":"This is a test task",
    "priority":"high",
    "status":"todo",
    "dueDate":"2025-12-25T12:00:00Z"
  }')
STATUS=$(echo "$CREATE_TASK" | tail -1)
TASK_ID=$(echo "$CREATE_TASK" | head -n -1 | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
print_result "POST" "/tasks" "$STATUS"

# GET Task by ID
if [ ! -z "$TASK_ID" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/tasks/$TASK_ID" \
      -H "Authorization: Bearer $TOKEN")
    print_result "GET" "/tasks/:id" "$STATUS"

    # PUT Task
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE_URL/tasks/$TASK_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"title":"Updated Task","status":"in_progress"}')
    print_result "PUT" "/tasks/:id" "$STATUS"

    # PUT Task Complete
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE_URL/tasks/$TASK_ID/complete" \
      -H "Authorization: Bearer $TOKEN")
    print_result "PUT" "/tasks/:id/complete" "$STATUS"

    # DELETE Task
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/tasks/$TASK_ID" \
      -H "Authorization: Bearer $TOKEN")
    print_result "DELETE" "/tasks/:id" "$STATUS"
fi

echo ""
echo "========================================="
echo "      TESTS CRUD - NOTIFICATIONS"
echo "========================================="

# GET Notifications
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TOKEN")
print_result "GET" "/notifications" "$STATUS"

# POST Notification
CREATE_NOTIFICATION=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\":\"$LOGGED_USER_ID\",
    \"title\":\"Test Notification\",
    \"message\":\"This is a test notification\",
    \"type\":\"system\"
  }")
STATUS=$(echo "$CREATE_NOTIFICATION" | tail -1)
NOTIFICATION_ID=$(echo "$CREATE_NOTIFICATION" | head -n -1 | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
print_result "POST" "/notifications" "$STATUS"

# UPDATE Notification (modify)
if [ ! -z "$NOTIFICATION_ID" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/notifications/$NOTIFICATION_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "title":"Updated Notification Title",
        "message":"This notification has been updated"
      }')
    print_result "PATCH" "/notifications/:id" "$STATUS"

    # GET Notification (mark as read)
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/notifications/$NOTIFICATION_ID/read" \
      -H "Authorization: Bearer $TOKEN")
    print_result "PATCH" "/notifications/:id/read" "$STATUS"

    # DELETE Notification
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/notifications/$NOTIFICATION_ID" \
      -H "Authorization: Bearer $TOKEN")
    print_result "DELETE" "/notifications/:id" "$STATUS"
fi

echo ""
echo "========================================="
echo "    TESTS CRUD - PROSPECTING CAMPAIGNS"
echo "========================================="

# GET Campaigns
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/prospecting/campaigns" \
  -H "Authorization: Bearer $TOKEN")
print_result "GET" "/prospecting/campaigns" "$STATUS"

# POST Campaign
CREATE_CAMPAIGN=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/prospecting/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Campaign",
    "description":"Test prospecting campaign",
    "status":"draft",
    "source":"manual"
  }')
STATUS=$(echo "$CREATE_CAMPAIGN" | tail -1)
CAMPAIGN_ID=$(echo "$CREATE_CAMPAIGN" | head -n -1 | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
print_result "POST" "/prospecting/campaigns" "$STATUS"

# GET Campaign by ID
if [ ! -z "$CAMPAIGN_ID" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/prospecting/campaigns/$CAMPAIGN_ID" \
      -H "Authorization: Bearer $TOKEN")
    print_result "GET" "/prospecting/campaigns/:id" "$STATUS"

    # PUT Campaign
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE_URL/prospecting/campaigns/$CAMPAIGN_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"name":"Updated Campaign","status":"active"}')
    print_result "PUT" "/prospecting/campaigns/:id" "$STATUS"

    # DELETE Campaign
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/prospecting/campaigns/$CAMPAIGN_ID" \
      -H "Authorization: Bearer $TOKEN")
    print_result "DELETE" "/prospecting/campaigns/:id" "$STATUS"
fi

echo ""
echo "========================================="
echo "          TESTS - LLM CONFIG"
echo "========================================="

# GET LLM Config
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/llm-config" \
  -H "Authorization: Bearer $TOKEN")
print_result "GET" "/llm-config" "$STATUS"

# PUT LLM Config
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE_URL/llm-config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider":"openai",
    "model":"gpt-4",
    "apiKey":"test-key"
  }')
print_result "PUT" "/llm-config" "$STATUS"

echo ""
echo "========================================="
echo "      TESTS - ANALYTICS DASHBOARD"
echo "========================================="

# GET Analytics Dashboard
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/analytics/dashboard" \
  -H "Authorization: Bearer $TOKEN")
print_result "GET" "/analytics/dashboard" "$STATUS"

echo ""
echo "========================================="
echo "       TESTS - DASHBOARD STATS"
echo "========================================="

# GET Dashboard Stats
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN")
print_result "GET" "/dashboard/stats" "$STATUS"

echo ""
echo "========================================="
echo "           TESTS TERMINÉS"
echo "========================================="
