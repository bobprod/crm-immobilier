#!/bin/bash

# AI Chat Assistant - Comprehensive Test Suite
# This script tests all CRUD operations, API endpoints, and validates responses

echo "================================================"
echo "AI CHAT ASSISTANT - COMPREHENSIVE TEST SUITE"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001/api}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
TEST_USER_EMAIL="test@example.com"
TEST_USER_PASSWORD="password123"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name: $message"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Function to make authenticated request
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    
    if [ -z "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            "${API_URL}${endpoint}"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${API_URL}${endpoint}"
    fi
}

echo "================================================"
echo "STEP 1: AUTHENTICATION"
echo "================================================"
echo ""

# Try to login and get token
echo "Attempting to authenticate..."
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_USER_EMAIL}\",\"password\":\"${TEST_USER_PASSWORD}\"}" \
    "${API_URL}/auth/login")

AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${YELLOW}⚠ Warning${NC} - Could not authenticate. Tests will run without token."
    echo "You may need to set AUTH_TOKEN environment variable manually."
    echo ""
    
    # Check if user provided token
    if [ ! -z "$AUTH_TOKEN_OVERRIDE" ]; then
        AUTH_TOKEN="$AUTH_TOKEN_OVERRIDE"
        echo -e "${GREEN}✓${NC} Using provided AUTH_TOKEN"
    fi
else
    echo -e "${GREEN}✓${NC} Authentication successful"
    echo "Token: ${AUTH_TOKEN:0:20}..."
fi

echo ""

echo "================================================"
echo "STEP 2: CREATE CONVERSATION (POST)"
echo "================================================"
echo ""

CREATE_PAYLOAD='{"title":"Test Conversation - CRUD Test"}'
echo "Request: POST /ai-chat-assistant/conversation"
echo "Payload: $CREATE_PAYLOAD"
echo ""

CREATE_RESPONSE=$(make_request "POST" "/ai-chat-assistant/conversation" "$CREATE_PAYLOAD")
echo "Response:"
echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
echo ""

# Extract conversation ID
CONVERSATION_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ ! -z "$CONVERSATION_ID" ]; then
    print_result "Create Conversation" "PASS" ""
    echo "Conversation ID: $CONVERSATION_ID"
else
    print_result "Create Conversation" "FAIL" "No conversation ID returned"
fi

echo ""

echo "================================================"
echo "STEP 3: LIST CONVERSATIONS (GET)"
echo "================================================"
echo ""

echo "Request: GET /ai-chat-assistant/conversations"
echo ""

LIST_RESPONSE=$(make_request "GET" "/ai-chat-assistant/conversations")
echo "Response:"
echo "$LIST_RESPONSE" | jq '.' 2>/dev/null || echo "$LIST_RESPONSE"
echo ""

# Check if response is array
if echo "$LIST_RESPONSE" | grep -q "^\["; then
    print_result "List Conversations" "PASS" ""
    CONV_COUNT=$(echo "$LIST_RESPONSE" | jq 'length' 2>/dev/null)
    echo "Number of conversations: $CONV_COUNT"
else
    print_result "List Conversations" "FAIL" "Response is not an array"
fi

echo ""

echo "================================================"
echo "STEP 4: SEND MESSAGE (POST)"
echo "================================================"
echo ""

if [ ! -z "$CONVERSATION_ID" ]; then
    MESSAGE_PAYLOAD='{"message":"Test message: Trouve des appartements 3 pièces à La Marsa"}'
    echo "Request: POST /ai-chat-assistant/message/$CONVERSATION_ID"
    echo "Payload: $MESSAGE_PAYLOAD"
    echo ""
    
    MESSAGE_RESPONSE=$(make_request "POST" "/ai-chat-assistant/message/$CONVERSATION_ID" "$MESSAGE_PAYLOAD")
    echo "Response:"
    echo "$MESSAGE_RESPONSE" | jq '.' 2>/dev/null || echo "$MESSAGE_RESPONSE"
    echo ""
    
    # Check if response has userMessage and aiMessage
    if echo "$MESSAGE_RESPONSE" | grep -q "userMessage" && echo "$MESSAGE_RESPONSE" | grep -q "aiMessage"; then
        print_result "Send Message" "PASS" ""
        
        USER_MSG=$(echo "$MESSAGE_RESPONSE" | jq -r '.userMessage.content' 2>/dev/null)
        AI_MSG=$(echo "$MESSAGE_RESPONSE" | jq -r '.aiMessage.content' 2>/dev/null)
        
        echo "User Message: $USER_MSG"
        echo "AI Response: ${AI_MSG:0:100}..."
    else
        print_result "Send Message" "FAIL" "Missing userMessage or aiMessage"
    fi
else
    print_result "Send Message" "SKIP" "No conversation ID available"
fi

echo ""

echo "================================================"
echo "STEP 5: GET MESSAGES (GET)"
echo "================================================"
echo ""

