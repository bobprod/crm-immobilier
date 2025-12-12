#!/bin/bash

BASE_URL="http://localhost:3001"

# Get token
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@crm.com","password":"Admin123!"}' | python -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Login OK"
echo ""

# Test function
test() {
  code=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL$1" -H "Authorization: Bearer $TOKEN")
  if [ "$code" = "200" ]; then
    echo "✅ $2"
  else
    echo "❌ $2 (HTTP $code)"
  fi
}

# Test endpoints
test "/api/users" "Users"
test "/api/properties" "Properties"
test "/api/prospects" "Prospects"
test "/api/appointments" "Appointments"
test "/api/tasks" "Tasks"
echo ""
test "/api/matching" "Matching"
test "/api/matching/stats" "Matching Stats"
test "/api/matching/interactions" "Matching Interactions"
echo ""
test "/api/prospecting/campaigns" "Prospecting Campaigns"
test "/api/prospecting/stats" "Prospecting Stats"
echo ""
test "/api/settings" "Settings"
test "/api/notifications" "Notifications"
test "/api/llm-config" "LLM Config"
test "/api/llm-config/providers" "LLM Providers"
echo ""
test "/api/analytics/dashboard" "Analytics Dashboard"
test "/api/dashboard/stats" "Dashboard Stats"
