# 📚 Guide Complet des Endpoints API - CRM Immobilier

Ce document contient toutes les commandes curl pour tester **TOUS** les endpoints du backend NestJS.

## 🔐 Variables d'Environnement

```bash
# Configuration de base
export API_URL="http://localhost:3000/api"
export ADMIN_TOKEN="votre_token_admin"
export USER_ID="votre_user_id"
export PROPERTY_ID="un_property_id"
export PROSPECT_ID="un_prospect_id"
export APPOINTMENT_ID="un_appointment_id"
```

---

## 📋 Table des Matières

1. [Authentification](#1-authentification)
2. [Utilisateurs](#2-utilisateurs)
3. [Propriétés](#3-propriétés)
4. [Prospects](#4-prospects)
5. [Rendez-vous](#5-rendez-vous)
6. [Tâches](#6-tâches)
7. [Analytics](#7-analytics)
8. [Documents](#8-documents)
9. [Communications](#9-communications)
10. [Settings](#10-settings)
11. [Dashboard](#11-dashboard)
12. [Intégrations](#12-intégrations)
13. [Campagnes Marketing](#13-campagnes-marketing)
14. [Marketing Tracking](#14-marketing-tracking)
15. [Matching AI](#15-matching-ai)
16. [Prospecting](#16-prospecting)
17. [Page Builder](#17-page-builder)
18. [Vitrine Publique](#18-vitrine-publique)

---

## 1. Authentification

### 📝 Register (Inscription)
```bash
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password@123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 🔑 Login (Connexion)
```bash
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password@123"
  }'
```

### 🔄 Refresh Token
```bash
curl -X POST $API_URL/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token"
  }'
```

### 👤 Get Current User Profile
```bash
curl -X GET $API_URL/auth/me \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🚪 Logout
```bash
curl -X POST $API_URL/auth/logout \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 2. Utilisateurs

### 📋 List All Users
```bash
curl -X GET $API_URL/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 👁️ Get User by ID
```bash
curl -X GET $API_URL/users/$USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ✏️ Update User
```bash
curl -X PUT $API_URL/users/$USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin",
    "firstName": "Updated Name"
  }'
```

### 🗑️ Delete User
```bash
curl -X DELETE $API_URL/users/$USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 3. Propriétés

### ➕ Create Property
```bash
curl -X POST $API_URL/properties \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Villa Moderne",
    "description": "Belle villa avec vue mer",
    "type": "villa",
    "category": "sale",
    "price": 850000,
    "area": 250,
    "bedrooms": 4,
    "bathrooms": 3,
    "address": "10 Avenue des Palmiers",
    "city": "Nice",
    "zipCode": "06000"
  }'
```

### 📋 List All Properties
```bash
curl -X GET $API_URL/properties \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 👁️ Get Property by ID
```bash
curl -X GET $API_URL/properties/$PROPERTY_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ✏️ Update Property
```bash
curl -X PUT $API_URL/properties/$PROPERTY_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 800000,
    "status": "sold"
  }'
```

### 🗑️ Delete Property
```bash
curl -X DELETE $API_URL/properties/$PROPERTY_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🔄 Sync Property with WordPress
```bash
curl -X PUT $API_URL/properties/$PROPERTY_ID/sync-wordpress \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wpSyncId": "wp_12345"
  }'
```

---

## 4. Prospects

### ➕ Create Prospect
```bash
curl -X POST $API_URL/prospects \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Marie",
    "lastName": "Dupont",
    "email": "marie.dupont@example.com",
    "phone": "+33612345678",
    "type": "buyer",
    "budget": 500000,
    "source": "website"
  }'
```

### 📋 List All Prospects
```bash
curl -X GET $API_URL/prospects \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 👁️ Get Prospect by ID
```bash
curl -X GET $API_URL/prospects/$PROSPECT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ✏️ Update Prospect
```bash
curl -X PUT $API_URL/prospects/$PROSPECT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "qualified",
    "budget": 550000
  }'
```

### 🗑️ Delete Prospect
```bash
curl -X DELETE $API_URL/prospects/$PROSPECT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📝 Add Interaction to Prospect
```bash
curl -X POST $API_URL/prospects/$PROSPECT_ID/interactions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "call",
    "notes": "Discussion about budget and preferences"
  }'
```

### 📜 Get Prospect Interactions
```bash
curl -X GET $API_URL/prospects/$PROSPECT_ID/interactions \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 5. Rendez-vous

### ➕ Create Appointment
```bash
curl -X POST $API_URL/appointments \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Visite Villa Nice",
    "description": "Première visite avec M. Dupont",
    "startTime": "2025-12-15T10:00:00Z",
    "endTime": "2025-12-15T11:00:00Z",
    "type": "visit",
    "status": "scheduled",
    "prospectId": "'$PROSPECT_ID'",
    "propertyId": "'$PROPERTY_ID'"
  }'
```

### 📋 List All Appointments
```bash
curl -X GET $API_URL/appointments \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📅 Get Upcoming Appointments
```bash
curl -X GET "$API_URL/appointments/upcoming?limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📆 Get Today's Appointments
```bash
curl -X GET $API_URL/appointments/today \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🕐 Get Availability
```bash
curl -X GET "$API_URL/appointments/availability?date=2025-12-15&duration=60" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📊 Get Appointments Stats
```bash
curl -X GET "$API_URL/appointments/stats?startDate=2025-12-01&endDate=2025-12-31" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 👁️ Get Appointment by ID
```bash
curl -X GET $API_URL/appointments/$APPOINTMENT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ✏️ Update Appointment
```bash
curl -X PUT $API_URL/appointments/$APPOINTMENT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'
```

### 🗑️ Delete Appointment
```bash
curl -X DELETE $API_URL/appointments/$APPOINTMENT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ✅ Mark Appointment as Complete
```bash
curl -X POST $API_URL/appointments/$APPOINTMENT_ID/complete \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "outcome": "Client interested, will make offer",
    "rating": 5
  }'
```

### ❌ Cancel Appointment
```bash
curl -X POST $API_URL/appointments/$APPOINTMENT_ID/cancel \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Client unavailable"
  }'
```

### 🔄 Reschedule Appointment
```bash
curl -X POST $API_URL/appointments/$APPOINTMENT_ID/reschedule \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newStartTime": "2025-12-16T14:00:00Z",
    "newEndTime": "2025-12-16T15:00:00Z"
  }'
```

### ⚠️ Check Appointment Conflicts
```bash
curl -X POST $API_URL/appointments/$APPOINTMENT_ID/conflicts \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2025-12-15T10:00:00Z",
    "endTime": "2025-12-15T11:00:00Z"
  }'
```

---

## 6. Tâches

### ➕ Create Task
```bash
curl -X POST $API_URL/tasks \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Préparer dossier vente",
    "description": "Compiler tous les documents",
    "dueDate": "2025-12-20T18:00:00Z",
    "priority": "high"
  }'
```

### 📋 List All Tasks
```bash
curl -X GET $API_URL/tasks \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📊 Get Tasks Stats
```bash
curl -X GET $API_URL/tasks/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📆 Get Today's Tasks
```bash
curl -X GET $API_URL/tasks/today \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ⏰ Get Overdue Tasks
```bash
curl -X GET $API_URL/tasks/overdue \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 👁️ Get Task by ID
```bash
curl -X GET $API_URL/tasks/$TASK_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ✏️ Update Task
```bash
curl -X PUT $API_URL/tasks/$TASK_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

### ✅ Mark Task as Complete
```bash
curl -X PUT $API_URL/tasks/$TASK_ID/complete \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🗑️ Delete Task
```bash
curl -X DELETE $API_URL/tasks/$TASK_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 7. Analytics

### 📊 Dashboard Analytics
```bash
curl -X GET $API_URL/analytics/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 👥 Prospects Stats
```bash
curl -X GET $API_URL/analytics/prospects \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🏠 Properties Stats
```bash
curl -X GET $API_URL/analytics/properties \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 💬 Communications Stats
```bash
curl -X GET $API_URL/analytics/communications \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📅 Appointments Stats
```bash
curl -X GET $API_URL/analytics/appointments \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ✅ Tasks Stats
```bash
curl -X GET $API_URL/analytics/tasks \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📈 Recent Activity
```bash
curl -X GET "$API_URL/analytics/activity?limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📉 Trends
```bash
curl -X GET "$API_URL/analytics/trends?period=month" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🎯 KPIs
```bash
curl -X GET $API_URL/analytics/kpis \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 8. Documents

### 📤 Upload Document
```bash
curl -X POST $API_URL/documents/upload \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F 'categoryId=category_id' \
  -F 'title=Document Title'
```

### 📋 List All Documents
```bash
curl -X GET $API_URL/documents \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 👁️ Get Document by ID
```bash
curl -X GET $API_URL/documents/$DOCUMENT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📥 Download Document
```bash
curl -X GET $API_URL/documents/$DOCUMENT_ID/download \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -o downloaded_document.pdf
```

### ✏️ Update Document
```bash
curl -X PUT $API_URL/documents/$DOCUMENT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title"
  }'
```

### 🗑️ Delete Document
```bash
curl -X DELETE $API_URL/documents/$DOCUMENT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📊 Documents Stats
```bash
curl -X GET $API_URL/documents/stats/overview \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🤖 Generate Document with AI
```bash
curl -X POST $API_URL/documents/ai/generate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "template_id",
    "variables": {
      "clientName": "John Doe",
      "propertyAddress": "123 Main St"
    }
  }'
```

### 📜 AI Generation History
```bash
curl -X GET "$API_URL/documents/ai/history?limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📈 AI Stats
```bash
curl -X GET $API_URL/documents/ai/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ⚙️ Get AI Settings
```bash
curl -X GET $API_URL/documents/ai/settings \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🔧 Update AI Settings
```bash
curl -X POST $API_URL/documents/ai/settings \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "anthropic",
    "model": "claude-3-sonnet"
  }'
```

### 🔍 OCR - Extract Text from Document
```bash
curl -X POST $API_URL/documents/$DOCUMENT_ID/ocr \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "fra"
  }'
```

### 📜 OCR History
```bash
curl -X GET "$API_URL/documents/ocr/history?limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🔎 Search in OCR Text
```bash
curl -X GET "$API_URL/documents/ocr/search?query=contract" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📁 Create Category
```bash
curl -X POST $API_URL/documents/categories \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Contracts",
    "color": "#FF5733"
  }'
```

### 📋 List Categories
```bash
curl -X GET $API_URL/documents/categories/list \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ✏️ Update Category
```bash
curl -X PUT $API_URL/documents/categories/$CATEGORY_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Legal Documents"
  }'
```

### 🗑️ Delete Category
```bash
curl -X DELETE $API_URL/documents/categories/$CATEGORY_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📝 Create Template
```bash
curl -X POST $API_URL/documents/templates \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sale Contract Template",
    "content": "Template content here..."
  }'
```

### 📋 List Templates
```bash
curl -X GET "$API_URL/documents/templates/list?category=contracts" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 👁️ Get Template by ID
```bash
curl -X GET $API_URL/documents/templates/$TEMPLATE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ✏️ Update Template
```bash
curl -X PUT $API_URL/documents/templates/$TEMPLATE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated content"
  }'
```

### 🗑️ Delete Template
```bash
curl -X DELETE $API_URL/documents/templates/$TEMPLATE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🎨 Generate Document from Template
```bash
curl -X POST $API_URL/documents/templates/$TEMPLATE_ID/generate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "clientName": "John Doe",
      "propertyAddress": "123 Main St"
    }
  }'
```

---

## 9. Communications

### 📧 Send Email
```bash
curl -X POST $API_URL/communications/email \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "client@example.com",
    "subject": "Your Property Visit",
    "body": "Thank you for your interest..."
  }'
```

### 📱 Send SMS
```bash
curl -X POST $API_URL/communications/sms \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+33612345678",
    "message": "Your appointment is confirmed for tomorrow at 10am"
  }'
```

### 💬 Send WhatsApp
```bash
curl -X POST $API_URL/communications/whatsapp \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+33612345678",
    "message": "Hello! Your property visit is scheduled."
  }'
```

### 📜 Get Communications History
```bash
curl -X GET $API_URL/communications/history \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📝 List Templates
```bash
curl -X GET "$API_URL/communications/templates?type=email" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ➕ Create Template
```bash
curl -X POST $API_URL/communications/templates \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Email",
    "type": "email",
    "content": "Welcome {{clientName}}!"
  }'
```

### 📊 Communications Stats
```bash
curl -X GET $API_URL/communications/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🧪 Test SMTP Connection
```bash
curl -X POST $API_URL/communications/smtp/test-connection \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📧 Send Test Email
```bash
curl -X POST $API_URL/communications/smtp/test-email \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com"
  }'
```

---

## 10. Settings

### 📋 Get All Settings
```bash
curl -X GET $API_URL/settings \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📂 Get Section Settings
```bash
curl -X GET $API_URL/settings/email \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🔍 Get Specific Setting
```bash
curl -X GET $API_URL/settings/email/smtp_host \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ✏️ Set Setting
```bash
curl -X POST $API_URL/settings/email/smtp_host \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "smtp.gmail.com",
    "encrypted": false,
    "description": "SMTP server host"
  }'
```

### 📝 Bulk Update Settings
```bash
curl -X POST $API_URL/settings/email/bulk \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": [
      {"key": "smtp_host", "value": "smtp.gmail.com"},
      {"key": "smtp_port", "value": "587"}
    ]
  }'
```

### 🗑️ Delete Setting
```bash
curl -X DELETE $API_URL/settings/email/smtp_host \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🗑️ Delete Section
```bash
curl -X DELETE $API_URL/settings/email \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🧪 Test Connection
```bash
curl -X POST $API_URL/settings/email/test \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🤖 Get Pica AI Config
```bash
curl -X GET $API_URL/settings/pica-ai/config \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 11. Dashboard

### 📊 Get Dashboard Stats
```bash
curl -X GET $API_URL/dashboard/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📈 Get Charts Data
```bash
curl -X GET $API_URL/dashboard/charts \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📜 Get Recent Activities
```bash
curl -X GET $API_URL/dashboard/activities \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🏆 Get Top Performers
```bash
curl -X GET $API_URL/dashboard/top-performers \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ⚠️ Get Alerts
```bash
curl -X GET $API_URL/dashboard/alerts \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 12. Intégrations

### ➕ Create/Update Integration
```bash
curl -X POST $API_URL/integrations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "wordpress",
    "apiKey": "your_api_key",
    "config": {
      "siteUrl": "https://your-site.com"
    }
  }'
