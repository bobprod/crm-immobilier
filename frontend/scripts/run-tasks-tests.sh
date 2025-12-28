#!/bin/bash

# Script d'exécution automatique des tests du module Tasks
# Phase 2 - Validation complète

set -e

echo "🧪 =========================================="
echo "🧪 Tests Module Tasks - Exécution automatique"
echo "🧪 =========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction de logging
log_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Please run from frontend directory."
    exit 1
fi

# ========== TESTS UNITAIRES ==========
echo ""
log_step "1. Tests unitaires (Vitest)"
echo "----------------------------------------"

# Vérifier si vitest est installé
if ! command -v vitest &> /dev/null; then
    log_warning "Vitest not found in PATH, using npx..."
fi

# Exécuter tests unitaires Tasks
log_step "Exécution TaskList.test.tsx..."
npm run test -- TaskList.test.tsx --run --reporter=verbose 2>&1 | tee test-results-tasklist.log

log_step "Exécution TaskDialog.test.tsx..."
npm run test -- TaskDialog.test.tsx --run --reporter=verbose 2>&1 | tee test-results-taskdialog.log

log_step "Exécution TaskItem.test.tsx..."
npm run test -- TaskItem.test.tsx --run --reporter=verbose 2>&1 | tee test-results-taskitem.log

log_success "Tests unitaires terminés"

# ========== COVERAGE ==========
echo ""
log_step "2. Génération du coverage"
echo "----------------------------------------"

npm run test:coverage -- tasks --reporter=json --reporter=html 2>&1 | tee coverage-report.log

if [ -d "coverage" ]; then
    log_success "Coverage généré dans ./coverage/"

    # Extraire le pourcentage de coverage si possible
    if [ -f "coverage/coverage-summary.json" ]; then
        log_step "Résumé du coverage:"
        cat coverage/coverage-summary.json | grep -A 4 "total" || echo "Coverage summary not available"
    fi
else
    log_warning "Répertoire coverage non trouvé"
fi

# ========== TESTS E2E ==========
echo ""
log_step "3. Tests E2E (Playwright)"
echo "----------------------------------------"

# Vérifier si Playwright est installé
if ! command -v playwright &> /dev/null && ! [ -f "node_modules/.bin/playwright" ]; then
    log_warning "Playwright not installed. Installing..."
    npx playwright install
fi

log_step "Exécution tasks-crud.spec.ts..."
npx playwright test tests/tasks-crud.spec.ts --reporter=html,json 2>&1 | tee e2e-results.log

if [ -d "playwright-report" ]; then
    log_success "Rapport Playwright généré dans ./playwright-report/"
else
    log_warning "Rapport Playwright non trouvé"
fi

# ========== RÉSUMÉ ==========
echo ""
echo "🎯 =========================================="
echo "🎯 RÉSUMÉ DE L'EXÉCUTION"
echo "🎯 =========================================="
echo ""

# Compter les tests passés/échoués (approximatif)
UNIT_TESTS_PASSED=$(grep -c "✓" test-results-*.log 2>/dev/null || echo "N/A")
E2E_TESTS_PASSED=$(grep -c "passed" e2e-results.log 2>/dev/null || echo "N/A")

echo "📊 Tests unitaires: $UNIT_TESTS_PASSED tests passés"
echo "📊 Tests E2E: $E2E_TESTS_PASSED tests passés"
echo ""

# Coverage
if [ -f "coverage/coverage-summary.json" ]; then
    COVERAGE=$(grep -oP '"pct":\K[0-9.]+' coverage/coverage-summary.json | head -1 || echo "N/A")
    echo "📈 Coverage: ${COVERAGE}%"
else
    echo "📈 Coverage: Non disponible"
fi

echo ""
log_success "Tous les tests ont été exécutés !"
echo ""
echo "📁 Rapports générés:"
echo "   - Tests unitaires: test-results-*.log"
echo "   - Coverage: ./coverage/index.html"
echo "   - Tests E2E: ./playwright-report/index.html"
echo ""
echo "💡 Pour ouvrir les rapports HTML:"
echo "   npm run test:coverage -- tasks && open coverage/index.html"
echo "   npx playwright show-report"
echo ""

log_success "Phase 2 terminée !"
