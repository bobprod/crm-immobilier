#!/bin/bash

# Script de test détaillé avec affichage des erreurs
BASE_URL="http://localhost:3001/api"

# Login
echo "=== LOGIN ==="
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"Admin123!"}')
echo "$LOGIN_RESP"
TOKEN=$(echo "$LOGIN_RESP" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//' | sed 's/"//')
echo "Token: ${TOKEN:0:20}..."
echo ""

# Test POST User (Register)
echo "=== POST /auth/register ==="
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser_'$(date +%s)'@test.com",
    "password":"Test123!",
    "firstName":"Test",
    "lastName":"User"
  }'
echo -e "\n"

# Test POST Property
echo "=== POST /properties ==="
curl -s -X POST "$BASE_URL/properties" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Property",
    "type":"apartment",
    "status":"available",
    "price":250000,
    "surface":85,
    "rooms":3,
    "bedrooms":2,
    "address":"123 Test Street",
    "city":"Paris",
    "zipCode":"75001",
    "description":"Test property"
  }'
echo -e "\n"

# Test POST Prospect
echo "=== POST /prospects ==="
curl -s -X POST "$BASE_URL/prospects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"John",
    "lastName":"Doe",
    "email":"john.doe.'$(date +%s)'@test.com",
    "phone":"+33612345678",
    "status":"active",
    "source":"web"
  }'
echo -e "\n"

# Test POST Task
echo "=== POST /tasks ==="
curl -s -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Task",
    "description":"Test task description",
    "priority":"high",
    "status":"todo",
    "dueDate":"2025-12-25T12:00:00Z"
  }'
echo -e "\n"

# Test POST Notification
echo "=== POST /notifications ==="
curl -s -X POST "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Notification",
    "message":"Test notification message",
    "type":"info"
  }'
echo -e "\n"

# Test POST Campaign
echo "=== POST /prospecting/campaigns ==="
curl -s -X POST "$BASE_URL/prospecting/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Campaign",
    "description":"Test campaign description",
    "status":"draft",
    "source":"manual"
  }'
echo -e "\n"

# Test GET/PUT LLM Config
echo "=== GET /llm-config ==="
curl -s -X GET "$BASE_URL/llm-config" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "=== PUT /llm-config ==="
curl -s -X PUT "$BASE_URL/llm-config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider":"openai",
    "model":"gpt-4",
    "apiKey":"test-key"
  }'
echo -e "\n"
