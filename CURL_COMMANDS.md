# Quick Curl Commands Reference

## Base Configuration
```bash
export BASE_URL="http://localhost:3000"
```

## 1. Register Users

### Register Admin
```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crm-immobilier.local",
    "password": "Admin@123456",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### Register Manager
```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@crm-immobilier.local",
    "password": "Manager@123456",
    "firstName": "Marie",
    "lastName": "Manager"
  }'
```

### Register Agent
```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@crm-immobilier.local",
    "password": "Agent@123456",
    "firstName": "Pierre",
    "lastName": "Agent"
  }'
```

## 2. Login

### Login as Admin
```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crm-immobilier.local",
    "password": "Admin@123456"
  }' | jq -r '.accessToken'

# Save token
export ADMIN_TOKEN="<paste_token_here>"
```

### Login as Manager
```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@crm-immobilier.local",
    "password": "Manager@123456"
  }' | jq -r '.accessToken'

# Save token
export MANAGER_TOKEN="<paste_token_here>"
```

### Login as Agent
```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@crm-immobilier.local",
    "password": "Agent@123456"
  }' | jq -r '.accessToken'

# Save token
export AGENT_TOKEN="<paste_token_here>"
```

## 3. Test Authentication

### Get Current User Profile
```bash
# Admin
curl -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Manager
curl -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $MANAGER_TOKEN" | jq '.'

# Agent
curl -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
```

### Refresh Token
```bash
curl -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<your_refresh_token>"
  }'
```

### Logout
```bash
curl -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 4. Users Management

### Get All Users (Admin only)
```bash
curl -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
```

### Get User by ID
```bash
curl -X GET "$BASE_URL/users/<user_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
```

### Update User
```bash
curl -X PUT "$BASE_URL/users/<user_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name"
  }' | jq '.'
```

## 5. Properties Management

### Create Property
```bash
curl -X POST "$BASE_URL/properties" \
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
  }' | jq '.'
```

### Get All Properties
```bash
curl -X GET "$BASE_URL/properties" \
  -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'

# With filters
curl -X GET "$BASE_URL/properties?city=Tunis&type=apartment&minPrice=200000&maxPrice=500000" \
  -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
```

### Get Property by ID
```bash
curl -X GET "$BASE_URL/properties/<property_id>" \
  -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
```

### Update Property
```bash
curl -X PUT "$BASE_URL/properties/<property_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 800000,
    "status": "sold"
  }' | jq '.'
```

### Delete Property
```bash
curl -X DELETE "$BASE_URL/properties/<property_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 6. Prospects Management

### Create Prospect
```bash
curl -X POST "$BASE_URL/prospects" \
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
  }' | jq '.'
```

### Get All Prospects
```bash
curl -X GET "$BASE_URL/prospects" \
  -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
```

### Get Prospect by ID
```bash
curl -X GET "$BASE_URL/prospects/<prospect_id>" \
  -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
```

### Update Prospect
```bash
curl -X PUT "$BASE_URL/prospects/<prospect_id>" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "qualified",
    "score": 85
  }' | jq '.'
```

### Add Interaction to Prospect
```bash
curl -X POST "$BASE_URL/prospects/<prospect_id>/interactions" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "phone",
    "type": "call",
    "subject": "Property viewing follow-up",
    "notes": "Client is very interested in the Carthage villa",
    "sentiment": "positive"
  }' | jq '.'
```

### Get Prospect Interactions
```bash
curl -X GET "$BASE_URL/prospects/<prospect_id>/interactions" \
  -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
```

## 7. Dashboard Endpoints

### Get Dashboard Stats
```bash
curl -X GET "$BASE_URL/dashboard/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
```

### Get Charts Data
```bash
curl -X GET "$BASE_URL/dashboard/charts" \
  -H "Authorization: Bearer $MANAGER_TOKEN" | jq '.'
```

### Get Recent Activities
```bash
curl -X GET "$BASE_URL/dashboard/activities" \
  -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
```

### Get Top Performers
```bash
curl -X GET "$BASE_URL/dashboard/top-performers" \
  -H "Authorization: Bearer $MANAGER_TOKEN" | jq '.'
```

### Get Alerts
```bash
curl -X GET "$BASE_URL/dashboard/alerts" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
```

## 8. Appointments

### Create Appointment
```bash
curl -X POST "$BASE_URL/appointments" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Property Viewing",
    "description": "Show villa to prospect",
    "startTime": "2025-11-25T10:00:00Z",
    "endTime": "2025-11-25T11:00:00Z",
    "type": "visit",
    "status": "scheduled",
    "priority": "high"
  }' | jq '.'
```

### Get All Appointments
```bash
curl -X GET "$BASE_URL/appointments" \
  -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
```

## 9. Tasks

### Create Task
```bash
curl -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Follow up with client",
    "description": "Call Ahmed about property viewing feedback",
    "status": "todo",
    "priority": "high",
    "dueDate": "2025-11-22T17:00:00Z"
  }' | jq '.'
```

### Get All Tasks
```bash
curl -X GET "$BASE_URL/tasks" \
  -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
```

---

## Test Credentials

| Role    | Email                           | Password       |
|---------|--------------------------------|----------------|
| Admin   | admin@crm-immobilier.local     | Admin@123456   |
| Manager | manager@crm-immobilier.local   | Manager@123456 |
| Agent   | agent@crm-immobilier.local     | Agent@123456   |

---

## Notes

- Replace `<user_id>`, `<property_id>`, `<prospect_id>` with actual IDs
- All commands use `jq` for JSON formatting (optional)
- Tokens expire after 1 hour (configured in JWT_EXPIRATION)
- Use refresh token endpoint to get new access tokens
