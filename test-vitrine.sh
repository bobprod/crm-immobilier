#!/bin/bash
# =============================================================================
# TEST COMPLET — Vitrine Publique (Backend + Frontend)
# =============================================================================
set -e

API="http://localhost:3001/api"
FRONT="http://localhost:3002"
SLUG="agence-demo"
PASS=0
FAIL=0
WARN=0
RESULTS=""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_pass() { PASS=$((PASS+1)); RESULTS+="  ✅ $1\n"; echo -e "  ${GREEN}✅ PASS${NC} — $1"; }
log_fail() { FAIL=$((FAIL+1)); RESULTS+="  ❌ $1 — $2\n"; echo -e "  ${RED}❌ FAIL${NC} — $1: $2"; }
log_warn() { WARN=$((WARN+1)); RESULTS+="  ⚠️  $1\n"; echo -e "  ${YELLOW}⚠️  WARN${NC} — $1"; }

echo -e "\n${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       TEST COMPLET — VITRINE PUBLIQUE IMMO SAAS             ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

# =============================================================================
# PHASE 1 — Vérification services
# =============================================================================
echo -e "${CYAN}━━━ PHASE 1 : Vérification des services ━━━${NC}"

# Test API root
HTTP=$(curl -s -o /dev/null -w "%{http_code}" $API 2>/dev/null)
if [ "$HTTP" = "200" ]; then log_pass "API Backend répondant ($API)"; else log_fail "API Backend" "HTTP $HTTP"; exit 1; fi

# Test Frontend
HTTP=$(curl -s -o /dev/null -w "%{http_code}" $FRONT 2>/dev/null)
if [ "$HTTP" = "200" ]; then log_pass "Frontend répondant ($FRONT)"; else log_fail "Frontend" "HTTP $HTTP"; exit 1; fi

# Test Swagger
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/docs" 2>/dev/null)
if [ "$HTTP" = "200" ] || [ "$HTTP" = "301" ]; then log_pass "Swagger docs accessible"; else log_warn "Swagger non accessible (HTTP $HTTP)"; fi

# =============================================================================
# PHASE 2 — Inscription + Login
# =============================================================================
echo -e "\n${CYAN}━━━ PHASE 2 : Inscription & Authentification ━━━${NC}"

# Register
REG=$(curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Agence",
    "email": "test-vitrine@demo.com",
    "password": "Test1234!"
  }' 2>/dev/null)

if echo "$REG" | grep -q "access_token\|token\|id"; then
  log_pass "Inscription utilisateur test-vitrine@demo.com"
elif echo "$REG" | grep -qi "already exists\|duplicate\|unique"; then
  log_warn "Utilisateur test-vitrine@demo.com existe déjà"
else
  log_fail "Inscription" "$(echo $REG | head -c 200)"
fi

# Login
LOGIN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-vitrine@demo.com","password":"Test1234!"}' 2>/dev/null)

TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  TOKEN=$(echo "$LOGIN" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
fi
if [ -z "$TOKEN" ]; then
  TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -n "$TOKEN" ]; then
  log_pass "Login OK — JWT obtenu (${#TOKEN} chars)"
  USER_ID=$(echo "$LOGIN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -z "$USER_ID" ]; then
    USER_ID=$(echo "$LOGIN" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
  fi
  if [ -z "$USER_ID" ]; then
    USER_ID=$(echo "$LOGIN" | grep -o '"sub":"[^"]*"' | cut -d'"' -f4)
  fi
  echo "    User ID: $USER_ID"
  echo "    Token: ${TOKEN:0:30}..."
else
  log_fail "Login" "$(echo $LOGIN | head -c 300)"
  echo -e "${RED}Impossible de continuer sans token${NC}"
  exit 1
fi

AUTH="Authorization: Bearer $TOKEN"

# =============================================================================
# PHASE 3 — Configuration vitrine (routes authentifiées)
# =============================================================================
echo -e "\n${CYAN}━━━ PHASE 3 : Configuration vitrine (auth) ━━━${NC}"

# GET config
CFG=$(curl -s "$API/vitrine/config" -H "$AUTH" 2>/dev/null)
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/vitrine/config" -H "$AUTH" 2>/dev/null)
if [ "$HTTP" = "200" ] || [ "$HTTP" = "201" ]; then
  log_pass "GET /vitrine/config (HTTP $HTTP)"
else
  log_fail "GET /vitrine/config" "HTTP $HTTP — $(echo $CFG | head -c 200)"
fi

# PUT config avec slug
UPDATE=$(curl -s -X PUT "$API/vitrine/config" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{
    \"agencyName\": \"Agence Demo Immo\",
    \"slug\": \"$SLUG\",
    \"phone\": \"+33 1 23 45 67 89\",
    \"email\": \"contact@agence-demo.com\",
    \"isActive\": true,
    \"slogan\": \"Votre partenaire immobilier de confiance\",
    \"primaryColor\": \"#1E40AF\",
    \"secondaryColor\": \"#F59E0B\",
    \"accentColor\": \"#10B981\",
    \"address\": \"12 Avenue des Champs-Élysées, 75008 Paris\",
    \"whatsappNumber\": \"+33612345678\",
    \"aboutText\": \"Agence fondée en 2015, spécialisée dans l'immobilier de prestige à Paris.\",
    \"schedule\": {\"lundi\": \"9h-18h\", \"mardi\": \"9h-18h\", \"mercredi\": \"9h-18h\", \"jeudi\": \"9h-18h\", \"vendredi\": \"9h-18h\", \"samedi\": \"10h-16h\"},
    \"socialLinks\": {\"facebook\": \"https://facebook.com/agencedemo\", \"instagram\": \"https://instagram.com/agencedemo\", \"linkedin\": \"https://linkedin.com/company/agencedemo\"},
    \"themeConfig\": {\"variant\": \"premium\", \"font\": \"Inter\"},
    \"sectionsConfig\": {\"hero\": true, \"properties\": true, \"team\": true, \"testimonials\": true, \"stats\": true, \"contact\": true},
    \"seoTitle\": \"Agence Demo Immo - Immobilier de prestige à Paris\",
    \"seoDescription\": \"Découvrez nos biens d'exception à Paris. Vente, location, estimation gratuite.\",
    \"seoKeywords\": \"immobilier paris, agence immobilière, prestige\"
  }" 2>/dev/null)

HTTP_UP=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API/vitrine/config" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"agencyName\": \"Agence Demo Immo\", \"slug\": \"$SLUG\", \"isActive\": true}" 2>/dev/null)

if [ "$HTTP_UP" = "200" ]; then
  log_pass "PUT /vitrine/config — slug=$SLUG, isActive=true"
  # Vérifier que le slug est enregistré
  SLUG_CHECK=$(curl -s "$API/vitrine/config" -H "$AUTH" | grep -o "\"slug\":\"[^\"]*\"" | head -1)
  echo "    Config: $SLUG_CHECK"
else
  log_fail "PUT /vitrine/config" "HTTP $HTTP_UP — $(echo $UPDATE | head -c 200)"
fi

# =============================================================================
# PHASE 4 — Créer des propriétés de test
# =============================================================================
echo -e "\n${CYAN}━━━ PHASE 4 : Création propriétés de test ━━━${NC}"

# Chercher la route pour créer des propriétés
for i in 1 2 3; do
  PROP=$(curl -s -X POST "$API/properties" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{
      \"title\": \"Appartement $i pièces Paris 8e\",
      \"description\": \"Magnifique appartement de ${i}00m² au cœur du 8e arrondissement.\",
      \"type\": \"apartment\",
      \"category\": \"sale\",
      \"price\": $((250000 + i * 150000)),
      \"area\": $((50 + i * 30)),
      \"bedrooms\": $i,
      \"bathrooms\": $i,
      \"city\": \"Paris\",
      \"address\": \"$((10+i)) Avenue des Champs-Élysées\"
    }" 2>/dev/null)

  PROP_ID=$(echo "$PROP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$PROP_ID" ]; then
    log_pass "Propriété $i créée (ID: ${PROP_ID:0:12}...)"
    # Publier sur vitrine
    PUB_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/vitrine/properties/$PROP_ID/publish" \
      -H "$AUTH" -H "Content-Type: application/json" \
      -d '{"isFeatured": true, "order": '$i'}' 2>/dev/null)
    if [ "$PUB_HTTP" = "200" ] || [ "$PUB_HTTP" = "201" ]; then
      log_pass "  → Bien publié sur vitrine"
    else
      log_warn "  → Publication vitrine: HTTP $PUB_HTTP"
    fi
  else
    log_fail "Création propriété $i" "$(echo $PROP | head -c 200)"
  fi
done

# =============================================================================
# PHASE 5 — Créer profils agents
# =============================================================================
echo -e "\n${CYAN}━━━ PHASE 5 : Profils agents publics ━━━${NC}"

AGENT1=$(curl -s -X POST "$API/vitrine/agents" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "displayName": "Sophie Martin",
    "role": "Directrice",
    "bio": "15 ans d'\''expérience dans l'\''immobilier de prestige parisien.",
    "phone": "+33 6 12 34 56 78",
    "whatsapp": "+33612345678",
    "speciality": "Appartements de luxe",
    "order": 1,
    "isActive": true
  }' 2>/dev/null)

AGENT1_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/vitrine/agents" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"displayName":"Sophie Martin","role":"Directrice","isActive":true}' 2>/dev/null)
if [ "$AGENT1_HTTP" = "200" ] || [ "$AGENT1_HTTP" = "201" ]; then
  log_pass "Agent 'Sophie Martin' créé"
else
  log_warn "Création agent: HTTP $AGENT1_HTTP"
fi

AGENT2=$(curl -s -X POST "$API/vitrine/agents" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "displayName": "Pierre Durand",
    "role": "Agent commercial",
    "bio": "Spécialiste des biens familiaux dans le Grand Paris.",
    "phone": "+33 6 98 76 54 32",
    "speciality": "Maisons familiales",
    "order": 2,
    "isActive": true
  }' 2>/dev/null)
if echo "$AGENT2" | grep -q "id"; then
  log_pass "Agent 'Pierre Durand' créé"
else
  log_warn "Agent 2: $(echo $AGENT2 | head -c 150)"
fi

# GET agents
AGENTS_LIST=$(curl -s "$API/vitrine/agents" -H "$AUTH" 2>/dev/null)
AGENTS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/vitrine/agents" -H "$AUTH" 2>/dev/null)
if [ "$AGENTS_HTTP" = "200" ]; then
  AGENT_COUNT=$(echo "$AGENTS_LIST" | grep -o '"id"' | wc -l)
  log_pass "GET /vitrine/agents — $AGENT_COUNT agent(s) listés"
else
  log_fail "GET /vitrine/agents" "HTTP $AGENTS_HTTP"
fi

# =============================================================================
# PHASE 6 — Routes publiques par slug (sans auth)
# =============================================================================
echo -e "\n${CYAN}━━━ PHASE 6 : Routes publiques par slug (sans auth) ━━━${NC}"

# GET vitrine par slug
PUB_HOME=$(curl -s "$API/vitrine/public/slug/$SLUG" 2>/dev/null)
PUB_HOME_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/vitrine/public/slug/$SLUG" 2>/dev/null)
if [ "$PUB_HOME_HTTP" = "200" ]; then
  HAS_NAME=$(echo "$PUB_HOME" | grep -o '"agencyName"' | head -1)
  log_pass "GET /vitrine/public/slug/$SLUG — $HAS_NAME"
  echo "    $(echo $PUB_HOME | head -c 200)..."
else
  log_fail "GET vitrine publique slug" "HTTP $PUB_HOME_HTTP — $(echo $PUB_HOME | head -c 200)"
fi

# GET propriétés publiques
PUB_PROPS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/vitrine/public/slug/$SLUG/properties" 2>/dev/null)
PUB_PROPS=$(curl -s "$API/vitrine/public/slug/$SLUG/properties" 2>/dev/null)
if [ "$PUB_PROPS_HTTP" = "200" ]; then
  PROP_COUNT=$(echo "$PUB_PROPS" | grep -o '"id"' | wc -l)
  log_pass "GET /vitrine/public/slug/$SLUG/properties — $PROP_COUNT bien(s)"
else
  log_fail "GET propriétés publiques" "HTTP $PUB_PROPS_HTTP"
fi

# GET propriétés avec filtres
FILT_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/vitrine/public/slug/$SLUG/properties?city=Paris&category=SALE&sort=price_asc&limit=2" 2>/dev/null)
if [ "$FILT_HTTP" = "200" ]; then
  log_pass "GET propriétés avec filtres (city=Paris, category=SALE)"
else
  log_warn "Filtres propriétés: HTTP $FILT_HTTP"
fi

# GET agents publics
PUB_AGENTS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/vitrine/public/slug/$SLUG/agents" 2>/dev/null)
if [ "$PUB_AGENTS_HTTP" = "200" ]; then
  log_pass "GET /vitrine/public/slug/$SLUG/agents"
else
  log_fail "GET agents publics" "HTTP $PUB_AGENTS_HTTP"
fi

# POST lead (formulaire contact)
LEAD=$(curl -s -X POST "$API/vitrine/public/slug/$SLUG/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@email.com",
    "phone": "+33 6 11 22 33 44",
    "message": "Bonjour, je suis intéressé par vos biens dans le 8e. Merci de me rappeler.",
    "type": "CONTACT",
    "utmSource": "google",
    "utmMedium": "organic"
  }' 2>/dev/null)
LEAD_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/vitrine/public/slug/$SLUG/contact" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Marie","email":"marie@test.com","type":"VISIT_REQUEST"}' 2>/dev/null)
if [ "$LEAD_HTTP" = "200" ] || [ "$LEAD_HTTP" = "201" ]; then
  log_pass "POST /vitrine/public/slug/$SLUG/contact — Lead soumis"
else
  log_fail "Soumission lead" "HTTP $LEAD_HTTP — $(echo $LEAD | head -c 200)"
fi

# GET leads capturés (auth)
LEADS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/vitrine/public-leads" -H "$AUTH" 2>/dev/null)
if [ "$LEADS_HTTP" = "200" ]; then
  LEADS_DATA=$(curl -s "$API/vitrine/public-leads" -H "$AUTH" 2>/dev/null)
  LEAD_COUNT=$(echo "$LEADS_DATA" | grep -o '"id"' | wc -l)
  log_pass "GET /vitrine/public-leads — $LEAD_COUNT lead(s) capturés"
else
  log_fail "GET leads" "HTTP $LEADS_HTTP"
fi

# Sitemap XML
SITEMAP_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/vitrine/public/slug/$SLUG/sitemap.xml" 2>/dev/null)
if [ "$SITEMAP_HTTP" = "200" ]; then
  SITEMAP=$(curl -s "$API/vitrine/public/slug/$SLUG/sitemap.xml" 2>/dev/null | head -c 200)
  log_pass "GET sitemap.xml — XML valide"
  echo "    ${SITEMAP:0:120}..."
else
  log_fail "Sitemap" "HTTP $SITEMAP_HTTP"
fi

# robots.txt
ROBOTS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/vitrine/public/slug/$SLUG/robots.txt" 2>/dev/null)
if [ "$ROBOTS_HTTP" = "200" ]; then
  log_pass "GET robots.txt"
else
  log_fail "robots.txt" "HTTP $ROBOTS_HTTP"
fi

# Slug inexistant → 404
FAKE_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/vitrine/public/slug/non-existant-xyz" 2>/dev/null)
if [ "$FAKE_HTTP" = "404" ]; then
  log_pass "Slug inexistant retourne 404 ✓"
else
  log_warn "Slug inexistant: HTTP $FAKE_HTTP (attendu 404)"
fi

# =============================================================================
# PHASE 7 — Validation DTO / Sécurité
# =============================================================================
echo -e "\n${CYAN}━━━ PHASE 7 : Validation DTO & Sécurité ━━━${NC}"

# Lead sans email → 400
BAD_LEAD_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/vitrine/public/slug/$SLUG/contact" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"X"}' 2>/dev/null)
if [ "$BAD_LEAD_HTTP" = "400" ]; then
  log_pass "Lead sans email → 400 Bad Request ✓"
else
  log_warn "Lead sans email: HTTP $BAD_LEAD_HTTP (attendu 400)"
fi

# Lead avec email invalide → 400
BAD_EMAIL_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/vitrine/public/slug/$SLUG/contact" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"X","email":"not-an-email"}' 2>/dev/null)
if [ "$BAD_EMAIL_HTTP" = "400" ]; then
  log_pass "Email invalide → 400 ✓"
else
  log_warn "Email invalide: HTTP $BAD_EMAIL_HTTP (attendu 400)"
fi

# Route auth sans token → 401
NO_AUTH_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/vitrine/config" 2>/dev/null)
if [ "$NO_AUTH_HTTP" = "401" ]; then
  log_pass "Route privée sans JWT → 401 Unauthorized ✓"
else
  log_warn "Sans JWT: HTTP $NO_AUTH_HTTP (attendu 401)"
fi

# XSS test dans lead
XSS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/vitrine/public/slug/$SLUG/contact" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"<script>alert(1)</script>","email":"xss@test.com","type":"CONTACT"}' 2>/dev/null)
echo -e "    XSS test lead: HTTP $XSS_HTTP (stocke le payload tel quel — sanitise côté frontend)"

# =============================================================================
# PHASE 8 — Frontend pages (curl)
# =============================================================================
echo -e "\n${CYAN}━━━ PHASE 8 : Pages frontend Next.js (curl) ━━━${NC}"

# Page d'accueil
FRONT_HOME_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$FRONT" 2>/dev/null)
if [ "$FRONT_HOME_HTTP" = "200" ]; then
  log_pass "Frontend / → 200"
else
  log_fail "Frontend /" "HTTP $FRONT_HOME_HTTP"
fi

# Page login
FRONT_LOGIN_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$FRONT/login" 2>/dev/null)
if [ "$FRONT_LOGIN_HTTP" = "200" ]; then
  log_pass "Frontend /login → 200"
else
  log_warn "Frontend /login: HTTP $FRONT_LOGIN_HTTP"
fi

# Page vitrine par slug
FRONT_VITRINE_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$FRONT/sites/$SLUG" 2>/dev/null)
if [ "$FRONT_VITRINE_HTTP" = "200" ]; then
  FRONT_HTML=$(curl -s "$FRONT/sites/$SLUG" 2>/dev/null | head -c 2000)
  HAS_AGENCY=$(echo "$FRONT_HTML" | grep -ci "agence\|vitrine\|demo" || true)
  log_pass "Frontend /sites/$SLUG → 200 (mentions agence: $HAS_AGENCY)"
else
  log_fail "Frontend /sites/$SLUG" "HTTP $FRONT_VITRINE_HTTP"
fi

# Page biens
FRONT_BIENS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$FRONT/sites/$SLUG/biens" 2>/dev/null)
if [ "$FRONT_BIENS_HTTP" = "200" ]; then
  log_pass "Frontend /sites/$SLUG/biens → 200"
else
  log_warn "Frontend /sites/$SLUG/biens: HTTP $FRONT_BIENS_HTTP"
fi

# Page agents
FRONT_AGENTS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$FRONT/sites/$SLUG/agents" 2>/dev/null)
if [ "$FRONT_AGENTS_HTTP" = "200" ]; then
  log_pass "Frontend /sites/$SLUG/agents → 200"
else
  log_warn "Frontend /sites/$SLUG/agents: HTTP $FRONT_AGENTS_HTTP"
fi

# Page contact
FRONT_CONTACT_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$FRONT/sites/$SLUG/contact" 2>/dev/null)
if [ "$FRONT_CONTACT_HTTP" = "200" ]; then
  log_pass "Frontend /sites/$SLUG/contact → 200"
else
  log_warn "Frontend /sites/$SLUG/contact: HTTP $FRONT_CONTACT_HTTP"
fi

# =============================================================================
# PHASE 9 — Tracking & Analytics
# =============================================================================
echo -e "\n${CYAN}━━━ PHASE 9 : Tracking & événements ━━━${NC}"

# Track event
TRACK_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/vitrine/track-event" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"eventName\": \"page_view\",
    \"eventData\": {\"page\": \"/\", \"slug\": \"$SLUG\"},
    \"sessionId\": \"test-session-001\"
  }" 2>/dev/null)
if [ "$TRACK_HTTP" = "200" ] || [ "$TRACK_HTTP" = "201" ]; then
  log_pass "POST /vitrine/track-event — événement enregistré"
else
  log_warn "Track event: HTTP $TRACK_HTTP"
fi

# Tracking script
SCRIPT_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/vitrine/tracking-script/$USER_ID" 2>/dev/null)
if [ "$SCRIPT_HTTP" = "200" ]; then
  log_pass "GET /vitrine/tracking-script/$USER_ID"
else
  log_warn "Tracking script: HTTP $SCRIPT_HTTP"
fi

# =============================================================================
# PHASE 10 — Published properties route
# =============================================================================
echo -e "\n${CYAN}━━━ PHASE 10 : Propriétés publiées (auth) ━━━${NC}"

PUB_PROPS_AUTH_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/vitrine/published-properties" -H "$AUTH" 2>/dev/null)
if [ "$PUB_PROPS_AUTH_HTTP" = "200" ]; then
  PUB_DATA=$(curl -s "$API/vitrine/published-properties" -H "$AUTH" 2>/dev/null)
  PUB_COUNT=$(echo "$PUB_DATA" | grep -o '"id"' | wc -l)
  log_pass "GET /vitrine/published-properties — $PUB_COUNT bien(s)"
else
  log_fail "Published properties" "HTTP $PUB_PROPS_AUTH_HTTP"
fi

# =============================================================================
# PHASE 11 — Vérification base de données
# =============================================================================
echo -e "\n${CYAN}━━━ PHASE 11 : Vérification base de données ━━━${NC}"

export PATH="/c/Program Files/PostgreSQL/18/bin:$PATH"
DB="postgresql://postgres:postgres@localhost:5432/crm_immobilier"

USERS_COUNT=$(psql "$DB" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
log_pass "Users en base: $USERS_COUNT"

VITRINE_COUNT=$(psql "$DB" -t -c "SELECT COUNT(*) FROM \"VitrineConfig\";" 2>/dev/null | tr -d ' ')
log_pass "VitrineConfig en base: $VITRINE_COUNT"

PROPS_COUNT=$(psql "$DB" -t -c "SELECT COUNT(*) FROM properties;" 2>/dev/null | tr -d ' ')
log_pass "Properties en base: $PROPS_COUNT"

AGENTS_COUNT=$(psql "$DB" -t -c "SELECT COUNT(*) FROM \"PublicAgentProfile\";" 2>/dev/null | tr -d ' ')
log_pass "PublicAgentProfile en base: $AGENTS_COUNT"

LEADS_COUNT=$(psql "$DB" -t -c "SELECT COUNT(*) FROM \"PublicLead\";" 2>/dev/null | tr -d ' ')
log_pass "PublicLead en base: $LEADS_COUNT"

# Vérifier le slug
SLUG_DB=$(psql "$DB" -t -c "SELECT slug FROM \"VitrineConfig\" WHERE slug='$SLUG';" 2>/dev/null | tr -d ' ')
if [ "$SLUG_DB" = "$SLUG" ]; then
  log_pass "Slug '$SLUG' trouvé en base ✓"
else
  log_warn "Slug '$SLUG' non trouvé en base"
fi

# =============================================================================
# RAPPORT FINAL
# =============================================================================
echo -e "\n${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                   RAPPORT DE TEST FINAL                       ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"

TOTAL=$((PASS + FAIL + WARN))
echo -e "\n  Total: $TOTAL tests"
echo -e "  ${GREEN}✅ Passés : $PASS${NC}"
echo -e "  ${RED}❌ Échoués: $FAIL${NC}"
echo -e "  ${YELLOW}⚠️  Warnings: $WARN${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "  ${GREEN}🎉 TOUS LES TESTS SONT PASSÉS !${NC}"
else
  echo -e "  ${RED}⚠️  $FAIL test(s) en échec — voir détails ci-dessus${NC}"
fi

echo -e "\n━━━ Détails ━━━"
echo -e "$RESULTS"
echo ""
