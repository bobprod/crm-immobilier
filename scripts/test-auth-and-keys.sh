#!/bin/bash

# API Keys Integration Test with Authentication
# First registers/logs in a test user, then tests API key saving

API_BASE_URL="http://localhost:3001/api"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="TestPassword123!"

echo "═══════════════════════════════════════════════════════════════"
echo "LLM API Keys - Authentication & Integration Test"
echo "═══════════════════════════════════════════════════════════════"

# Step 1: Check Backend Connection
echo ""
echo "[STEP 1] Checking Backend Connection..."
echo "────────────────────────────────────────────────────────────────"

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
if [ "${HEALTH_CHECK}" == "200" ] || [ "${HEALTH_CHECK}" == "404" ]; then
  echo "✓ Backend is running"
else
  echo "✗ Backend is not responding. Please start it with: npm run start:dev"
  exit 1
fi

# Step 2: Register Test User
echo ""
echo "[STEP 2] Registering Test User"
echo "────────────────────────────────────────────────────────────────"

REGISTER_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\"
  }")

echo "${REGISTER_RESPONSE}" | jq '.' 2>/dev/null || echo "${REGISTER_RESPONSE}"

# Step 3: Login and Get JWT Token
echo ""
echo "[STEP 3] Logging in and obtaining JWT Token"
echo "────────────────────────────────────────────────────────────────"

LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\"
  }")

echo "${LOGIN_RESPONSE}" | jq '.' 2>/dev/null || echo "${LOGIN_RESPONSE}"

# Extract JWT Token
AUTH_TOKEN=$(echo "${LOGIN_RESPONSE}" | jq -r '.accessToken // .token // empty' 2>/dev/null)

if [ -z "${AUTH_TOKEN}" ] || [ "${AUTH_TOKEN}" == "null" ]; then
  echo "✗ Failed to obtain JWT token"
  echo "Response was: ${LOGIN_RESPONSE}"
  exit 1
fi

echo ""
echo "✓ Successfully obtained JWT token"
echo "Token (first 50 chars): ${AUTH_TOKEN:0:50}..."

# Now proceed with the API keys tests
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Testing API Key Management Endpoints"
echo "═══════════════════════════════════════════════════════════════"

# Test 1: Save Single OpenAI API Key
echo ""
echo "[TEST 1] Save OpenAI API Key"
echo "────────────────────────────────────────────────────────────────"
TEST1=$(curl -s -X PUT "${API_BASE_URL}/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "openaiApiKey": "sk-test-openai-12345"
  }' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "${TEST1}" | tail -1)
BODY=$(echo "${TEST1}" | sed '$d')

echo "${BODY}" | jq '.' 2>/dev/null || echo "${BODY}"
echo "HTTP Status: ${HTTP_CODE}"

if [ "${HTTP_CODE}" == "200" ]; then
  echo "✓ Test 1 PASSED"
else
  echo "✗ Test 1 FAILED (HTTP ${HTTP_CODE})"
fi

# Test 2: Save Mistral API Key
echo ""
echo "[TEST 2] Save Mistral API Key"
echo "────────────────────────────────────────────────────────────────"
TEST2=$(curl -s -X PUT "${API_BASE_URL}/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "mistralApiKey": "mistral-test-key-12345"
  }' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "${TEST2}" | tail -1)
BODY=$(echo "${TEST2}" | sed '$d')

echo "${BODY}" | jq '.' 2>/dev/null || echo "${BODY}"
echo "HTTP Status: ${HTTP_CODE}"

if [ "${HTTP_CODE}" == "200" ]; then
  echo "✓ Test 2 PASSED"
else
  echo "✗ Test 2 FAILED (HTTP ${HTTP_CODE})"
fi

# Test 3: Save Grok API Key
echo ""
echo "[TEST 3] Save Grok (xAI) API Key"
echo "────────────────────────────────────────────────────────────────"
TEST3=$(curl -s -X PUT "${API_BASE_URL}/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "grokApiKey": "grok-test-key-12345"
  }' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "${TEST3}" | tail -1)
BODY=$(echo "${TEST3}" | sed '$d')

echo "${BODY}" | jq '.' 2>/dev/null || echo "${BODY}"
echo "HTTP Status: ${HTTP_CODE}"

if [ "${HTTP_CODE}" == "200" ]; then
  echo "✓ Test 3 PASSED"
else
  echo "✗ Test 3 FAILED (HTTP ${HTTP_CODE})"
fi

# Test 4: Save Multiple LLM Keys at Once
echo ""
echo "[TEST 4] Save Multiple LLM API Keys (10 keys)"
echo "────────────────────────────────────────────────────────────────"
TEST4=$(curl -s -X PUT "${API_BASE_URL}/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "openaiApiKey": "sk-openai-test",
    "mistralApiKey": "mistral-test",
    "grokApiKey": "grok-test",
    "cohereApiKey": "cohere-test",
    "togetherAiApiKey": "together-test",
    "replicateApiKey": "replicate-test",
    "perplexityApiKey": "perplexity-test",
    "huggingfaceApiKey": "huggingface-test",
    "alephAlphaApiKey": "aleph-test",
    "nlpCloudApiKey": "nlpcloud-test"
  }' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "${TEST4}" | tail -1)
