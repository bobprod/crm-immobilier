#!/bin/bash

###############################################################################
# TEST CRUD COMPLET - MODULE COMMUNICATIONS
# Script de test automatisé pour tous les endpoints du module Communications
###############################################################################

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BACKEND_URL:-http://localhost:3001}"
API_URL="${BASE_URL}/api"
TEST_EMAIL="agent@test.com"
TEST_PASSWORD="Test123!"
ACCESS_TOKEN=""

# Compteurs
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# IDs générés pendant les tests
TEMPLATE_ID=""
COMMUNICATION_ID=""

###############################################################################
# FONCTIONS UTILITAIRES
###############################################################################

# Afficher un titre de section
print_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Afficher le résultat d'un test
print_result() {
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    if [ "$1" = "PASS" ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}✓ PASS${NC} - $2"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}✗ FAIL${NC} - $2"
        if [ -n "$3" ]; then
            echo -e "  ${RED}Erreur: $3${NC}"
        fi
    fi
}

# Vérifier le code de statut HTTP
check_status() {
    local expected=$1
    local actual=$2
    local message=$3

    if [ "$actual" = "$expected" ]; then
        print_result "PASS" "$message (Status: $actual)"
        return 0
    else
        print_result "FAIL" "$message" "Expected status $expected but got $actual"
        return 1
    fi
}

# Vérifier si une propriété JSON existe
check_json_property() {
    local response=$1
    local property=$2
    local message=$3

    if echo "$response" | jq -e ".$property" > /dev/null 2>&1; then
        print_result "PASS" "$message"
        return 0
    else
        print_result "FAIL" "$message" "Property '$property' not found in response"
        return 1
    fi
}

###############################################################################
# AUTHENTIFICATION
###############################################################################

login() {
    print_section "AUTHENTIFICATION"

    echo "Connexion avec $TEST_EMAIL..."

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        "$API_URL/auth/login")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        ACCESS_TOKEN=$(echo "$BODY" | jq -r '.accessToken')
        print_result "PASS" "Authentification réussie"
        echo "Token: ${ACCESS_TOKEN:0:20}..."
        return 0
    else
        print_result "FAIL" "Authentification échouée" "HTTP $HTTP_CODE"
        echo "Response: $BODY"
        exit 1
    fi
}

###############################################################################
# TESTS - ENVOI DE MESSAGES
###############################################################################

test_send_email() {
    print_section "TEST - ENVOI D'EMAIL"

    # Test 1: Envoi d'email basique
    echo "Test 1: Envoi d'email basique..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d '{
            "to": "test@example.com",
            "subject": "Test Email CRUD",
            "body": "<h1>Test</h1><p>Email de test automatisé</p>"
        }' \
        "$API_URL/communications/email")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    check_status "201" "$HTTP_CODE" "Envoi d'email"
    check_json_property "$BODY" "success" "Réponse contient 'success'"
    check_json_property "$BODY" "messageId" "Réponse contient 'messageId'"

    # Sauvegarder l'ID de la communication
    COMMUNICATION_ID=$(echo "$BODY" | jq -r '.messageId')

    # Test 2: Email avec prospect
    echo -e "\nTest 2: Email avec prospectId..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d '{
            "to": "prospect@example.com",
            "subject": "Nouveau bien disponible",
            "body": "<p>Bonjour, nous avons un bien pour vous...</p>",
            "prospectId": "test-prospect-id"
        }' \
        "$API_URL/communications/email")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    check_status "201" "$HTTP_CODE" "Email avec prospectId"

    # Test 3: Validation email invalide
    echo -e "\nTest 3: Validation email invalide..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d '{
            "to": "email-invalide",
            "subject": "Test",
            "body": "Test"
        }' \
        "$API_URL/communications/email")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" = "400" ]; then
        print_result "PASS" "Validation email invalide rejetée"
    else
        print_result "FAIL" "Validation email invalide" "Expected 400 but got $HTTP_CODE"
    fi
}

test_send_sms() {
    print_section "TEST - ENVOI DE SMS"

    echo "Test: Envoi de SMS..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d '{
            "to": "+21655123456",
            "message": "Test SMS automatisé depuis script CRUD"
        }' \
        "$API_URL/communications/sms")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    check_status "201" "$HTTP_CODE" "Envoi de SMS"
    check_json_property "$BODY" "success" "Réponse contient 'success'"
}

test_send_whatsapp() {
    print_section "TEST - ENVOI WHATSAPP"

    echo "Test: Envoi WhatsApp..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d '{
            "to": "+21655123456",
            "message": "Test WhatsApp automatisé",
            "mediaUrl": "https://example.com/image.jpg"
        }' \
        "$API_URL/communications/whatsapp")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    check_status "201" "$HTTP_CODE" "Envoi WhatsApp"
    check_json_property "$BODY" "success" "Réponse contient 'success'"
}

###############################################################################
# TESTS - HISTORIQUE
###############################################################################

