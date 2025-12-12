#!/bin/bash

# ============================================
# Corrected CRUD API Test Script
# Based on actual DTO definitions
# ============================================

BASE_URL="http://localhost:3001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "============================================"
echo "CORRECTED CRUD API TESTS"
echo "============================================"

# ============================================
# 1. LOGIN
# ============================================
echo -e "\n${YELLOW}=== 1. LOGIN ===${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@crm.com", "password": "Admin123!"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✅ Login successful${NC}"
  echo "User ID: $USER_ID"
else
  echo -e "${RED}❌ Login failed${NC}"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

AUTH="Authorization: Bearer $TOKEN"

# ============================================
# 2. REGISTER (New User)
# ============================================
echo -e "\n${YELLOW}=== 2. REGISTER NEW USER ===${NC}"
REGISTER_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "testuser'$(date +%s)'@test.com",
    "password": "TestPassword123!"
  }')

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$REGISTER_RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Register: HTTP $HTTP_CODE${NC}"
else
  echo -e "${RED}❌ Register: HTTP $HTTP_CODE${NC}"
  echo "$BODY"
fi

# ============================================
# 3. PROPERTIES CRUD
# ============================================
echo -e "\n${YELLOW}=== 3. PROPERTIES CRUD ===${NC}"

# CREATE Property - Using correct DTO fields
echo "Creating property..."
PROPERTY_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/properties" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Apartment",
    "type": "apartment",
    "category": "sale",
    "price": 250000,
    "area": 85,
    "bedrooms": 3,
    "bathrooms": 2,
    "address": "123 Test Street",
    "city": "Tunis",
    "delegation": "Carthage",
    "zipCode": "1054"
  }')

