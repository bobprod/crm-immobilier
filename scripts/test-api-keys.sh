#!/bin/bash

# API Keys Integration Test Script using cURL
# Tests saving and retrieving LLM API keys

API_BASE_URL="http://localhost:3001/api"
AUTH_TOKEN="${AUTH_TOKEN:-test-token}" # Will be set from environment

echo "═══════════════════════════════════════════════════════════════"
echo "LLM API Keys Integration Test - cURL Tests"
echo "═══════════════════════════════════════════════════════════════"

# Test 1: Save Single OpenAI API Key
echo ""
echo "[TEST 1] Save OpenAI API Key"
echo "────────────────────────────────────────────────────────────────"
curl -X PUT "${API_BASE_URL}/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "openaiApiKey": "sk-test-openai-12345"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

# Test 2: Save Mistral API Key
echo ""
echo "[TEST 2] Save Mistral API Key"
echo "────────────────────────────────────────────────────────────────"
curl -X PUT "${API_BASE_URL}/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "mistralApiKey": "mistral-test-key-12345"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

# Test 3: Save Grok API Key
echo ""
echo "[TEST 3] Save Grok (xAI) API Key"
echo "────────────────────────────────────────────────────────────────"
curl -X PUT "${API_BASE_URL}/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "grokApiKey": "grok-test-key-12345"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

# Test 4: Save Multiple LLM Keys at Once
echo ""
echo "[TEST 4] Save Multiple LLM API Keys"
echo "────────────────────────────────────────────────────────────────"
curl -X PUT "${API_BASE_URL}/ai-billing/api-keys/user" \
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
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

# Test 5: Retrieve All API Keys (Masked)
echo ""
echo "[TEST 5] Retrieve All API Keys (Should be masked)"
echo "────────────────────────────────────────────────────────────────"
curl -X GET "${API_BASE_URL}/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

# Test 6: Save Scraping API Keys
echo ""
echo "[TEST 6] Save Scraping API Keys"
echo "────────────────────────────────────────────────────────────────"
curl -X PUT "${API_BASE_URL}/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "firecrawlApiKey": "fcrawl-test-12345",
    "serpApiKey": "serpapi-test-12345",
    "picaApiKey": "pica-test-12345"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

# Test 7: Verify Keys Are Persisted
echo ""
echo "[TEST 7] Verify Keys Persistence"
echo "────────────────────────────────────────────────────────────────"
RESPONSE=$(curl -X GET "${API_BASE_URL}/ai-billing/api-keys/user" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -s)

echo "${RESPONSE}" | jq '.'

# Check if keys exist
if echo "${RESPONSE}" | jq -e '.openaiApiKey' > /dev/null 2>&1; then
  echo "✓ OpenAI key found in database"
else
  echo "✗ OpenAI key NOT found in database"
fi

if echo "${RESPONSE}" | jq -e '.mistralApiKey' > /dev/null 2>&1; then
  echo "✓ Mistral key found in database"
else
  echo "✗ Mistral key NOT found in database"
fi

if echo "${RESPONSE}" | jq -e '.grokApiKey' > /dev/null 2>&1; then
  echo "✓ Grok key found in database"
else
  echo "✗ Grok key NOT found in database"
fi

# Test 8: Verify Keys Are Masked
echo ""
echo "[TEST 8] Verify API Keys Are Masked"
echo "────────────────────────────────────────────────────────────────"
OPENAI_KEY=$(echo "${RESPONSE}" | jq -r '.openaiApiKey // empty')

if [[ ! -z "${OPENAI_KEY}" ]] && [[ "${OPENAI_KEY}" == *"*"* ]]; then
  echo "✓ OpenAI key is properly masked: ${OPENAI_KEY}"
else
  echo "✗ OpenAI key is NOT properly masked"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Test Suite Complete"
echo "═══════════════════════════════════════════════════════════════"
