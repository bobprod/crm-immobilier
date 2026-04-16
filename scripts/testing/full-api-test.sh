#!/bin/bash
# Full API Test Suite - CRM ImmoSaaS
# Usage: bash scripts/testing/full-api-test.sh

BASE_URL="http://localhost:3001"
PASS=0
FAIL=0

TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"Admin123!"}' \
  | python -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "FAIL Login impossible"
  exit 1
fi
echo "OK  Login"
PASS=$((PASS+1))

check() {
  local METHOD="${3:-GET}"
  local code=$(curl -s -o /dev/null -w "%{http_code}" -X "$METHOD" \
    -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/$1")
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo "OK  $1"
    PASS=$((PASS+1))
  else
    echo "FAIL $1 (HTTP $code)"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "--- CORE ---"
check "users"
check "properties"
check "prospects"
check "appointments"
check "tasks"

echo ""
echo "--- MATCHING & PROSPECTING ---"
check "matching"
check "matching/stats"
check "prospecting/campaigns"
check "prospecting/stats"

echo ""
echo "--- COMMUNICATIONS ---"
check "communications/history"
check "communications/stats"
check "communications/settings"
check "communications/templates"

echo ""
echo "--- TRANSACTIONS & IMMOBILIER ---"
check "transactions"
check "transactions/stats"
check "mandates"
check "mandates/stats"
check "owners"

echo ""
echo "--- FINANCE ---"
check "finance/commissions"
check "finance/invoices"
check "finance/payments"
check "finance/stats"

echo ""
echo "--- PERSONNEL ---"
check "personnel/agents"
check "personnel/commission-config"

echo ""
echo "--- PLANNING ---"
check "planning/unified"
check "planning/boards"
check "planning/views"

echo ""
echo "--- PARAMETRES & IA ---"
check "settings"
check "notifications"
check "llm-config"
check "llm-config/providers"
check "analytics/dashboard"
check "dashboard/stats"
check "documents"

echo ""
echo "============================================"
echo "  RÉSULTAT: $PASS OK  |  $FAIL ÉCHECS"
TOTAL=$((PASS+FAIL))
PCT=$(( PASS * 100 / TOTAL ))
echo "  Couverture: $PCT% ($PASS/$TOTAL)"
echo "============================================"

[ $FAIL -eq 0 ] && exit 0 || exit 1
