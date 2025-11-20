#!/bin/bash

# CRM Immobilier - API Test Script
# This script tests all major API endpoints with different user roles

set -e

BASE_URL="http://localhost:3000"
ADMIN_TOKEN=""
MANAGER_TOKEN=""
AGENT_TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to print colored output
print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test server availability
test_server() {
    print_test "Testing server availability..."
    if curl -s -f "$BASE_URL" > /dev/null 2>&1; then
        print_success "Server is running at $BASE_URL"
    else
        print_error "Server is not accessible at $BASE_URL"
        print_info "Please start the server with: cd backend && npm run start:dev"
        exit 1
    fi
}

# Register users
register_users() {
    echo ""
    echo "========================================="
    echo "  1. REGISTERING TEST USERS"
    echo "========================================="

    # Register Admin
    print_test "Registering Admin user..."
    ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@crm-immobilier.local",
            "password": "Admin@123456",
            "firstName": "Admin",
            "lastName": "User",
            "role": "admin"
        }')

    if echo "$ADMIN_RESPONSE" | grep -q "accessToken\|email"; then
        print_success "Admin user registered successfully"
    else
        print_info "Admin user may already exist or registration failed"
        echo "$ADMIN_RESPONSE" | jq '.' 2>/dev/null || echo "$ADMIN_RESPONSE"
    fi

    # Register Manager
    print_test "Registering Manager user..."
    MANAGER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "manager@crm-immobilier.local",
            "password": "Manager@123456",
            "firstName": "Marie",
            "lastName": "Manager",
            "role": "manager"
        }')

    if echo "$MANAGER_RESPONSE" | grep -q "accessToken\|email"; then
        print_success "Manager user registered successfully"
    else
        print_info "Manager user may already exist or registration failed"
        echo "$MANAGER_RESPONSE" | jq '.' 2>/dev/null || echo "$MANAGER_RESPONSE"
    fi

    # Register Agent
    print_test "Registering Agent user..."
    AGENT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "agent@crm-immobilier.local",
            "password": "Agent@123456",
            "firstName": "Pierre",
            "lastName": "Agent",
            "role": "agent"
        }')

    if echo "$AGENT_RESPONSE" | grep -q "accessToken\|email"; then
        print_success "Agent user registered successfully"
    else
        print_info "Agent user may already exist or registration failed"
        echo "$AGENT_RESPONSE" | jq '.' 2>/dev/null || echo "$AGENT_RESPONSE"
    fi
}

# Login users
login_users() {
    echo ""
    echo "========================================="
    echo "  2. LOGGING IN TEST USERS"
    echo "========================================="

    # Login Admin
    print_test "Logging in as Admin..."
    ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@crm-immobilier.local",
            "password": "Admin@123456"
        }')

    ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | jq -r '.accessToken' 2>/dev/null)
    if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
        print_success "Admin logged in successfully"
        print_info "Admin Token: ${ADMIN_TOKEN:0:20}..."
    else
        print_error "Admin login failed"
        echo "$ADMIN_LOGIN" | jq '.' 2>/dev/null || echo "$ADMIN_LOGIN"
    fi

    # Login Manager
    print_test "Logging in as Manager..."
    MANAGER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "manager@crm-immobilier.local",
            "password": "Manager@123456"
        }')

    MANAGER_TOKEN=$(echo "$MANAGER_LOGIN" | jq -r '.accessToken' 2>/dev/null)
    if [ "$MANAGER_TOKEN" != "null" ] && [ -n "$MANAGER_TOKEN" ]; then
        print_success "Manager logged in successfully"
        print_info "Manager Token: ${MANAGER_TOKEN:0:20}..."
    else
        print_error "Manager login failed"
        echo "$MANAGER_LOGIN" | jq '.' 2>/dev/null || echo "$MANAGER_LOGIN"
    fi

    # Login Agent
    print_test "Logging in as Agent..."
    AGENT_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "agent@crm-immobilier.local",
            "password": "Agent@123456"
        }')

    AGENT_TOKEN=$(echo "$AGENT_LOGIN" | jq -r '.accessToken' 2>/dev/null)
    if [ "$AGENT_TOKEN" != "null" ] && [ -n "$AGENT_TOKEN" ]; then
        print_success "Agent logged in successfully"
        print_info "Agent Token: ${AGENT_TOKEN:0:20}..."
    else
        print_error "Agent login failed"
        echo "$AGENT_LOGIN" | jq '.' 2>/dev/null || echo "$AGENT_LOGIN"
    fi
}

