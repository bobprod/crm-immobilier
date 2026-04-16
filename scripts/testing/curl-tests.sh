#!/bin/bash
# ====================================================
# Tests curl complets CRM Immobilier
# Usage: bash scripts/testing/curl-tests.sh
# ====================================================

BASE="http://localhost:3001/api"
PASS=0
FAIL=0
WARN=0

# ── Couleurs ─────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Helpers ──────────────────────────────────────────
ok()   { echo -e "${GREEN}✅ $1${NC}"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}❌ $1${NC}";   FAIL=$((FAIL+1)); }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; WARN=$((WARN+1)); }
sep()  { echo -e "${CYAN}── $1 ──${NC}"; }

test_route() {
  local label="$1"
  local method="${2:-GET}"
  local path="$3"
  local data="$4"
  local expected="${5:-200}"

  if [ -n "$data" ]; then
    CODE=$(curl -s -o /tmp/curl_resp.json -w "%{http_code}" -X "$method" \
      -H "Authorization: Bearer $T" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE/$path" 2>/dev/null)
  else
    CODE=$(curl -s -o /tmp/curl_resp.json -w "%{http_code}" -X "$method" \
      -H "Authorization: Bearer $T" \
      "$BASE/$path" 2>/dev/null)
  fi

  if [ "$CODE" = "$expected" ] || ([ "$expected" = "2xx" ] && [ "$CODE" -ge 200 ] && [ "$CODE" -lt 300 ]); then
    ok "$method $path -> $CODE"
  elif [ "$CODE" -eq 404 ]; then
    fail "$method $path -> $CODE NOT FOUND"
    cat /tmp/curl_resp.json 2>/dev/null | head -1
  elif [ "$CODE" -eq 401 ] || [ "$CODE" -eq 403 ]; then
    warn "$method $path -> $CODE AUTH"
  elif [ "$CODE" -eq 500 ]; then
    fail "$method $path -> $CODE SERVER ERROR"
    cat /tmp/curl_resp.json 2>/dev/null | head -1
  else
    warn "$method $path -> $CODE"
  fi
}

# ── 1. LOGIN ──────────────────────────────────────────
sep "AUTH — Login"
RESP=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"Admin123!"}')
T=$(echo "$RESP" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$T" ]; then
  ok "POST /auth/login -> 200 (token obtenu)"
else
  fail "POST /auth/login -> échec d'authentification"
  echo "Réponse: $RESP"
  exit 1
fi

test_route "GET /auth/me" GET "auth/me"

# ── 2. DOCUMENTS ─────────────────────────────────────
sep "DOCUMENTS"
test_route "GET /documents" GET "documents" "" "2xx"
test_route "GET /documents/stats/overview" GET "documents/stats/overview" "" "2xx"
test_route "GET /documents/categories/list" GET "documents/categories/list" "" "2xx"
test_route "GET /documents/templates/list" GET "documents/templates/list" "" "2xx"
test_route "GET /documents/ai/settings" GET "documents/ai/settings" "" "2xx"
test_route "GET /documents/ai/history" GET "documents/ai/history" "" "2xx"
test_route "GET /documents/ocr/history" GET "documents/ocr/history" "" "2xx"

# Créer une catégorie
test_route "POST /documents/categories" POST "documents/categories" \
  '{"name":"Test Catégorie","description":"Test","color":"#3B82F6"}' "2xx"

# Créer un template
test_route "POST /documents/templates" POST "documents/templates" \
  '{"name":"Modèle Test","content":"Contrat entre {{vendeur}} et {{acquereur}}","category":"vente"}' "2xx"

# ── 3. PROSPECTS ─────────────────────────────────────
sep "PROSPECTS"
test_route "GET /prospects" GET "prospects" "" "2xx"
test_route "POST /prospects (création)" POST "prospects" \
  '{"firstName":"Jean","lastName":"Test","email":"jean.test@example.com","phone":"0612345678","type":"buyer"}' "2xx"

# ── 4. PROPERTIES ────────────────────────────────────
sep "PROPERTIES"
test_route "GET /properties" GET "properties" "" "2xx"

# ── 5. COMMUNICATIONS ────────────────────────────────
sep "COMMUNICATIONS"
# /communications n'a pas de GET root — les routes sont history, templates, stats
test_route "GET /communications/templates" GET "communications/templates" "" "2xx"
test_route "GET /communications/history" GET "communications/history" "" "2xx"
test_route "GET /communications/stats" GET "communications/stats" "" "2xx"
test_route "GET /communications/settings" GET "communications/settings" "" "2xx"

# ── 6. PLANNING / APPOINTMENTS / TASKS ───────────────
sep "PLANNING"
test_route "GET /planning/unified" GET "planning/unified" "" "2xx"
test_route "GET /planning/boards" GET "planning/boards" "" "2xx"
test_route "GET /appointments" GET "appointments" "" "2xx"
test_route "GET /tasks" GET "tasks" "" "2xx"

# ── 7. USERS ─────────────────────────────────────────
sep "USERS"
test_route "GET /users/profile" GET "users/profile" "" "2xx"
test_route "GET /users" GET "users" "" "2xx"

# ── 8. MARKETING ─────────────────────────────────────
sep "MARKETING"
test_route "GET /marketing-tracking/events" GET "marketing-tracking/events" "" "2xx"
test_route "GET /marketing-tracking/events/stats" GET "marketing-tracking/events/stats" "" "2xx"
test_route "GET /marketing-tracking/analytics/dashboard" GET "marketing-tracking/analytics/dashboard" "" "2xx"
test_route "GET /marketing-tracking/automation/config" GET "marketing-tracking/automation/config" "" "2xx"
test_route "GET /marketing-tracking/config" GET "marketing-tracking/config" "" "2xx"
test_route "GET /campaigns" GET "campaigns" "" "2xx"

# ── 9. FINANCE ───────────────────────────────────────
sep "FINANCE"
test_route "GET /finance/commissions" GET "finance/commissions" "" "2xx"
test_route "GET /finance/invoices" GET "finance/invoices" "" "2xx"
test_route "GET /finance/payments" GET "finance/payments" "" "2xx"
test_route "GET /finance/stats" GET "finance/stats" "" "2xx"
test_route "GET /transactions" GET "transactions" "" "2xx"

# ── 10. VITRINE ──────────────────────────────────────
sep "VITRINE"
test_route "GET /vitrine/config" GET "vitrine/config" "" "2xx"
test_route "GET /vitrine/published-properties" GET "vitrine/published-properties" "" "2xx"
test_route "GET /vitrine/analytics" GET "vitrine/analytics" "" "2xx"

# ── 11. INTEGRATIONS ─────────────────────────────────
sep "INTEGRATIONS"
test_route "GET /integrations" GET "integrations" "" "2xx"

# ── 12. AI / DASHBOARD ───────────────────────────────
sep "AI & DASHBOARD"
test_route "GET /dashboard/stats" GET "dashboard/stats" "" "2xx"
test_route "GET /dashboard/charts" GET "dashboard/charts" "" "2xx"
test_route "GET /dashboard/activities" GET "dashboard/activities" "" "2xx"
test_route "GET /analytics/dashboard" GET "analytics/dashboard" "" "2xx"
test_route "GET /notifications" GET "notifications" "" "2xx"
test_route "GET /settings" GET "settings" "" "2xx"

# ── RÉSUMÉ ────────────────────────────────────────────
echo ""
echo -e "${CYAN}════════════════════════════════${NC}"
echo -e "${GREEN}✅ Passé  : $PASS${NC}"
echo -e "${YELLOW}⚠️  Warning: $WARN${NC}"
echo -e "${RED}❌ Échoué : $FAIL${NC}"
TOTAL=$((PASS+FAIL+WARN))
echo -e "${CYAN}Total    : $TOTAL tests${NC}"
echo -e "${CYAN}════════════════════════════════${NC}"
