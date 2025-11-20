# CRM Immobilier - API Testing Guide

## Environment Setup

**Backend URL:** `http://localhost:3000`
**Database:** PostgreSQL (Neon) - Configured in `.env`

## Test User Credentials

### 1. Admin User
```
Email: admin@crm-immobilier.local
Password: Admin@123456
Role: admin
Name: Admin User
```

### 2. Manager User
```
Email: manager@crm-immobilier.local
Password: Manager@123456
Role: manager
Name: Marie Manager
```

### 3. Agent User
```
Email: agent@crm-immobilier.local
Password: Agent@123456
Role: agent
Name: Pierre Agent
```

---

## API Endpoints Overview

### Core Modules

#### 1. Authentication (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user profile
- `POST /auth/logout` - Logout user

#### 2. Users (`/users`)
- `GET /users` - Get all users (requires auth)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### 3. Settings (`/settings`)
- Settings management endpoints

### Business Modules

#### 4. Properties (`/properties`)
- `POST /properties` - Create property
- `GET /properties` - Get all properties (with filters)
- `GET /properties/:id` - Get property by ID
- `PUT /properties/:id` - Update property
- `DELETE /properties/:id` - Delete property
- `PUT /properties/:id/sync-wordpress` - Sync with WordPress

#### 5. Prospects (`/prospects`)
- `POST /prospects` - Create prospect
- `GET /prospects` - Get all prospects (with filters)
- `GET /prospects/:id` - Get prospect by ID
- `PUT /prospects/:id` - Update prospect
- `DELETE /prospects/:id` - Delete prospect
- `POST /prospects/:id/interactions` - Add interaction
- `GET /prospects/:id/interactions` - Get interactions

#### 6. Appointments (`/appointments`)
- Full CRUD operations for appointments

#### 7. Tasks (`/tasks`)
- Full CRUD operations for tasks

### Intelligence Modules

#### 8. Matching (`/matching`)
- AI-powered property-prospect matching

#### 9. Analytics (`/analytics`)
- Analytics and reporting

#### 10. Validation (`/validation`)
- Contact validation services

### Other Modules

#### 11. Dashboard (`/dashboard`)
- `GET /dashboard/stats` - Global statistics
- `GET /dashboard/charts` - Chart data
- `GET /dashboard/activities` - Recent activities
- `GET /dashboard/top-performers` - Top performers
- `GET /dashboard/alerts` - Alerts and notifications

#### 12. Communications (`/communications`)
- Email, SMS, WhatsApp communications

#### 13. Documents (`/documents`)
- Document management with AI generation

#### 14. Campaigns (`/campaigns`)
- Marketing campaign management

#### 15. Prospecting (`/prospecting`)
- Intelligent prospecting tools

---

## Testing Instructions

### Prerequisites

1. Ensure backend server is running:
```bash
cd /home/user/crm-immobilier/backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

2. Server should be accessible at `http://localhost:3000`

### Test Flow

1. **Create Test Users** (see `test-api.sh` script)
2. **Login with each user**
3. **Test endpoints with different roles**
4. **Verify role-based access control**

---

## Notes

- All endpoints except `/auth/register` and `/auth/login` require JWT authentication
- Include `Authorization: Bearer <token>` header for protected endpoints
- The backend uses NestJS with Prisma ORM
- Database migrations are managed through Prisma

---

## Troubleshooting

### If server won't start:
```bash
# Check Prisma setup
npx prisma generate

# Push schema to database
npx prisma db push

# Check database connection
npx prisma studio
```

### If tests fail:
1. Verify server is running on port 3000
2. Check database connection in `.env`
3. Ensure JWT secrets are properly configured
4. Check for existing users in database