# Test authentication endpoints
test_auth_endpoints() {
    echo ""
    echo "========================================="
    echo "  3. TESTING AUTHENTICATION ENDPOINTS"
    echo "========================================="

    # Test /auth/me for each user
    print_test "Testing GET /auth/me (Admin)..."
    ADMIN_PROFILE=$(curl -s -X GET "$BASE_URL/auth/me" \
        -H "Authorization: Bearer $ADMIN_TOKEN")

    if echo "$ADMIN_PROFILE" | grep -q "admin@crm-immobilier.local"; then
        print_success "Admin profile retrieved successfully"
        echo "$ADMIN_PROFILE" | jq '.'
    else
        print_error "Failed to retrieve admin profile"
    fi

    print_test "Testing GET /auth/me (Manager)..."
    MANAGER_PROFILE=$(curl -s -X GET "$BASE_URL/auth/me" \
        -H "Authorization: Bearer $MANAGER_TOKEN")

    if echo "$MANAGER_PROFILE" | grep -q "manager@crm-immobilier.local"; then
        print_success "Manager profile retrieved successfully"
        echo "$MANAGER_PROFILE" | jq '.'
    else
        print_error "Failed to retrieve manager profile"
    fi

    print_test "Testing GET /auth/me (Agent)..."
    AGENT_PROFILE=$(curl -s -X GET "$BASE_URL/auth/me" \
        -H "Authorization: Bearer $AGENT_TOKEN")

    if echo "$AGENT_PROFILE" | grep -q "agent@crm-immobilier.local"; then
        print_success "Agent profile retrieved successfully"
        echo "$AGENT_PROFILE" | jq '.'
    else
        print_error "Failed to retrieve agent profile"
    fi
}

# Test users endpoints
test_users_endpoints() {
    echo ""
    echo "========================================="
    echo "  4. TESTING USERS ENDPOINTS"
    echo "========================================="

    print_test "Testing GET /users (Admin)..."
    USERS_LIST=$(curl -s -X GET "$BASE_URL/users" \
        -H "Authorization: Bearer $ADMIN_TOKEN")

    if echo "$USERS_LIST" | grep -q "\["; then
        print_success "Users list retrieved successfully"
        echo "$USERS_LIST" | jq '.'
    else
        print_error "Failed to retrieve users list"
    fi
}

# Test properties endpoints
test_properties_endpoints() {
    echo ""
    echo "========================================="
    echo "  5. TESTING PROPERTIES ENDPOINTS"
    echo "========================================="

    print_test "Creating a test property (Admin)..."
    PROPERTY_RESPONSE=$(curl -s -X POST "$BASE_URL/properties" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "Luxurious Villa in Carthage",
            "description": "Beautiful 5-bedroom villa with sea view",
            "type": "villa",
            "category": "sale",
            "price": 850000,
            "currency": "TND",
            "city": "Carthage",
            "bedrooms": 5,
            "bathrooms": 4,
            "area": 450,
            "status": "available"
        }')

    PROPERTY_ID=$(echo "$PROPERTY_RESPONSE" | jq -r '.id' 2>/dev/null)
    if [ "$PROPERTY_ID" != "null" ] && [ -n "$PROPERTY_ID" ]; then
        print_success "Property created successfully (ID: $PROPERTY_ID)"
        echo "$PROPERTY_RESPONSE" | jq '.'
    else
        print_error "Failed to create property"
        echo "$PROPERTY_RESPONSE"
    fi

    if [ -n "$PROPERTY_ID" ] && [ "$PROPERTY_ID" != "null" ]; then
        print_test "Testing GET /properties (all users can see)..."
        curl -s -X GET "$BASE_URL/properties" \
            -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

        print_test "Testing GET /properties/:id..."
        curl -s -X GET "$BASE_URL/properties/$PROPERTY_ID" \
            -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
    fi
}

