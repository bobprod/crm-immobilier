#!/bin/bash

# Script d'analyse de synchronisation Backend-Frontend
# CRM Immobilier - Modules: Mandates, Transactions, Finance

echo "=================================================="
echo "ANALYSE DE SYNCHRONISATION BACKEND-FRONTEND"
echo "=================================================="
echo ""

# Configuration
BACKEND_URL="http://localhost:3000"
TOKEN="" # À remplir avec un token JWT valide

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de test d'endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=${4:-200}

    echo -e "${BLUE}Testing:${NC} $method $endpoint"
    echo -e "         $description"

    if [ -z "$TOKEN" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BACKEND_URL$endpoint" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BACKEND_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" 2>&1)
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_status" ] || [ "$http_code" = "401" ]; then
        if [ "$http_code" = "401" ]; then
            echo -e "${YELLOW}⚠ Requires authentication (401)${NC}"
        else
            echo -e "${GREEN}✓ Success ($http_code)${NC}"
        fi
    else
        echo -e "${RED}✗ Failed (expected $expected_status, got $http_code)${NC}"
        echo -e "Response: $body"
    fi
    echo ""
}

echo "=================================================="
echo "1. ENDPOINTS MANDATS"
echo "=================================================="
echo ""

test_endpoint "GET" "/mandates" "Liste des mandats"
test_endpoint "GET" "/mandates/stats" "Statistiques des mandats"
test_endpoint "GET" "/mandates/expiring" "Mandats expirant bientôt"
test_endpoint "POST" "/mandates" "Création d'un mandat" 201

echo "=================================================="
echo "2. ENDPOINTS TRANSACTIONS"
echo "=================================================="
echo ""

test_endpoint "GET" "/transactions" "Liste des transactions"
test_endpoint "GET" "/transactions/stats" "Statistiques des transactions"
test_endpoint "POST" "/transactions" "Création d'une transaction" 201

echo "=================================================="
echo "3. ENDPOINTS FINANCE"
echo "=================================================="
echo ""

echo "--- Commissions ---"
test_endpoint "GET" "/finance/commissions" "Liste des commissions"
test_endpoint "POST" "/finance/commissions" "Création d'une commission" 201

echo "--- Invoices ---"
test_endpoint "GET" "/finance/invoices" "Liste des factures"
test_endpoint "POST" "/finance/invoices" "Création d'une facture" 201

echo "--- Payments ---"
test_endpoint "GET" "/finance/payments" "Liste des paiements"
test_endpoint "POST" "/finance/payments" "Création d'un paiement" 201

echo "--- Stats ---"
test_endpoint "GET" "/finance/stats" "Statistiques financières"

echo "=================================================="
echo "4. VÉRIFICATION DES RELATIONS"
echo "=================================================="
echo ""

echo -e "${BLUE}Relations identifiées dans le schéma Prisma:${NC}"
echo "  Mandate → Property (propertyId)"
echo "  Mandate → Owner (ownerId)"
echo "  Transaction → Property (propertyId)"
echo "  Transaction → Prospect (prospectId)"
echo "  Transaction → Mandate (mandateId)"
echo "  Commission → Transaction (transactionId)"
echo "  Commission → Agent/User (agentId)"
echo "  Invoice → Transaction (transactionId)"
echo "  Invoice → Owner (ownerId)"
echo "  Payment → Invoice (invoiceId)"
echo "  Payment → Commission (commissionId)"
echo ""

echo "=================================================="
echo "5. ENDPOINTS MODULES EXISTANTS (pour vérifier l'intégration)"
echo "=================================================="
echo ""

test_endpoint "GET" "/properties" "Liste des propriétés"
test_endpoint "GET" "/prospects" "Liste des prospects"
test_endpoint "GET" "/owners" "Liste des propriétaires"

echo "=================================================="
echo "ANALYSE TERMINÉE"
echo "=================================================="
echo ""
echo -e "${YELLOW}Note:${NC} Pour des tests complets avec authentification,"
echo "      ajoutez un token JWT valide dans la variable TOKEN"
echo ""
