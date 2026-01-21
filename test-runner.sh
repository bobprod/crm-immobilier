#!/bin/bash
cd "/c/Users/DELL/Desktop/project dev/CRM_IMMOBILIER_COMPLET_FINAL/.git/crm-immobilier"

echo "🚀 Starting tests..."

echo ""
echo "📌 Test 1: Check TypeScript compilation errors"
cd frontend
npx tsc --noEmit 2>&1 | head -20 || true

echo ""
echo "📌 Test 2: Run Playwright tests"
npx playwright test tests/test-api-keys-e2e.spec.ts --reporter=list 2>&1 | head -100 || true

echo ""
echo "✅ Test script complete"