# Test prospects endpoints
test_prospects_endpoints() {
    echo ""
    echo "========================================="
    echo "  6. TESTING PROSPECTS ENDPOINTS"
    echo "========================================="

    print_test "Creating a test prospect (Agent)..."
    PROSPECT_RESPONSE=$(curl -s -X POST "$BASE_URL/prospects" \
        -H "Authorization: Bearer $AGENT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "firstName": "Ahmed",
            "lastName": "Ben Ali",
            "email": "ahmed.benali@example.tn",
            "phone": "+216 20 123 456",
            "type": "buyer",
            "status": "active",
            "preferences": {
                "propertyType": "apartment",
                "minBudget": 300000,
                "maxBudget": 500000,
                "city": "Tunis"
            }
        }')

    PROSPECT_ID=$(echo "$PROSPECT_RESPONSE" | jq -r '.id' 2>/dev/null)
    if [ "$PROSPECT_ID" != "null" ] && [ -n "$PROSPECT_ID" ]; then
        print_success "Prospect created successfully (ID: $PROSPECT_ID)"
        echo "$PROSPECT_RESPONSE" | jq '.'
    else
        print_error "Failed to create prospect"
        echo "$PROSPECT_RESPONSE"
    fi

    if [ -n "$PROSPECT_ID" ] && [ "$PROSPECT_ID" != "null" ]; then
        print_test "Testing GET /prospects..."
        curl -s -X GET "$BASE_URL/prospects" \
            -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
    fi
}

# Test dashboard endpoints
test_dashboard_endpoints() {
    echo ""
    echo "========================================="
    echo "  7. TESTING DASHBOARD ENDPOINTS"
    echo "========================================="

    print_test "Testing GET /dashboard/stats (Admin)..."
    curl -s -X GET "$BASE_URL/dashboard/stats" \
        -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

    print_test "Testing GET /dashboard/charts (Manager)..."
    curl -s -X GET "$BASE_URL/dashboard/charts" \
        -H "Authorization: Bearer $MANAGER_TOKEN" | jq '.'

    print_test "Testing GET /dashboard/activities (Agent)..."
    curl -s -X GET "$BASE_URL/dashboard/activities" \
        -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
}

# Display credentials summary
display_credentials() {
    echo ""
    echo "========================================="
    echo "  USER CREDENTIALS SUMMARY"
    echo "========================================="
    echo ""
    echo -e "${GREEN}1. ADMIN USER${NC}"
    echo "   Email: admin@crm-immobilier.local"
    echo "   Password: Admin@123456"
    echo "   Role: admin"
    echo "   Token: $ADMIN_TOKEN"
    echo ""
    echo -e "${GREEN}2. MANAGER USER${NC}"
    echo "   Email: manager@crm-immobilier.local"
    echo "   Password: Manager@123456"
    echo "   Role: manager"
    echo "   Token: $MANAGER_TOKEN"
    echo ""
    echo -e "${GREEN}3. AGENT USER${NC}"
    echo "   Email: agent@crm-immobilier.local"
    echo "   Password: Agent@123456"
    echo "   Role: agent"
    echo "   Token: $AGENT_TOKEN"
    echo ""
}

# Main execution
main() {
    echo "========================================="
    echo "  CRM IMMOBILIER - API TESTING"
    echo "========================================="

    test_server
    register_users
    login_users
    test_auth_endpoints
    test_users_endpoints
    test_properties_endpoints
    test_prospects_endpoints
    test_dashboard_endpoints
    display_credentials

    echo ""
    echo "========================================="
    echo "  TESTING COMPLETE!"
    echo "========================================="
    echo ""
    print_info "All API tests have been executed."
    print_info "Check the output above for results."
    print_info "For detailed API documentation, see API_TESTING_GUIDE.md"
    echo ""
}

# Run main function
main "$@"