```

### 📋 List All Integrations
```bash
curl -X GET $API_URL/integrations \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 👁️ Get Integration by Type
```bash
curl -X GET $API_URL/integrations/wordpress \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🔄 Toggle Integration
```bash
curl -X PUT $API_URL/integrations/wordpress/toggle \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": true
  }'
```

### 🗑️ Delete Integration
```bash
curl -X DELETE $API_URL/integrations/wordpress \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🧪 Test Integration
```bash
curl -X POST $API_URL/integrations/wordpress/test \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 13. Campagnes Marketing

### ➕ Create Campaign
```bash
curl -X POST $API_URL/campaigns \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale 2025",
    "type": "email",
    "startDate": "2025-06-01",
    "endDate": "2025-08-31"
  }'
```

### 📋 List All Campaigns
```bash
curl -X GET $API_URL/campaigns \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 👁️ Get Campaign by ID
```bash
curl -X GET $API_URL/campaigns/$CAMPAIGN_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ✏️ Update Campaign
```bash
curl -X PUT $API_URL/campaigns/$CAMPAIGN_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

### 🗑️ Delete Campaign
```bash
curl -X DELETE $API_URL/campaigns/$CAMPAIGN_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📊 Update Campaign Stats
```bash
curl -X PUT $API_URL/campaigns/$CAMPAIGN_ID/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sent": 1000,
    "opened": 450,
    "clicked": 120
  }'
