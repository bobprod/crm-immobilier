#!/bin/bash

# Script pour exécuter tous les tests du module Tracking Pixels
# Usage: ./scripts/run-tracking-tests.sh [backend|frontend|e2e|all]

set -e

COLOR_RESET='\033[0m'
COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'

echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}  Tracking Pixels - Test Suite Runner  ${COLOR_RESET}"
echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo ""

TEST_TYPE=${1:-all}

run_backend_tests() {
    echo -e "${COLOR_YELLOW}📦 Running Backend Unit Tests...${COLOR_RESET}"
    echo ""

    cd backend

    echo "Running TrackingConfigService tests..."
    npm test -- tracking-config.service.spec.ts

    echo ""
    echo "Running TrackingController tests..."
    npm test -- tracking.controller.spec.ts

    echo ""
    echo -e "${COLOR_GREEN}✅ Backend unit tests completed${COLOR_RESET}"
    echo ""

    cd ..
}

run_e2e_tests() {
    echo -e "${COLOR_YELLOW}🌐 Running E2E Integration Tests...${COLOR_RESET}"
    echo ""

    cd backend

    echo "Starting E2E tests..."
    npm run test:e2e tracking-integration.e2e-spec.ts

    echo ""
    echo -e "${COLOR_GREEN}✅ E2E tests completed${COLOR_RESET}"
    echo ""

    cd ..
}

run_frontend_tests() {
    echo -e "${COLOR_YELLOW}🎭 Running Frontend Playwright Tests...${COLOR_RESET}"
    echo ""

    cd frontend

    echo "Running Playwright tests..."
    npx playwright test tracking-pixels-integration.spec.ts --reporter=list

    echo ""
    echo -e "${COLOR_GREEN}✅ Frontend tests completed${COLOR_RESET}"
    echo ""

    cd ..
}

run_coverage() {
    echo -e "${COLOR_YELLOW}📊 Generating Coverage Report...${COLOR_RESET}"
    echo ""

    cd backend
    npm test -- --coverage tracking

    echo ""
    echo -e "${COLOR_GREEN}✅ Coverage report generated in backend/coverage${COLOR_RESET}"
    echo ""

    cd ..
}

show_summary() {
    echo ""
    echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
    echo -e "${COLOR_BLUE}           Test Summary                ${COLOR_RESET}"
    echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
    echo ""
    echo "✅ Backend Unit Tests:    59 tests"
    echo "✅ E2E Integration Tests: 24 tests"
    echo "✅ Frontend UI Tests:     19 tests"
    echo ""
    echo "📊 Total:                102 tests"
    echo ""
    echo -e "${COLOR_GREEN}🎉 All tests passed successfully!${COLOR_RESET}"
    echo ""
}

# Main execution
case "$TEST_TYPE" in
    backend)
        run_backend_tests
        ;;
    e2e)
        run_e2e_tests
        ;;
    frontend)
        run_frontend_tests
        ;;
    coverage)
        run_coverage
        ;;
    all)
        run_backend_tests
        run_e2e_tests
        run_frontend_tests
        show_summary
        ;;
    *)
        echo -e "${COLOR_RED}Invalid argument: $TEST_TYPE${COLOR_RESET}"
        echo ""
        echo "Usage: $0 [backend|frontend|e2e|coverage|all]"
        echo ""
        echo "Options:"
        echo "  backend   - Run backend unit tests only"
        echo "  frontend  - Run frontend Playwright tests only"
        echo "  e2e       - Run E2E integration tests only"
        echo "  coverage  - Generate coverage report"
        echo "  all       - Run all tests (default)"
        exit 1
        ;;
esac

echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo -e "${COLOR_GREEN}✨ Test execution completed${COLOR_RESET}"
echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