if [ ! -z "$CONVERSATION_ID" ]; then
    echo "Request: GET /ai-chat-assistant/messages/$CONVERSATION_ID"
    echo ""
    
    MESSAGES_RESPONSE=$(make_request "GET" "/ai-chat-assistant/messages/$CONVERSATION_ID")
    echo "Response:"
    echo "$MESSAGES_RESPONSE" | jq '.' 2>/dev/null || echo "$MESSAGES_RESPONSE"
    echo ""
    
    # Check if response is array
    if echo "$MESSAGES_RESPONSE" | grep -q "^\["; then
        print_result "Get Messages" "PASS" ""
        MSG_COUNT=$(echo "$MESSAGES_RESPONSE" | jq 'length' 2>/dev/null)
        echo "Number of messages: $MSG_COUNT"
    else
        print_result "Get Messages" "FAIL" "Response is not an array"
    fi
else
    print_result "Get Messages" "SKIP" "No conversation ID available"
fi

echo ""

echo "================================================"
echo "STEP 6: DELETE CONVERSATION (DELETE)"
echo "================================================"
echo ""

if [ ! -z "$CONVERSATION_ID" ]; then
    echo "Request: DELETE /ai-chat-assistant/conversation/$CONVERSATION_ID"
    echo ""
    
    DELETE_RESPONSE=$(make_request "DELETE" "/ai-chat-assistant/conversation/$CONVERSATION_ID")
    echo "Response:"
    echo "$DELETE_RESPONSE" | jq '.' 2>/dev/null || echo "$DELETE_RESPONSE"
    echo ""
    
    # Check if response has success: true
    if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
        print_result "Delete Conversation" "PASS" ""
    else
        print_result "Delete Conversation" "FAIL" "Success not returned"
    fi
else
    print_result "Delete Conversation" "SKIP" "No conversation ID available"
fi

echo ""

echo "================================================"
echo "STEP 7: VERIFY DELETION (GET)"
echo "================================================"
echo ""

if [ ! -z "$CONVERSATION_ID" ]; then
    echo "Request: GET /ai-chat-assistant/messages/$CONVERSATION_ID"
    echo "Expected: 404 Not Found"
    echo ""
    
    VERIFY_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        "${API_URL}/ai-chat-assistant/messages/$CONVERSATION_ID")
    
    HTTP_CODE=$(echo "$VERIFY_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
    RESPONSE_BODY=$(echo "$VERIFY_RESPONSE" | sed '/HTTP_CODE:/d')
    
    echo "HTTP Code: $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
    echo ""
    
    if [ "$HTTP_CODE" = "404" ]; then
        print_result "Verify Deletion" "PASS" ""
    else
        print_result "Verify Deletion" "FAIL" "Expected 404, got $HTTP_CODE"
    fi
else
    print_result "Verify Deletion" "SKIP" "No conversation ID available"
fi

echo ""

echo "================================================"
echo "STEP 8: TEST INTENT DETECTION"
echo "================================================"
echo ""

# Create a new conversation for intent testing
INTENT_CONV_PAYLOAD='{"title":"Intent Detection Test"}'
INTENT_CONV_RESPONSE=$(make_request "POST" "/ai-chat-assistant/conversation" "$INTENT_CONV_PAYLOAD")
INTENT_CONV_ID=$(echo "$INTENT_CONV_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ ! -z "$INTENT_CONV_ID" ]; then
    echo "Created test conversation: $INTENT_CONV_ID"
    echo ""
    
    # Test different intents
    declare -a INTENT_TESTS=(
        "Trouve des appartements 3 pièces à La Marsa|search_properties"
        "Résume mes ventes du mois|generate_report"
        "Écris un email de suivi pour ce prospect|draft_email"
        "Comment négocier avec ce client ?|strategic_advice"
        "Quels sont mes rendez-vous cette semaine ?|schedule_planning"
    )
    
    for intent_test in "${INTENT_TESTS[@]}"; do
        IFS='|' read -r message expected_intent <<< "$intent_test"
        
        echo "Testing intent: $expected_intent"
        echo "Message: $message"
        
        INTENT_PAYLOAD="{\"message\":\"$message\"}"
        INTENT_RESPONSE=$(make_request "POST" "/ai-chat-assistant/message/$INTENT_CONV_ID" "$INTENT_PAYLOAD")
        
        # Check if intent is in metadata
        DETECTED_INTENT=$(echo "$INTENT_RESPONSE" | jq -r '.aiMessage.metadata.intent' 2>/dev/null)
        
        if [ "$DETECTED_INTENT" = "$expected_intent" ]; then
            print_result "Intent Detection: $expected_intent" "PASS" ""
        else
            print_result "Intent Detection: $expected_intent" "FAIL" "Expected $expected_intent, got $DETECTED_INTENT"
        fi
        
        echo ""
    done
    
    # Clean up test conversation
    make_request "DELETE" "/ai-chat-assistant/conversation/$INTENT_CONV_ID" > /dev/null
else
    echo "Could not create test conversation for intent detection"
    print_result "Intent Detection Tests" "SKIP" "No conversation created"
fi

echo ""

echo "================================================"
echo "TEST SUMMARY"
echo "================================================"
echo ""
echo "Total Tests: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