```

### 👥 Get Campaign Leads
```bash
curl -X GET $API_URL/campaigns/$CAMPAIGN_ID/leads \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🔄 Convert Lead to Prospect
```bash
curl -X POST $API_URL/campaigns/leads/convert \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "lead_id",
    "prospectData": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }'
```

---

## 14. Marketing Tracking

### 📋 Get Tracking Configs
```bash
curl -X GET $API_URL/marketing-tracking/config \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ➕ Create/Update Tracking Config
```bash
curl -X POST $API_URL/marketing-tracking/config \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "google_ads",
    "pixelId": "AW-12345678",
    "isActive": true
  }'
```

### 🧪 Test Tracking Config
```bash
curl -X POST $API_URL/marketing-tracking/config/google_ads/test \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🗑️ Delete Tracking Config
```bash
curl -X DELETE $API_URL/marketing-tracking/config/google_ads \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📊 Track Event
```bash
curl -X POST $API_URL/marketing-tracking/events \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "page_view",
    "platform": "google_ads",
    "data": {
      "page": "/properties/villa-nice"
    }
  }'
```

### 📜 Get Events
```bash
curl -X GET "$API_URL/marketing-tracking/events?platform=google_ads" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📊 Get Event Stats
```bash
curl -X GET "$API_URL/marketing-tracking/events/stats?period=week" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🤖 Predict Conversion
```bash
curl -X GET $API_URL/marketing-tracking/ml/predict/$SESSION_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ⚠️ Detect Anomalies
```bash
curl -X GET "$API_URL/marketing-tracking/ml/anomalies?platform=google_ads" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📊 Get Segments
```bash
curl -X GET $API_URL/marketing-tracking/ml/segments \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📈 Get Attribution
```bash
curl -X GET "$API_URL/marketing-tracking/ml/attribution/$PROSPECT_ID?model=last_touch" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ⚙️ Get Automation Config
```bash
curl -X GET $API_URL/marketing-tracking/automation/config \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🔧 Update Automation Config
```bash
curl -X PUT $API_URL/marketing-tracking/automation/config \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autoOptimizeBudget": true
  }'
```

