#!/bin/bash

BASE_URL="http://localhost:3001"
echo "🧪 Testing all backend APIs..."

# Login and get token
echo "🔐 Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"Admin123!"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Login successful"

# Test endpoints
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4

  if [ "$method" = "GET" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL$endpoint" -H "Authorization: Bearer $TOKEN")
  else
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$data")
  fi

  if [ "$response" = "200" ] || [ "$response" = "201" ]; then
    echo "✅ $name: $response"
  else
    echo "❌ $name: $response"
  fi
}

echo ""
echo "📋 Testing CRUD endpoints..."
test_endpoint "Users" "GET" "/api/users"
test_endpoint "Properties" "GET" "/api/properties"
test_endpoint "Prospects" "GET" "/api/prospects"
test_endpoint "Appointments" "GET" "/api/appointments"
test_endpoint "Tasks" "GET" "/api/tasks"

echo ""
echo "🤖 Testing Intelligence endpoints..."
test_endpoint "Matching" "GET" "/api/matching"
test_endpoint "Matching Stats" "GET" "/api/matching/stats"
test_endpoint "Matching Interactions" "GET" "/api/matching/interactions"

echo ""
echo "🔍 Testing Prospecting endpoints..."
test_endpoint "Campaigns" "GET" "/api/prospecting/campaigns"
test_endpoint "Prospecting Stats" "GET" "/api/prospecting/stats"

echo ""
echo "⚙️ Testing Settings & Config..."
test_endpoint "Settings" "GET" "/api/settings"
test_endpoint "Notifications" "GET" "/api/notifications"
test_endpoint "LLM Config" "GET" "/api/llm-config"
test_endpoint "LLM Providers" "GET" "/api/llm-config/providers"

echo ""
echo "📊 Testing Analytics..."
test_endpoint "Analytics Dashboard" "GET" "/api/analytics/dashboard"
test_endpoint "Dashboard Stats" "GET" "/api/dashboard/stats"

echo ""
echo "✨ Test complete!"
