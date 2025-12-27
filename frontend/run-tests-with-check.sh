#!/bin/bash

echo "======================================"
echo "Pre-Test Server Check"
echo "======================================"
echo ""

# Check Frontend Server (port 3000)
echo -n "Checking Frontend (port 3000)... "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ NOT Running"
    echo ""
    echo "Please start frontend:"
    echo "  cd frontend && npm run dev"
    exit 1
fi

# Check Backend Server (port 3001)
echo -n "Checking Backend (port 3001)... "
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ NOT Running"
    echo ""
    echo "Please start backend:"
    echo "  cd backend && npm run start:dev"
    exit 1
fi

echo ""
echo "======================================"
echo "All servers are running! Running tests..."
echo "======================================"
echo ""

# Run the tests
npx playwright test property-crud-complete.spec.ts --project=chromium --workers=1

echo ""
echo "======================================"
echo "Tests completed!"
echo "======================================"
echo ""
echo "To view the report, run:"
echo "  npx playwright show-report"
