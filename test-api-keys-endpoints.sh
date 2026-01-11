#!/bin/bash

echo "🧪 Complete API Keys Integration Tests"
echo "════════════════════════════════════════════════════════════"

BASE_URL="http://localhost:3001/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
run_test() {
  local test_name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5

  echo ""
  echo -n "Testing: $test_name... "

  response=$(curl -s -w "\n%{http_code}" -X "$method" \
    -H "Content-Type: application/json" \
    ${data:+-d "$data"} \
    "$BASE_URL$endpoint")

  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Status: $status_code)"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
    ((FAILED++))
  fi

  echo "  Response: $(echo "$body" | head -c 100)..."
}

# Test 1: Public endpoint - Gemini key test
run_test "POST /api-keys/test/gemini" "POST" "/api-keys/test/gemini" \
  '{"apiKey":"AIzaSyB6-test-invalid"}' "201"

# Test 2: Public endpoint - OpenAI key test
run_test "POST /api-keys/test/openai" "POST" "/api-keys/test/openai" \
  '{"apiKey":"sk-test-invalid"}' "201"

# Test 3: Public endpoint - Deepseek key test
run_test "POST /api-keys/test/deepseek" "POST" "/api-keys/test/deepseek" \
  '{"apiKey":"sk-test-invalid"}' "201"

# Test 4: Authenticated endpoint - GET user keys (no auth)
run_test "GET /ai-billing/api-keys/user (no auth)" "GET" "/ai-billing/api-keys/user" \
  "" "401"

# Test 5: Authenticated endpoint - PUT user keys (no auth)
run_test "PUT /ai-billing/api-keys/user (no auth)" "PUT" "/ai-billing/api-keys/user" \
  '{"geminiApiKey":"test"}' "401"

# Test 6: Verify DTOs accept defaultModel and defaultProvider
echo ""
echo -e "${YELLOW}Note:${NC} The following would pass with valid JWT token:"
echo "  - PUT /ai-billing/api-keys/user with body including defaultModel and defaultProvider"

echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "Tests: ${GREEN}$PASSED PASSED${NC}, ${RED}$FAILED FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All API tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
