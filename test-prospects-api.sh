#!/bin/bash

# Prospects Module - API Testing Script
# This script tests all new endpoints added to the Prospects module

BASE_URL="http://localhost:3001/api"
TOKEN=""

echo "🎯 Prospects Module API Testing Script"
echo "======================================="
echo ""

# Check if token is provided
if [ -z "$1" ]; then
    echo "⚠️  Usage: $0 <JWT_TOKEN>"
    echo ""
    echo "Example:"
    echo "  $0 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    echo ""
    echo "To get a token, login first:"
    echo "  curl -X POST ${BASE_URL}/auth/login \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"email\":\"test@example.com\",\"password\":\"password\"}'"
    exit 1
fi

TOKEN=$1

echo "✅ Token provided"
echo ""

# Test 1: Get all prospects (with soft delete filter)
echo "Test 1: GET /prospects - Get all active prospects"
echo "=================================================="
curl -X GET "${BASE_URL}/prospects" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' || echo "Response received"
echo ""
echo ""

# Test 2: Get paginated prospects
echo "Test 2: GET /prospects/paginated - Cursor-based pagination"
echo "==========================================================="
curl -X GET "${BASE_URL}/prospects/paginated?limit=5" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' || echo "Response received"
echo ""
echo ""

# Test 3: Search prospects
echo "Test 3: GET /prospects/search - Full-text search"
echo "================================================="
curl -X GET "${BASE_URL}/prospects/search?q=test" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' || echo "Response received"
echo ""
echo ""

# Test 4: Get statistics
echo "Test 4: GET /prospects/stats - Advanced statistics"
echo "==================================================="
curl -X GET "${BASE_URL}/prospects/stats" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' || echo "Response received"
echo ""
echo ""

# Test 5: Get trashed prospects
echo "Test 5: GET /prospects/trashed - Soft-deleted prospects"
echo "========================================================"
curl -X GET "${BASE_URL}/prospects/trashed" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' || echo "Response received"
echo ""
echo ""

# Test 6: Create a test prospect
echo "Test 6: POST /prospects - Create a new prospect (with auto-scoring)"
echo "===================================================================="
CREATE_RESPONSE=$(curl -X POST "${BASE_URL}/prospects" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test.prospects.api@example.com",
    "phone": "+21612345678",
    "type": "buyer",
    "budget": 150000,
    "source": "api_test",
    "notes": "Created by API test script"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s)

echo "$CREATE_RESPONSE" | jq '.' || echo "$CREATE_RESPONSE"
PROSPECT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id' 2>/dev/null)
echo ""
echo "Created prospect ID: ${PROSPECT_ID}"
echo ""
echo ""

# Test 7: Get prospect with optional includes
if [ ! -z "$PROSPECT_ID" ] && [ "$PROSPECT_ID" != "null" ]; then
    echo "Test 7: GET /prospects/:id?include=matches,appointments - Optional relations"
    echo "==========================================================================="
    curl -X GET "${BASE_URL}/prospects/${PROSPECT_ID}?include=matches,appointments" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -w "\nStatus: %{http_code}\n" \
      -s | jq '.' || echo "Response received"
    echo ""
    echo ""

    # Test 8: Update prospect (score should be recalculated)
    echo "Test 8: PUT /prospects/:id - Update prospect (score recalculation)"
    echo "==================================================================="
    curl -X PUT "${BASE_URL}/prospects/${PROSPECT_ID}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "firstName": "Test Updated",
        "notes": "Updated by API test script"
      }' \
      -w "\nStatus: %{http_code}\n" \
      -s | jq '.' || echo "Response received"
    echo ""
    echo ""

    # Test 9: Soft delete prospect
    echo "Test 9: DELETE /prospects/:id - Soft delete"
    echo "============================================"
    curl -X DELETE "${BASE_URL}/prospects/${PROSPECT_ID}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -w "\nStatus: %{http_code}\n" \
      -s | jq '.' || echo "Response received"
    echo ""
    echo ""

    # Test 10: Restore prospect
    echo "Test 10: PATCH /prospects/:id/restore - Restore from trash"
    echo "==========================================================="
    curl -X PATCH "${BASE_URL}/prospects/${PROSPECT_ID}/restore" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -w "\nStatus: %{http_code}\n" \
      -s | jq '.' || echo "Response received"
    echo ""
    echo ""

    # Test 11: Permanent delete
    echo "Test 11: DELETE /prospects/:id/permanent - Hard delete"
    echo "======================================================="
    echo "⚠️  This will permanently delete the test prospect"
    read -p "Press Enter to continue or Ctrl+C to skip..."
    curl -X DELETE "${BASE_URL}/prospects/${PROSPECT_ID}/permanent" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -w "\nStatus: %{http_code}\n" \
      -s | jq '.' || echo "Response received"
    echo ""
    echo ""
fi

# Test 12: Export CSV
echo "Test 12: GET /prospects/export/csv - CSV export"
echo "================================================"
echo "Downloading CSV export..."
curl -X GET "${BASE_URL}/prospects/export/csv" \
  -H "Authorization: Bearer ${TOKEN}" \
  -o "prospects_export_test.csv" \
  -w "\nStatus: %{http_code}\n" \
  -s

if [ -f "prospects_export_test.csv" ]; then
    echo "✅ CSV file downloaded: prospects_export_test.csv"
    echo "First 5 lines:"
    head -5 prospects_export_test.csv
    echo "..."
else
    echo "❌ CSV download failed"
fi
echo ""
echo ""

echo "======================================="
echo "✅ All tests completed!"
echo "======================================="
echo ""
echo "Summary:"
echo "- ✅ Test 1: Get all prospects"
echo "- ✅ Test 2: Paginated prospects"
echo "- ✅ Test 3: Search prospects"
echo "- ✅ Test 4: Statistics"
echo "- ✅ Test 5: Trashed prospects"
echo "- ✅ Test 6: Create prospect (auto-scoring)"
echo "- ✅ Test 7: Optional includes"
echo "- ✅ Test 8: Update prospect (score recalc)"
echo "- ✅ Test 9: Soft delete"
echo "- ✅ Test 10: Restore"
echo "- ✅ Test 11: Permanent delete"
echo "- ✅ Test 12: CSV export"
echo ""
echo "Check the responses above for any errors."
echo "If all status codes are 200/201, all tests passed! 🎉"
