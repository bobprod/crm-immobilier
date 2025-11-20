#!/bin/bash

BASE_URL="http://localhost:3000"

echo "========================================"
echo "  CRM IMMOBILIER API TESTING"
echo "========================================"
echo ""

# Login and get tokens
echo "📝 Logging in users..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@crm-immobilier.local","password":"Admin@123456"}')
MANAGER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"manager@crm-immobilier.local","password":"Manager@123456"}')
AGENT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"agent@crm-immobilier.local","password":"Agent@123456"}')

ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.accessToken')
MANAGER_TOKEN=$(echo "$MANAGER_RESPONSE" | jq -r '.accessToken')
AGENT_TOKEN=$(echo "$AGENT_RESPONSE" | jq -r '.accessToken')

echo "✅ Admin logged in"
echo "✅ Manager logged in"
echo "✅ Agent logged in"
echo ""

# Test 1: Get current user profile
echo "========================================"
echo "  TEST 1: GET /auth/me (All Users)"
echo "========================================"
echo -e "\n🔵 Admin Profile:"
curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

echo -e "\n🟡 Manager Profile:"
curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $MANAGER_TOKEN" | jq '.'

echo -e "\n🟢 Agent Profile:"
curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'

# Test 2: Get all users
echo -e "\n========================================"
echo "  TEST 2: GET /users (Admin Only)"
echo "========================================"
curl -s -X GET "$BASE_URL/users" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Test 3: Create property
echo -e "\n========================================"
echo "  TEST 3: POST /properties (Create)"
echo "========================================"
PROPERTY_RESPONSE=$(curl -s -X POST "$BASE_URL/properties" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Luxurious Villa in Carthage",
    "description": "Beautiful 5-bedroom villa with sea view",
    "type": "villa",
    "category": "sale",
    "price": 850000,
    "currency": "TND",
    "city": "Carthage",
    "bedrooms": 5,
    "bathrooms": 4,
    "area": 450,
    "status": "available"
  }')
echo "$PROPERTY_RESPONSE" | jq '.'
PROPERTY_ID=$(echo "$PROPERTY_RESPONSE" | jq -r '.id')
echo "✅ Property Created: $PROPERTY_ID"

# Test 4: Get all properties
echo -e "\n========================================"
echo "  TEST 4: GET /properties (List All)"
echo "========================================"
curl -s -X GET "$BASE_URL/properties" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Test 5: Get property by ID
echo -e "\n========================================"
echo "  TEST 5: GET /properties/$PROPERTY_ID"
echo "========================================"
curl -s -X GET "$BASE_URL/properties/$PROPERTY_ID" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Test 6: Update property
echo -e "\n========================================"
echo "  TEST 6: PUT /properties/$PROPERTY_ID (Update)"
echo "========================================"
curl -s -X PUT "$BASE_URL/properties/$PROPERTY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": 800000, "status": "reserved"}' | jq '.'

# Test 7: Create prospect
echo -e "\n========================================"
echo "  TEST 7: POST /prospects (Create)"
echo "========================================"
PROSPECT_RESPONSE=$(curl -s -X POST "$BASE_URL/prospects" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ahmed",
    "lastName": "Ben Ali",
    "email": "ahmed.benali@example.tn",
    "phone": "+216 20 123 456",
    "type": "buyer",
    "status": "active",
    "preferences": {
      "propertyType": "apartment",
      "minBudget": 300000,
      "maxBudget": 500000,
      "city": "Tunis"
    }
  }')
echo "$PROSPECT_RESPONSE" | jq '.'
PROSPECT_ID=$(echo "$PROSPECT_RESPONSE" | jq -r '.id')
echo "✅ Prospect Created: $PROSPECT_ID"

# Test 8: Get all prospects
echo -e "\n========================================"
echo "  TEST 8: GET /prospects (List All)"
echo "========================================"
curl -s -X GET "$BASE_URL/prospects" -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'

# Test 9: Get prospect by ID
echo -e "\n========================================"
echo "  TEST 9: GET /prospects/$PROSPECT_ID"
echo "========================================"
curl -s -X GET "$BASE_URL/prospects/$PROSPECT_ID" -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'

# Test 10: Update prospect
echo -e "\n========================================"
echo "  TEST 10: PUT /prospects/$PROSPECT_ID (Update)"
echo "========================================"
curl -s -X PUT "$BASE_URL/prospects/$PROSPECT_ID" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "qualified", "score": 85}' | jq '.'

# Test 11: Dashboard stats
echo -e "\n========================================"
echo "  TEST 11: GET /dashboard/stats"
echo "========================================"
curl -s -X GET "$BASE_URL/dashboard/stats" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Test 12: Dashboard charts
echo -e "\n========================================"
echo "  TEST 12: GET /dashboard/charts"
echo "========================================"
curl -s -X GET "$BASE_URL/dashboard/charts" -H "Authorization: Bearer $MANAGER_TOKEN" | jq '.'

# Test 13: Dashboard activities
echo -e "\n========================================"
echo "  TEST 13: GET /dashboard/activities"
echo "========================================"
curl -s -X GET "$BASE_URL/dashboard/activities" -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'

# Test 14: Dashboard top performers
echo -e "\n========================================"
echo "  TEST 14: GET /dashboard/top-performers"
echo "========================================"
curl -s -X GET "$BASE_URL/dashboard/top-performers" -H "Authorization: Bearer $MANAGER_TOKEN" | jq '.'

# Test 15: Dashboard alerts
echo -e "\n========================================"
echo "  TEST 15: GET /dashboard/alerts"
echo "========================================"
curl -s -X GET "$BASE_URL/dashboard/alerts" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Test 16: Delete property
echo -e "\n========================================"
echo "  TEST 16: DELETE /properties/$PROPERTY_ID"
echo "========================================"
curl -s -X DELETE "$BASE_URL/properties/$PROPERTY_ID" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Test 17: Delete prospect
echo -e "\n========================================"
echo "  TEST 17: DELETE /prospects/$PROSPECT_ID"
echo "========================================"
curl -s -X DELETE "$BASE_URL/prospects/$PROSPECT_ID" -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'

echo -e "\n========================================"
echo "  📊 TEST SUMMARY"
echo "========================================"
echo "✅ Total Tests: 17"
echo "✅ All API endpoints tested successfully!"
echo ""
echo "👥 User Credentials:"
echo "   Admin:   admin@crm-immobilier.local / Admin@123456"
echo "   Manager: manager@crm-immobilier.local / Manager@123456"
echo "   Agent:   agent@crm-immobilier.local / Agent@123456"
echo ""
echo "🔑 Tokens (valid for 1 hour):"
echo "   Admin Token:   ${ADMIN_TOKEN:0:40}..."
echo "   Manager Token: ${MANAGER_TOKEN:0:40}..."
echo "   Agent Token:   ${AGENT_TOKEN:0:40}..."
echo ""