### 💡 Get Automation Suggestions
```bash
curl -X GET $API_URL/marketing-tracking/automation/suggestions \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ▶️ Apply Automation
```bash
curl -X POST $API_URL/marketing-tracking/automation/apply \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🌐 Track Public Event (No Auth)
```bash
curl -X POST $API_URL/public-tracking/event \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "eventName": "property_view",
    "platform": "website",
    "data": {
      "propertyId": "property_123"
    }
  }'
```

---

## 15. Matching AI

### 🎯 Generate Matches
```bash
curl -X POST $API_URL/matching/generate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 📋 List Matches
```bash
curl -X GET "$API_URL/matching?status=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ✏️ Update Match Status
```bash
curl -X PUT $API_URL/matching/$MATCH_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted"
  }'
```

### ⚡ Perform Action on Match
```bash
curl -X POST $API_URL/matching/$MATCH_ID/action \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "schedule_visit",
    "data": {
      "date": "2025-12-20T10:00:00Z"
    }
  }'
```

### 📜 Get Interactions History
```bash
curl -X GET $API_URL/matching/interactions \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 16. Prospecting

### 📋 Get Campaigns
```bash
curl -X GET $API_URL/prospecting/campaigns \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📊 Get Prospecting Stats
```bash
curl -X GET $API_URL/prospecting/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 17. Page Builder

### 📋 Get All Pages
```bash
curl -X GET $API_URL/page-builder/pages \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 👁️ Get Page by ID
```bash
curl -X GET $API_URL/page-builder/pages/$PAGE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ➕ Create Page
```bash
curl -X POST $API_URL/page-builder/pages \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Landing Page",
    "slug": "my-landing-page",
    "sections": []
  }'