BODY=$(echo "${TEST4}" | sed '$d')

echo "${BODY}" | jq '.' 2>/dev/null || echo "${BODY}"
echo "HTTP Status: ${HTTP_CODE}"

if [ "${HTTP_CODE}" == "200" ]; then
  echo "✓ Test 4 PASSED"
else
  echo "✗ Test 4 FAILED (HTTP ${HTTP_CODE})"
fi

# Test 5: Retrieve All API Keys (Masked)
echo ""
echo "[TEST 5] Retrieve All API Keys (Should be masked)"
echo "────────────────────────────────────────────────────────────────"
RETRIEVE=$(curl -s -X GET "${API_BASE_URL}/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "${RETRIEVE}" | tail -1)
BODY=$(echo "${RETRIEVE}" | sed '$d')

echo "${BODY}" | jq '.' 2>/dev/null || echo "${BODY}"
echo "HTTP Status: ${HTTP_CODE}"

if [ "${HTTP_CODE}" == "200" ]; then
  echo "✓ Test 5 PASSED"
else
  echo "✗ Test 5 FAILED (HTTP ${HTTP_CODE})"
fi

# Test 6: Verify Keys Are Persisted
echo ""
echo "[TEST 6] Verify Keys Persistence in Database"
echo "────────────────────────────────────────────────────────────────"

RESPONSE="${BODY}"

PASSED_CHECKS=0
TOTAL_CHECKS=0

# Check OpenAI
if echo "${RESPONSE}" | jq -e '.openaiApiKey' > /dev/null 2>&1; then
  echo "✓ OpenAI key found"
  PASSED_CHECKS=$((PASSED_CHECKS+1))
else
  echo "✗ OpenAI key NOT found"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS+1))

# Check Mistral
if echo "${RESPONSE}" | jq -e '.mistralApiKey' > /dev/null 2>&1; then
  echo "✓ Mistral key found"
  PASSED_CHECKS=$((PASSED_CHECKS+1))
else
  echo "✗ Mistral key NOT found"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS+1))

# Check Grok
if echo "${RESPONSE}" | jq -e '.grokApiKey' > /dev/null 2>&1; then
  echo "✓ Grok key found"
  PASSED_CHECKS=$((PASSED_CHECKS+1))
else
  echo "✗ Grok key NOT found"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS+1))

# Check Cohere
if echo "${RESPONSE}" | jq -e '.cohereApiKey' > /dev/null 2>&1; then
  echo "✓ Cohere key found"
  PASSED_CHECKS=$((PASSED_CHECKS+1))
else
  echo "✗ Cohere key NOT found"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS+1))

echo ""
echo "Persistence Check: ${PASSED_CHECKS}/${TOTAL_CHECKS} keys found"

# Test 7: Verify Keys Are Masked
echo ""
echo "[TEST 7] Verify API Keys Are Masked"
echo "────────────────────────────────────────────────────────────────"

OPENAI_KEY=$(echo "${RESPONSE}" | jq -r '.openaiApiKey // empty' 2>/dev/null)

if [ -z "${OPENAI_KEY}" ]; then
  echo "⚠ OpenAI key is empty (no key was saved yet)"
elif [[ "${OPENAI_KEY}" == *"*"* ]]; then
  echo "✓ OpenAI key is properly masked: ${OPENAI_KEY}"
else
  echo "✗ OpenAI key is NOT properly masked: ${OPENAI_KEY}"
fi

# Test 8: Save Scraping API Keys
echo ""
echo "[TEST 8] Save Scraping API Keys"
echo "────────────────────────────────────────────────────────────────"
TEST8=$(curl -s -X PUT "${API_BASE_URL}/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "firecrawlApiKey": "fcrawl-test-12345",
    "serpApiKey": "serpapi-test-12345",
    "picaApiKey": "pica-test-12345"
  }' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "${TEST8}" | tail -1)
BODY=$(echo "${TEST8}" | sed '$d')

echo "${BODY}" | jq '.' 2>/dev/null || echo "${BODY}"
echo "HTTP Status: ${HTTP_CODE}"

if [ "${HTTP_CODE}" == "200" ]; then
  echo "✓ Test 8 PASSED"
else
  echo "✗ Test 8 FAILED (HTTP ${HTTP_CODE})"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Test Suite Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Summary:"
echo "  - Backend Connection: ✓"
echo "  - User Registration: ✓"
echo "  - JWT Authentication: ✓"
echo "  - API Key Tests: See results above"
echo ""