test_get_history() {
    print_section "TEST - HISTORIQUE DES COMMUNICATIONS"

    # Test 1: Récupérer l'historique complet
    echo "Test 1: Récupération historique complet..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$API_URL/communications/history")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    check_status "200" "$HTTP_CODE" "Récupération historique"

    # Vérifier que c'est un tableau
    if echo "$BODY" | jq -e '. | type == "array"' > /dev/null 2>&1; then
        print_result "PASS" "Réponse est un tableau"
        COUNT=$(echo "$BODY" | jq '. | length')
        echo "  → $COUNT communications trouvées"
    else
        print_result "FAIL" "Réponse n'est pas un tableau"
    fi

    # Test 2: Filtrer par type
    echo -e "\nTest 2: Filtrage par type (email)..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$API_URL/communications/history?type=email")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    check_status "200" "$HTTP_CODE" "Filtrage par type"

    # Test 3: Filtrer par statut
    echo -e "\nTest 3: Filtrage par statut (sent)..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$API_URL/communications/history?status=sent")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    check_status "200" "$HTTP_CODE" "Filtrage par statut"

    # Test 4: Limiter les résultats
    echo -e "\nTest 4: Limitation résultats (limit=5)..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$API_URL/communications/history?limit=5")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    check_status "200" "$HTTP_CODE" "Limitation résultats"

    COUNT=$(echo "$BODY" | jq '. | length')
    if [ "$COUNT" -le 5 ]; then
        print_result "PASS" "Limite respectée ($COUNT <= 5)"
    else
        print_result "FAIL" "Limite non respectée" "Got $COUNT items, expected max 5"
    fi
}

###############################################################################
# TESTS - TEMPLATES
###############################################################################

test_create_template() {
    print_section "TEST - CRÉATION DE TEMPLATE"

    echo "Test: Création d'un template email..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d '{
            "name": "Template Test CRUD",
            "type": "email",
            "subject": "Bienvenue {{prospectName}}",
            "content": "Bonjour {{prospectName}}, voici votre {{propertyType}}...",
            "variables": ["prospectName", "propertyType"]
        }' \
        "$API_URL/communications/templates")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    check_status "201" "$HTTP_CODE" "Création template"
    check_json_property "$BODY" "id" "Template contient un ID"
    check_json_property "$BODY" "name" "Template contient un nom"

    # Sauvegarder l'ID du template
    TEMPLATE_ID=$(echo "$BODY" | jq -r '.id')
    echo "  → Template ID: $TEMPLATE_ID"
}

test_get_templates() {
    print_section "TEST - RÉCUPÉRATION DES TEMPLATES"

    # Test 1: Tous les templates
    echo "Test 1: Récupération de tous les templates..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$API_URL/communications/templates")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    check_status "200" "$HTTP_CODE" "Récupération templates"

    if echo "$BODY" | jq -e '. | type == "array"' > /dev/null 2>&1; then
        print_result "PASS" "Réponse est un tableau"
        COUNT=$(echo "$BODY" | jq '. | length')
        echo "  → $COUNT templates trouvés"
    else
        print_result "FAIL" "Réponse n'est pas un tableau"
    fi

    # Test 2: Filtrer par type
    echo -e "\nTest 2: Filtrage par type (email)..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$API_URL/communications/templates?type=email")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    check_status "200" "$HTTP_CODE" "Filtrage templates par type"
}

test_update_template() {
    print_section "TEST - MISE À JOUR DE TEMPLATE"

    if [ -z "$TEMPLATE_ID" ]; then
        print_result "FAIL" "Mise à jour template" "Template ID non disponible"
        return
    fi

    echo "Test: Mise à jour du template $TEMPLATE_ID..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d '{
            "name": "Template Test CRUD (Modifié)",
            "subject": "Nouveau sujet {{prospectName}}"
        }' \
        "$API_URL/communications/templates/$TEMPLATE_ID")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    check_status "200" "$HTTP_CODE" "Mise à jour template"

    # Vérifier que le nom a changé
    UPDATED_NAME=$(echo "$BODY" | jq -r '.name')
    if [[ "$UPDATED_NAME" == *"Modifié"* ]]; then
        print_result "PASS" "Template modifié avec succès"
    else
        print_result "FAIL" "Template non modifié" "Name should contain 'Modifié'"
    fi
}

test_delete_template() {
    print_section "TEST - SUPPRESSION DE TEMPLATE"

    if [ -z "$TEMPLATE_ID" ]; then
        print_result "FAIL" "Suppression template" "Template ID non disponible"
        return
    fi

    echo "Test: Suppression du template $TEMPLATE_ID..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$API_URL/communications/templates/$TEMPLATE_ID")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    check_status "200" "$HTTP_CODE" "Suppression template"

    # Vérifier que le template n'existe plus
    echo -e "\nVérification: Le template ne doit plus exister..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$API_URL/communications/templates/$TEMPLATE_ID")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "404" ]; then
        print_result "PASS" "Template bien supprimé (404)"
    else
        print_result "FAIL" "Template toujours accessible" "Expected 404 but got $HTTP_CODE"
    fi
}