```

### ✏️ Update Page
```bash
curl -X PUT $API_URL/page-builder/pages/$PAGE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title"
  }'
```

### 🗑️ Delete Page
```bash
curl -X DELETE $API_URL/page-builder/pages/$PAGE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🔄 Toggle Publish
```bash
curl -X POST $API_URL/page-builder/pages/$PAGE_ID/toggle-publish \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'
```

### 📋 Duplicate Page
```bash
curl -X POST $API_URL/page-builder/pages/$PAGE_ID/duplicate \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📝 Get Templates
```bash
curl -X GET $API_URL/page-builder/templates \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🎨 Create Page from Template
```bash
curl -X POST $API_URL/page-builder/templates/$TEMPLATE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Page from Template"
  }'
```

### 🌐 Get Public Page (No Auth)
```bash
curl -X GET "$API_URL/public-pages/my-landing-page?userId=$USER_ID"
```

---

## 18. Vitrine Publique

### ⚙️ Get Vitrine Config
```bash
curl -X GET $API_URL/vitrine/config \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🔧 Update Vitrine Config
```bash
curl -X PUT $API_URL/vitrine/config \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agencyName": "Immobilier Premium",
    "logo": "https://example.com/logo.png",
    "theme": "modern"
  }'
```

### 🏠 Get Published Properties
```bash
curl -X GET $API_URL/vitrine/published-properties \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📢 Publish Property
```bash
curl -X POST $API_URL/vitrine/properties/$PROPERTY_ID/publish \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "featured": true,
    "customDescription": "Exclusive property!"
  }'
```