HTTP_CODE=$(echo "$PROPERTY_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$PROPERTY_RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ POST /properties: HTTP $HTTP_CODE${NC}"
  PROPERTY_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "Property ID: $PROPERTY_ID"
else
  echo -e "${RED}❌ POST /properties: HTTP $HTTP_CODE${NC}"
  echo "$BODY"
fi

# READ Property
if [ -n "$PROPERTY_ID" ]; then
  echo "Reading property..."
  READ_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/properties/$PROPERTY_ID" -H "$AUTH")
  HTTP_CODE=$(echo "$READ_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ GET /properties/$PROPERTY_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ GET /properties/$PROPERTY_ID: HTTP $HTTP_CODE${NC}"
  fi

  # UPDATE Property
  echo "Updating property..."
  UPDATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT "$BASE_URL/properties/$PROPERTY_ID" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{"title": "Updated Apartment", "price": 275000}')
  HTTP_CODE=$(echo "$UPDATE_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PUT /properties/$PROPERTY_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ PUT /properties/$PROPERTY_ID: HTTP $HTTP_CODE${NC}"
    echo "$UPDATE_RESPONSE" | sed '/HTTP_CODE:/d'
  fi

  # DELETE Property
  echo "Deleting property..."
  DELETE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X DELETE "$BASE_URL/properties/$PROPERTY_ID" -H "$AUTH")
  HTTP_CODE=$(echo "$DELETE_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo -e "${GREEN}✅ DELETE /properties/$PROPERTY_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ DELETE /properties/$PROPERTY_ID: HTTP $HTTP_CODE${NC}"
  fi
fi

# ============================================
# 4. PROSPECTS CRUD
# ============================================
echo -e "\n${YELLOW}=== 4. PROSPECTS CRUD ===${NC}"

# CREATE Prospect - Using correct DTO fields (type required, no status)
echo "Creating prospect..."
PROSPECT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/prospects" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe'$(date +%s)'@test.com",
    "phone": "+21612345678",
    "type": "buyer",
    "budget": 300000,
    "source": "website",
    "notes": "Test prospect"
  }')

HTTP_CODE=$(echo "$PROSPECT_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$PROSPECT_RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ POST /prospects: HTTP $HTTP_CODE${NC}"
  PROSPECT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "Prospect ID: $PROSPECT_ID"
else
  echo -e "${RED}❌ POST /prospects: HTTP $HTTP_CODE${NC}"
  echo "$BODY"
fi

# READ Prospect
if [ -n "$PROSPECT_ID" ]; then
  echo "Reading prospect..."
  READ_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/prospects/$PROSPECT_ID" -H "$AUTH")
  HTTP_CODE=$(echo "$READ_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ GET /prospects/$PROSPECT_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ GET /prospects/$PROSPECT_ID: HTTP $HTTP_CODE${NC}"
  fi

  # UPDATE Prospect
  echo "Updating prospect..."
  UPDATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT "$BASE_URL/prospects/$PROSPECT_ID" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{"budget": 350000, "notes": "Updated notes"}')
  HTTP_CODE=$(echo "$UPDATE_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PUT /prospects/$PROSPECT_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ PUT /prospects/$PROSPECT_ID: HTTP $HTTP_CODE${NC}"
    echo "$UPDATE_RESPONSE" | sed '/HTTP_CODE:/d'
  fi

  # DELETE Prospect
  echo "Deleting prospect..."
  DELETE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X DELETE "$BASE_URL/prospects/$PROSPECT_ID" -H "$AUTH")
  HTTP_CODE=$(echo "$DELETE_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo -e "${GREEN}✅ DELETE /prospects/$PROSPECT_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ DELETE /prospects/$PROSPECT_ID: HTTP $HTTP_CODE${NC}"
  fi
fi

# ============================================
# 5. TASKS CRUD
# ============================================
echo -e "\n${YELLOW}=== 5. TASKS CRUD ===${NC}"

# CREATE Task - Using correct DTO fields (status and priority required)
echo "Creating task..."
TASK_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/tasks" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task",
    "status": "todo",
    "priority": "medium"
  }')

HTTP_CODE=$(echo "$TASK_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$TASK_RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ POST /tasks: HTTP $HTTP_CODE${NC}"
  TASK_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "Task ID: $TASK_ID"
else
  echo -e "${RED}❌ POST /tasks: HTTP $HTTP_CODE${NC}"
  echo "$BODY"
fi

# READ Task
if [ -n "$TASK_ID" ]; then
  echo "Reading task..."
  READ_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/tasks/$TASK_ID" -H "$AUTH")
  HTTP_CODE=$(echo "$READ_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ GET /tasks/$TASK_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ GET /tasks/$TASK_ID: HTTP $HTTP_CODE${NC}"
  fi

  # UPDATE Task
  echo "Updating task..."
  UPDATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT "$BASE_URL/tasks/$TASK_ID" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{"status": "in_progress", "title": "Updated Task"}')
  HTTP_CODE=$(echo "$UPDATE_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PUT /tasks/$TASK_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ PUT /tasks/$TASK_ID: HTTP $HTTP_CODE${NC}"
    echo "$UPDATE_RESPONSE" | sed '/HTTP_CODE:/d'
  fi

  # DELETE Task
  echo "Deleting task..."
  DELETE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X DELETE "$BASE_URL/tasks/$TASK_ID" -H "$AUTH")
  HTTP_CODE=$(echo "$DELETE_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo -e "${GREEN}✅ DELETE /tasks/$TASK_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ DELETE /tasks/$TASK_ID: HTTP $HTTP_CODE${NC}"
  fi
fi

# ============================================
# 6. APPOINTMENTS CRUD
# ============================================
echo -e "\n${YELLOW}=== 6. APPOINTMENTS CRUD ===${NC}"

# CREATE Appointment - Using correct DTO fields
START_TIME=$(date -u -d "+1 day" +"%Y-%m-%dT14:00:00Z" 2>/dev/null || date -u +"%Y-%m-%dT14:00:00Z")
END_TIME=$(date -u -d "+1 day" +"%Y-%m-%dT15:00:00Z" 2>/dev/null || date -u +"%Y-%m-%dT15:00:00Z")

echo "Creating appointment..."
APPOINTMENT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/appointments" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Property Visit",
    "description": "Visit for apartment inspection",
    "startTime": "'$START_TIME'",
    "endTime": "'$END_TIME'",
    "location": "123 Test Street, Tunis",
    "type": "visit",
    "priority": "medium"
  }')

HTTP_CODE=$(echo "$APPOINTMENT_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$APPOINTMENT_RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ POST /appointments: HTTP $HTTP_CODE${NC}"
  APPOINTMENT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "Appointment ID: $APPOINTMENT_ID"
else
  echo -e "${RED}❌ POST /appointments: HTTP $HTTP_CODE${NC}"
  echo "$BODY"
fi

# READ Appointment
if [ -n "$APPOINTMENT_ID" ]; then
  echo "Reading appointment..."
  READ_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/appointments/$APPOINTMENT_ID" -H "$AUTH")
  HTTP_CODE=$(echo "$READ_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ GET /appointments/$APPOINTMENT_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ GET /appointments/$APPOINTMENT_ID: HTTP $HTTP_CODE${NC}"
  fi

  # UPDATE Appointment
  echo "Updating appointment..."
  UPDATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT "$BASE_URL/appointments/$APPOINTMENT_ID" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{"title": "Updated Visit", "status": "confirmed"}')
  HTTP_CODE=$(echo "$UPDATE_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PUT /appointments/$APPOINTMENT_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ PUT /appointments/$APPOINTMENT_ID: HTTP $HTTP_CODE${NC}"
    echo "$UPDATE_RESPONSE" | sed '/HTTP_CODE:/d'
  fi

  # DELETE Appointment
  echo "Deleting appointment..."
  DELETE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X DELETE "$BASE_URL/appointments/$APPOINTMENT_ID" -H "$AUTH")
  HTTP_CODE=$(echo "$DELETE_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo -e "${GREEN}✅ DELETE /appointments/$APPOINTMENT_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ DELETE /appointments/$APPOINTMENT_ID: HTTP $HTTP_CODE${NC}"
  fi
fi

# ============================================
# 7. NOTIFICATIONS CRUD
# ============================================
echo -e "\n${YELLOW}=== 7. NOTIFICATIONS CRUD ===${NC}"

# CREATE Notification - Using correct DTO fields (userId required, type enum)
echo "Creating notification..."
NOTIFICATION_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/notifications" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "type": "system",
    "title": "Test Notification",
    "message": "This is a test notification message"
  }')

HTTP_CODE=$(echo "$NOTIFICATION_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$NOTIFICATION_RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ POST /notifications: HTTP $HTTP_CODE${NC}"
  NOTIFICATION_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "Notification ID: $NOTIFICATION_ID"
else
  echo -e "${RED}❌ POST /notifications: HTTP $HTTP_CODE${NC}"
  echo "$BODY"
fi

# READ Notifications
echo "Reading notifications..."
READ_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/notifications" -H "$AUTH")
HTTP_CODE=$(echo "$READ_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ GET /notifications: HTTP $HTTP_CODE${NC}"
else
  echo -e "${RED}❌ GET /notifications: HTTP $HTTP_CODE${NC}"
fi

# DELETE Notification
if [ -n "$NOTIFICATION_ID" ]; then
  echo "Deleting notification..."
  DELETE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X DELETE "$BASE_URL/notifications/$NOTIFICATION_ID" -H "$AUTH")
  HTTP_CODE=$(echo "$DELETE_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo -e "${GREEN}✅ DELETE /notifications/$NOTIFICATION_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ DELETE /notifications/$NOTIFICATION_ID: HTTP $HTTP_CODE${NC}"
  fi
fi

# ============================================
# 8. CAMPAIGNS CRUD
# ============================================
echo -e "\n${YELLOW}=== 8. CAMPAIGNS CRUD ===${NC}"

# CREATE Campaign - Using correct DTO fields (type required with specific enum values)
echo "Creating campaign..."
CAMPAIGN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/prospecting/campaigns" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "description": "Test prospecting campaign",
    "type": "geographic",
    "targetCount": 100
  }')

HTTP_CODE=$(echo "$CAMPAIGN_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$CAMPAIGN_RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ POST /prospecting/campaigns: HTTP $HTTP_CODE${NC}"
  CAMPAIGN_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "Campaign ID: $CAMPAIGN_ID"
else
  echo -e "${RED}❌ POST /prospecting/campaigns: HTTP $HTTP_CODE${NC}"
  echo "$BODY"
fi

# READ Campaigns
echo "Reading campaigns..."
READ_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/prospecting/campaigns" -H "$AUTH")
HTTP_CODE=$(echo "$READ_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ GET /prospecting/campaigns: HTTP $HTTP_CODE${NC}"
else
  echo -e "${RED}❌ GET /prospecting/campaigns: HTTP $HTTP_CODE${NC}"
fi

# DELETE Campaign
if [ -n "$CAMPAIGN_ID" ]; then
  echo "Deleting campaign..."
  DELETE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X DELETE "$BASE_URL/prospecting/campaigns/$CAMPAIGN_ID" -H "$AUTH")
  HTTP_CODE=$(echo "$DELETE_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo -e "${GREEN}✅ DELETE /prospecting/campaigns/$CAMPAIGN_ID: HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ DELETE /prospecting/campaigns/$CAMPAIGN_ID: HTTP $HTTP_CODE${NC}"
  fi
fi

# ============================================
# 9. ANALYTICS & DASHBOARD (READ ONLY)
# ============================================
echo -e "\n${YELLOW}=== 9. ANALYTICS & DASHBOARD ===${NC}"

echo "Getting analytics dashboard..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/analytics/dashboard" -H "$AUTH")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ GET /analytics/dashboard: HTTP $HTTP_CODE${NC}"
else
  echo -e "${RED}❌ GET /analytics/dashboard: HTTP $HTTP_CODE${NC}"
fi

echo "Getting dashboard stats..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/dashboard/stats" -H "$AUTH")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ GET /dashboard/stats: HTTP $HTTP_CODE${NC}"
else
  echo -e "${RED}❌ GET /dashboard/stats: HTTP $HTTP_CODE${NC}"
fi

# ============================================
# 10. USERS CRUD
# ============================================
echo -e "\n${YELLOW}=== 10. USERS ===${NC}"

echo "Getting users list..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/users" -H "$AUTH")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ GET /users: HTTP $HTTP_CODE${NC}"
else
  echo -e "${RED}❌ GET /users: HTTP $HTTP_CODE${NC}"
fi

echo "Getting current user profile..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/users/profile" -H "$AUTH")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ GET /users/profile: HTTP $HTTP_CODE${NC}"
else
  echo -e "${RED}❌ GET /users/profile: HTTP $HTTP_CODE${NC}"
fi

# ============================================
# SUMMARY
# ============================================
echo -e "\n${YELLOW}============================================${NC}"
echo -e "${YELLOW}TEST COMPLETE${NC}"
echo -e "${YELLOW}============================================${NC}"
echo "All CRUD operations tested with corrected DTOs"
