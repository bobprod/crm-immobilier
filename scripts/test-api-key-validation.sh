#!/bin/bash

# Quick validation script for API Key Test Button functionality

echo "=========================================="
echo "API Key Test Button - Quick Validation"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3001/api"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

test_endpoint() {
  local name=$1
  local provider=$2
  local key=$3
  local expected_success=$4

  echo -n "Testing $name... "
  TESTS_RUN=$((TESTS_RUN + 1))

  response=$(curl -s -X POST "$BASE_URL/api-keys/test/$provider" \
    -H "Content-Type: application/json" \
    -d "{\"apiKey\":\"$key\"}")

  if echo "$response" | grep -q '"success"'; then
    success=$(echo "$response" | grep -o '"success":[^,}]*' | cut -d: -f2)

    if [ "$success" = "$expected_success" ]; then
      echo -e "${GREEN}✓ PASS${NC}"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    else
      echo -e "${RED}✗ FAIL${NC} (Expected success=$expected_success, got $success)"
    fi
  else
    echo -e "${RED}✗ FAIL${NC} (Invalid response format)"
  fi
}

# Run tests
echo -e "${YELLOW}Running API Validation Tests...${NC}"
echo ""

# Test 1: Gemini with provided key
test_endpoint "Gemini API Key" "gemini" "AIzaSyB6ZOSlEVDIXpWdMB6zgDvmDiC-3pxPDSw" "true"

# Test 2: Invalid OpenAI key
test_endpoint "Invalid OpenAI Key" "openai" "sk-invalid" "false"

# Test 3: Empty key
test_endpoint "Empty API Key" "mistral" "" "false"

# Test 4: Invalid provider
echo -n "Testing Invalid Provider... "
TESTS_RUN=$((TESTS_RUN + 1))
response=$(curl -s -X POST "$BASE_URL/api-keys/test/unknownprovider" \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"test"}')

if echo "$response" | grep -q '"success":false'; then
  echo -e "${GREEN}✓ PASS${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗ FAIL${NC}"
fi

# Test 5: Anthropic (should fail with invalid key)
test_endpoint "Invalid Anthropic Key" "anthropic" "sk-ant-invalid" "false"

echo ""
echo "=========================================="
echo -e "Results: ${GREEN}$TESTS_PASSED/$TESTS_RUN${NC} tests passed"
echo "=========================================="

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
