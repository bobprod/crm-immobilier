#!/bin/bash
# Simple test to debug property creation

BASE_URL="http://localhost:3001/api"

echo "=== Step 1: Login ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"Admin123!"}')

echo "Login Response: $LOGIN_RESPONSE" | head -c 200
echo "..."

# Extract token using sed instead of grep
TOKEN=$(echo "$LOGIN_RESPONSE" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
USER_ID=$(echo "$LOGIN_RESPONSE" | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1)

echo ""
echo "Token extracted: ${TOKEN:0:50}..."
echo "User ID: $USER_ID"

if [ -z "$TOKEN" ] || [ "$TOKEN" = "$LOGIN_RESPONSE" ]; then
  echo "ERROR: Could not extract token"
  exit 1
fi

echo ""
echo "=== Step 2: Create Property ==="
echo "Sending POST request..."

PROPERTY_RESPONSE=$(curl -s -w "\n---HTTP_CODE:%{http_code}---" -X POST "$BASE_URL/properties" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Apartment",
    "type": "apartment",
    "category": "sale",
    "price": 250000
  }')

echo "Full Response:"
echo "$PROPERTY_RESPONSE"

echo ""
echo "=== Step 3: Create Prospect ==="
PROSPECT_RESPONSE=$(curl -s -w "\n---HTTP_CODE:%{http_code}---" -X POST "$BASE_URL/prospects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john'$(date +%s)'@test.com",
    "type": "buyer"
  }')

echo "Full Response:"
echo "$PROSPECT_RESPONSE"

echo ""
echo "=== Step 4: Create Task ==="
TASK_RESPONSE=$(curl -s -w "\n---HTTP_CODE:%{http_code}---" -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "status": "todo",
    "priority": "medium"
  }')

echo "Full Response:"
echo "$TASK_RESPONSE"

echo ""
echo "=== Done ==="