###############################################################################
# TESTS - STATISTIQUES
###############################################################################

test_get_stats() {
    print_section "TEST - STATISTIQUES"

    echo "Test: Récupération des statistiques..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$API_URL/communications/stats")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    check_status "200" "$HTTP_CODE" "Récupération statistiques"
    check_json_property "$BODY" "total" "Stats contient 'total'"
    check_json_property "$BODY" "sent" "Stats contient 'sent'"
    check_json_property "$BODY" "failed" "Stats contient 'failed'"
    check_json_property "$BODY" "byType" "Stats contient 'byType'"

    # Afficher les stats
    echo -e "\n  📊 Statistiques:"
    echo "  → Total: $(echo "$BODY" | jq -r '.total')"
    echo "  → Envoyés: $(echo "$BODY" | jq -r '.sent')"
    echo "  → Échoués: $(echo "$BODY" | jq -r '.failed')"
    echo "  → Email: $(echo "$BODY" | jq -r '.byType.email')"
    echo "  → SMS: $(echo "$BODY" | jq -r '.byType.sms')"
    echo "  → WhatsApp: $(echo "$BODY" | jq -r '.byType.whatsapp')"
}

###############################################################################
# TESTS - CONFIGURATION SMTP
###############################################################################

test_smtp_connection() {
    print_section "TEST - CONFIGURATION SMTP"

    echo "Test: Test de connexion SMTP..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$API_URL/communications/smtp/test-connection")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    check_status "201" "$HTTP_CODE" "Test connexion SMTP"
    check_json_property "$BODY" "success" "Réponse contient 'success'"

    # Afficher le résultat
    SUCCESS=$(echo "$BODY" | jq -r '.success')
    if [ "$SUCCESS" = "true" ]; then
        echo "  ✓ Configuration SMTP valide"
    else
        echo "  ✗ Configuration SMTP invalide"
    fi
}

test_send_test_email() {
    print_section "TEST - EMAIL DE TEST"

    echo "Test: Envoi d'email de test..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d '{"to":"test@example.com"}' \
        "$API_URL/communications/smtp/test-email")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    check_status "201" "$HTTP_CODE" "Envoi email de test"
    check_json_property "$BODY" "success" "Réponse contient 'success'"
}

###############################################################################
# TESTS - AUTORISATION
###############################################################################

test_authorization() {
    print_section "TEST - AUTORISATION"

    # Test 1: Accès sans token
    echo "Test 1: Accès sans token (doit échouer)..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        "$API_URL/communications/history")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "401" ]; then
        print_result "PASS" "Accès refusé sans token (401)"
    else
        print_result "FAIL" "Accès sans token" "Expected 401 but got $HTTP_CODE"
    fi

    # Test 2: Token invalide
    echo -e "\nTest 2: Accès avec token invalide..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer invalid-token-123" \
        "$API_URL/communications/history")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "401" ]; then
        print_result "PASS" "Accès refusé avec token invalide (401)"
    else
        print_result "FAIL" "Accès avec token invalide" "Expected 401 but got $HTTP_CODE"
    fi
}

###############################################################################
# RAPPORT FINAL
###############################################################################

print_summary() {
    print_section "RÉSUMÉ DES TESTS"

    PASS_RATE=0
    if [ "$TESTS_TOTAL" -gt 0 ]; then
        PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($TESTS_PASSED/$TESTS_TOTAL)*100}")
    fi

    echo -e "Total des tests   : ${BLUE}$TESTS_TOTAL${NC}"
    echo -e "Tests réussis     : ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests échoués     : ${RED}$TESTS_FAILED${NC}"
    echo -e "Taux de réussite  : ${YELLOW}$PASS_RATE%${NC}"

    if [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "\n${GREEN}✓ Tous les tests ont réussi !${NC}"
        return 0
    else
        echo -e "\n${RED}✗ Certains tests ont échoué.${NC}"
        return 1
    fi
}

###############################################################################
# EXÉCUTION PRINCIPALE
###############################################################################

main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║    TEST CRUD COMPLET - MODULE COMMUNICATIONS               ║"
    echo "║    CRM Immobilier                                          ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Vérifier les dépendances
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Erreur: 'jq' n'est pas installé.${NC}"
        echo "Installation: sudo apt-get install jq"
        exit 1
    fi

    # Authentification
    login

    # Tests d'envoi
    test_send_email
    test_send_sms
    test_send_whatsapp

    # Tests d'historique
    test_get_history

    # Tests de templates (CRUD complet)
    test_create_template
    test_get_templates
    test_update_template
    test_delete_template

    # Tests de statistiques
    test_get_stats

    # Tests SMTP
    test_smtp_connection
    test_send_test_email

    # Tests d'autorisation
    test_authorization

    # Afficher le rapport
    print_summary

    exit $?
}

# Lancer les tests
main