### ❌ Unpublish Property
```bash
curl -X DELETE $API_URL/vitrine/properties/$PROPERTY_ID/unpublish \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 📊 Get Vitrine Analytics
```bash
curl -X GET "$API_URL/vitrine/analytics?period=month" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 🌐 Get Public Vitrine (No Auth)
```bash
curl -X GET $API_URL/vitrine/public/$USER_ID
```

---

## 📝 Notes Importantes

1. **Tokens d'Authentification:**
   - Tous les endpoints (sauf publics) nécessitent un `Authorization: Bearer TOKEN`
   - Le token s'obtient via `/auth/login`
   - Le token expire après 1h (configurable)

2. **IDs Dynamiques:**
   - Remplacez `$USER_ID`, `$PROPERTY_ID`, etc. par les vrais IDs
   - Les IDs sont retournés lors de la création des ressources

3. **Formats de Date:**
   - Utilisez le format ISO 8601: `2025-12-20T10:00:00Z`

4. **Upload de Fichiers:**
   - Utilisez `-F` au lieu de `-H "Content-Type: application/json"`
   - Format: `curl -F "file=@/path/to/file.pdf"`

5. **Pagination et Filtres:**
   - La plupart des endpoints supportent `?limit=` et `?offset=`
   - Les filtres varient selon l'endpoint

---

## 🎯 Tests Rapides

### Test Santé du Serveur
```bash
curl -X GET $API_URL
```

### Test Complet (Workflow)
```bash
# 1. Login
TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm-immobilier.local","password":"Admin@123456"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# 2. Get Profile
curl -X GET $API_URL/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. List Properties
curl -X GET $API_URL/properties \
  -H "Authorization: Bearer $TOKEN"
```

---

**📚 Documentation Générée Automatiquement**
**Version:** 1.0.0
**Date:** 2025-11-21
**Backend:** NestJS + Prisma + PostgreSQL
