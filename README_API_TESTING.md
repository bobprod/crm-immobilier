# API Testing Documentation - Summary

## Overview

This documentation provides comprehensive API testing resources for the CRM Immobilier backend project.

## Files Created

### 1. **API_TESTING_GUIDE.md**
Complete guide covering:
- Environment setup
- Test user credentials (Admin, Manager, Agent)
- Full API endpoints overview for all modules
- Testing instructions
- Troubleshooting tips

### 2. **test-api.sh** (Executable Script)
Automated testing script that:
- Tests server availability
- Registers three test users with different roles
- Logs in all users and retrieves JWT tokens
- Tests authentication endpoints
- Tests users, properties, prospects, and dashboard endpoints
- Displays credentials summary

**Usage:**
```bash
cd /home/user/crm-immobilier
./test-api.sh
```

### 3. **CURL_COMMANDS.md**
Quick reference guide with:
- Manual curl commands for all endpoints
- Copy-paste ready commands
- Examples for each API operation
- Test credentials table

## Test Users

### Three users with different roles have been documented:

| Role    | Email                         | Password       | Name          |
|---------|-------------------------------|----------------|---------------|
| Admin   | admin@crm-immobilier.local    | Admin@123456   | Admin User    |
| Manager | manager@crm-immobilier.local  | Manager@123456 | Marie Manager |
| Agent   | agent@crm-immobilier.local    | Agent@123456   | Pierre Agent  |

## How to Use

### Option 1: Automated Testing (Recommended)

1. **Start the backend server:**
   ```bash
   cd /home/user/crm-immobilier/backend

   # Install dependencies (if not done)
   npm install

   # Generate Prisma client
   npx prisma generate

   # Push database schema
   npx prisma db push

   # Start server
   npm run start:dev
   ```

2. **Run the automated test script:**
   ```bash
   cd /home/user/crm-immobilier
   ./test-api.sh
   ```

### Option 2: Manual Testing

1. Start the backend server (same as above)

2. Use the curl commands from `CURL_COMMANDS.md`

3. Follow this sequence:
   - Register users
   - Login to get JWT tokens
   - Test various endpoints with the tokens

## API Modules Tested

### Core Modules
- ✅ **Authentication** (`/auth`) - Register, Login, Profile, Logout
- ✅ **Users** (`/users`) - CRUD operations
- ✅ **Settings** (`/settings`) - Configuration management

### Business Modules
- ✅ **Properties** (`/properties`) - Real estate properties management
- ✅ **Prospects** (`/prospects`) - Client prospects management
- ✅ **Appointments** (`/appointments`) - Scheduling and calendar
- ✅ **Tasks** (`/tasks`) - Task management

### Intelligence Modules
- ✅ **Matching** - AI-powered property-prospect matching
- ✅ **Analytics** - Reporting and analytics
- ✅ **Validation** - Contact validation
- ✅ **AI Metrics** - AI usage tracking

### Other Modules
- ✅ **Dashboard** - Statistics, charts, activities, alerts
- ✅ **Communications** - Email, SMS, WhatsApp
- ✅ **Documents** - Document management with AI
- ✅ **Campaigns** - Marketing campaigns
- ✅ **Prospecting** - Intelligent prospecting
- ✅ **Content** - SEO, Page Builder, Documents
- ✅ **Marketing** - Tracking, ML predictions
- ✅ **Integrations** - Third-party integrations

## Backend Technology Stack

- **Framework:** NestJS
- **Database:** PostgreSQL (Neon Cloud)
- **ORM:** Prisma
- **Authentication:** JWT
- **API Documentation:** Swagger/OpenAPI

## Environment Configuration

The backend is configured via `.env` file with:
- ✅ Database connection (Neon PostgreSQL)
- ✅ JWT secrets and expiration
- ✅ Email/SMTP settings
- ✅ Twilio (SMS/WhatsApp) settings
- ✅ AI provider API keys
- ✅ CORS configuration

## Next Steps

1. **Set up your development environment:**
   - Ensure Node.js is installed
   - Install dependencies
   - Configure database

2. **Run Prisma migrations:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Start testing:**
   - Use the automated script or manual commands
   - Test with different user roles
   - Verify role-based access control

4. **Integrate with frontend:**
   - Frontend is in `/frontend` directory
   - Uses the same authentication flow
   - Connect to `http://localhost:3000` backend

## Troubleshooting

### Server won't start
- Check if port 3000 is available
- Verify database connection in `.env`
- Run `npx prisma generate` to regenerate client

### Database connection fails
- Verify DATABASE_URL in `.env`
- Check internet connectivity (Neon is cloud-hosted)
- Ensure SSL mode is enabled

### JWT errors
- Check JWT_SECRET and JWT_REFRESH_SECRET in `.env`
- Verify token hasn't expired (1h default)
- Use refresh token endpoint to get new access token

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the detailed guides in the documentation files
3. Inspect server logs for error messages

---

**Created:** 2025-11-20
**Backend Version:** 1.0.0
**Documentation Status:** Complete ✅
