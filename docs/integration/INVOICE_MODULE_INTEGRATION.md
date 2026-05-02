# CRM Immo Saas — Invoice Module Integration Pack

> Prepared for the third-party invoice module developer.
> All information extracted directly from the live codebase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Structure](#2-project-structure)
3. [Database Schema](#3-database-schema)
4. [User Model](#4-user-model)
5. [Authentication](#5-authentication)
6. [Database Connection](#6-database-connection)
7. [Example API Endpoints](#7-example-api-endpoints)
8. [Environment Variables](#8-environment-variables)
9. [Backend package.json](#9-backend-packagejson)

---

## 1. Project Overview

| Property | Value |
|----------|-------|
| Project | CRM Immo Saas (Real Estate CRM) |
| Backend framework | NestJS v10.3.0 (TypeScript) |
| Frontend framework | Next.js 16 / React 19 |
| Database | PostgreSQL (hosted on Neon serverless) |
| ORM | Prisma v6.19.1 |
| Auth method | JWT Bearer tokens (passport-jwt) |
| API prefix | `/api` (all routes start with `/api/...`) |
| Swagger docs | `http://localhost:3000/api/docs` |
| Total DB models | 112 models |
| Architecture | Multi-tenant (per agency) |

---

## 2. Project Structure

```
Immo Saas/                          ← monorepo root
├── backend/                        ← NestJS API
│   ├── prisma/
│   │   ├── schema.prisma           ← 112 DB models (source of truth)
│   │   └── migrations/             ← SQL migrations history
│   ├── src/
│   │   ├── main.ts                 ← entry point, sets global prefix /api
│   │   ├── config/
│   │   │   ├── database.config.ts  ← Prisma/Neon connection
│   │   │   └── jwt.config.ts       ← JWT secret & expiry
│   │   ├── shared/
│   │   │   └── database/
│   │   │       └── prisma.service.ts   ← global PrismaClient singleton
│   │   └── modules/
│   │       ├── core/
│   │       │   └── auth/
│   │       │       ├── auth.controller.ts      ← /api/auth/*
│   │       │       ├── auth.service.ts
│   │       │       ├── guards/
│   │       │       │   └── jwt-auth.guard.ts   ← USE THIS to protect routes
│   │       │       └── strategies/
│   │       │           └── jwt.strategy.ts     ← token validation
│   │       └── business/
│   │           ├── finance/
│   │           │   └── finance.controller.ts   ← existing invoices/payments
│   │           ├── properties/
│   │           ├── prospects/
│   │           └── ...
│   ├── package.json
│   ├── .env                        ← real secrets (git-ignored)
│   └── .env.example
│
└── frontend/                       ← Next.js (not relevant for API integration)
```

### Where to add the invoice module

```
backend/src/modules/business/invoices/
├── invoices.module.ts
├── invoices.controller.ts    ← /api/invoices/*
├── invoices.service.ts
└── dto/
    ├── create-invoice.dto.ts
    └── update-invoice.dto.ts
```

Register it in `backend/src/app.module.ts` under the `imports` array.

---

## 3. Database Schema

> Database engine: **PostgreSQL**
> All primary keys are **CUID strings** (25-char), never INT or UUID.
> Managed via **Prisma Migrate** — never edit tables manually.

### users table

```sql
CREATE TABLE "users" (
    "id"                  TEXT         NOT NULL,   -- CUID
    "email"               TEXT         NOT NULL,   -- unique, lowercase
    "password"            TEXT         NOT NULL,   -- bcrypt hash, 10 rounds
    "firstName"           TEXT,
    "lastName"            TEXT,
    "agencyId"            TEXT,                    -- FK → agencies.id (tenant)
    "role"                TEXT         NOT NULL DEFAULT 'AGENT',
    "wordpressPassword"   TEXT,
    "wordpressUrl"        TEXT,
    "wordpressUsername"   TEXT,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
```

### agencies table (= "companies" / tenant)

```sql
CREATE TABLE "agencies" (
    "id"        TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "address"   TEXT,
    "phone"     TEXT,
    "email"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);
```

### Invoice table (already exists)

```sql
CREATE TABLE "Invoice" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,   -- FK → users.id
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
```

### Foreign keys

```sql
ALTER TABLE "users"
    ADD CONSTRAINT "users_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice"
    ADD CONSTRAINT "Invoice_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
```

### Role enum

```
ADMIN    — full access, sees all agency data
AGENT    — standard agent, sees own data only  (default)
MANAGER  — elevated permissions within agency
```

### Adding new tables (migration workflow)

```bash
# 1. Edit backend/prisma/schema.prisma — add your model
# 2. Run:
cd backend
npx prisma migrate dev --name add_invoice_module
npx prisma generate
# Done — new table created and TypeScript client updated
```

---

## 4. User Model

Full Prisma definition:

```prisma
model users {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String                         -- bcrypt, never returned in API
  firstName         String?
  lastName          String?
  agencyId          String?                        -- tenant FK
  role              UserRole  @default(AGENT)
  wordpressPassword String?
  wordpressUrl      String?
  wordpressUsername String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  agencies     agencies? @relation(fields: [agencyId], references: [id])

  -- Finance relations (relevant to invoice module)
  invoices     Invoice[]      @relation("UserInvoices")
  payments     Payment[]      @relation("UserPayments")
  transactions Transaction[]  @relation("UserTransactions")
  commissions  Commission[]   @relation("UserCommissions")

  -- ...40+ other relations
}

enum UserRole {
  ADMIN
  AGENT
  MANAGER
}
```

### Field reference

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | PK, auto-generated |
| `email` | String | Unique, always lowercased |
| `password` | String | bcrypt — NEVER expose in responses |
| `firstName` | String? | Optional |
| `lastName` | String? | Optional |
| `agencyId` | String? | Tenant discriminator |
| `role` | UserRole | ADMIN / AGENT / MANAGER |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

### Query examples

```typescript
// Get user + agency info
const user = await prisma.users.findUnique({
  where: { id: userId },
  select: {
    id: true, email: true, firstName: true,
    lastName: true, role: true, agencyId: true,
    agencies: { select: { id: true, name: true } }
  }
});

// Safe response — strip password
const { password: _, ...safeUser } = user;

// Find by email (auth)
const user = await prisma.users.findUnique({
  where: { email: email.toLowerCase().trim() }
});
```

---

## 5. Authentication

### Method: JWT Bearer Tokens

| Property | Value |
|----------|-------|
| Library | `@nestjs/jwt` + `passport-jwt` |
| Token location | `Authorization: Bearer <token>` header |
| Token expiry | 7 days (access), 30 days (refresh) |
| Password hashing | bcrypt, salt rounds = 10 |
| OAuth providers | Google OAuth 2.0, Facebook Login |

### JWT payload structure

```json
{
  "sub":   "clx2k9q0e0000abc12345wxyz",
  "email": "agent@agence.com",
  "role":  "AGENT",
  "iat":   1710000000,
  "exp":   1710604800
}
```

After validation, `req.user` contains:

```typescript
req.user = {
  sub:    "clx2k9q0e0000abc12345wxyz",
  userId: "clx2k9q0e0000abc12345wxyz",  // alias of sub
  email:  "agent@agence.com",
  role:   "AGENT"
}
```

### JWT config location

| Variable | File |
|----------|------|
| `JWT_SECRET` | `backend/.env` |
| `JWT_EXPIRES_IN` | `backend/.env` (value: `7d`) |
| `JWT_REFRESH_SECRET` | `backend/.env` |
| `JWT_REFRESH_EXPIRES_IN` | `backend/.env` (value: `30d`) |

Config registered in: `backend/src/config/jwt.config.ts`
Strategy file: `backend/src/modules/core/auth/strategies/jwt.strategy.ts`

```typescript
// jwt.strategy.ts — how tokens are validated
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return {
      sub:    payload.sub,
      userId: payload.sub,
      email:  payload.email,
      role:   payload.role
    };
  }
}
```

### Protecting a route

```typescript
import { UseGuards, Request, Get, Controller } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)   // ← protects all routes in this controller
export class InvoicesController {

  @Get()
  findAll(@Request() req) {
    const userId   = req.user.userId;  // authenticated user ID
    const role     = req.user.role;    // ADMIN | AGENT | MANAGER
    const agencyId = ...;              // fetch from DB if needed
    // ...
  }
}
```

### Auth endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create user |
| POST | `/api/auth/login` | No | Returns `accessToken` + `refreshToken` |
| POST | `/api/auth/refresh` | No | Exchange refresh for new access token |
| GET | `/api/auth/me` | Yes | Current user profile |
| POST | `/api/auth/logout` | Yes | Logout |

### Login response

```json
{
  "accessToken":  "eyJhbGciOiJIUzI1NiIsInR...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id":        "clx2k9q0e0000abc12345wxyz",
    "email":     "agent@agence.com",
    "firstName": "Jean",
    "lastName":  "Dupont",
    "role":      "AGENT",
    "agencyId":  "clx9abc0e0000xyz99999aaaa"
  }
}
```

---

## 6. Database Connection

### ORM: Prisma + Neon serverless

| Property | Value |
|----------|-------|
| ORM | Prisma v6.19.1 |
| Adapter | `@prisma/adapter-neon` (serverless) |
| Driver | `@neondatabase/serverless` |
| Connection | Via `DATABASE_URL` env var |

### PrismaService — global singleton

```typescript
// backend/src/shared/database/prisma.service.ts
// Import and inject this in any module that needs DB access

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

### Using it in your service

```typescript
@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.invoice.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateInvoiceDto) {
    return this.prisma.invoice.create({
      data: { ...dto, userId },
    });
  }
}
```

### Migration commands

```bash
cd backend

# Create + apply new migration (dev)
npx prisma migrate dev --name add_invoice_module

# Apply pending migrations (production)
npx prisma migrate deploy

# Check status
npx prisma migrate status

# Regenerate TS client after schema change
npx prisma generate

# Visual DB browser
npx prisma studio
```

### Connection string format

```
# Local dev
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crm_immobilier?schema=public"

# Neon cloud
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/crm_immobilier?sslmode=require"
```

---

## 7. Example API Endpoints

### GET /api/auth/me — Current user

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
async getProfile(@Request() req) {
  return this.authService.validateUser(req.user.userId);
}
```

```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...
```

Response:
```json
{
  "id":        "clx2k9q0e0000abc12345wxyz",
  "email":     "agent@agence.com",
  "firstName": "Jean",
  "lastName":  "Dupont",
  "role":      "AGENT",
  "agencyId":  "clx9abc0e0000xyz99999aaaa"
}
```

---

### POST /api/auth/login — Login

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "agent@agence.com", "password": "MyPassword123" }
```

---

### POST /api/properties — Create property

```typescript
@Post()
@UseGuards(JwtAuthGuard)
create(@Request() req, @Body() dto: CreatePropertyDto) {
  return this.propertiesService.create(req.user.userId, dto);
}
```

---

### GET /api/properties — List with filters

```http
GET /api/properties?type=apartment&city=Paris&minPrice=100000
Authorization: Bearer ...
```

---

### Invoice module controller template (copy this)

```typescript
// backend/src/modules/business/invoices/invoices.controller.ts

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create invoice' })
  create(@Request() req, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List invoices' })
  findAll(@Request() req, @Query() filters: any) {
    return this.invoicesService.findAll(req.user.userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.invoicesService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update invoice' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice' })
  remove(@Request() req, @Param('id') id: string) {
    return this.invoicesService.remove(req.user.userId, id);
  }
}
```

---

## 8. Environment Variables

Minimum required to run the invoice module:

```env
# REQUIRED
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/crm_immobilier?schema=public"
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-different-from-above
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=http://localhost:3003
CORS_ORIGIN=http://localhost:3003

# OPTIONAL (other integrations)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=noreply@crm-immobilier.com
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
THROTTLE_TTL=60000
THROTTLE_LIMIT=60
WORDPRESS_API_URL=
WORDPRESS_USERNAME=
WORDPRESS_APP_PASSWORD=
```

---

## 9. Backend package.json

```json
{
  "name": "crm-immobilier-backend",
  "version": "1.0.0",
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/config": "^3.1.1",
    "@nestjs/swagger": "^7.1.17",
    "@nestjs/throttler": "^5.1.1",
    "@nestjs/cache-manager": "^2.3.0",
    "@nestjs/bull": "^11.0.4",
    "@nestjs/schedule": "^4.0.0",
    "@nestjs/event-emitter": "^3.0.1",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/platform-socket.io": "^10.4.20",
    "@nestjs/websockets": "^10.4.20",
    "@prisma/client": "6.19.1",
    "@prisma/adapter-neon": "^7.0.1",
    "@neondatabase/serverless": "^1.0.2",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-google-oauth20": "^2.0.0",
    "passport-facebook": "^3.0.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.3",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "axios": "^1.15.0",
    "express": "^4.18.2",
    "rxjs": "^7.8.1",
    "reflect-metadata": "^0.2.1",
    "nodemailer": "^6.9.8",
    "twilio": "^4.20.0",
    "bull": "^4.16.5",
    "cache-manager": "^5.7.6",
    "uuid": "^9.0.1",
    "dotenv": "^16.3.1",
    "pdfkit": "^0.17.2",
    "docx": "^9.5.1",
    "exceljs": "^4.4.0",
    "sharp": "^0.33.5",
    "socket.io": "^4.8.3",
    "openai": "^6.8.1",
    "@anthropic-ai/sdk": "^0.9.1",
    "@google/generative-ai": "^0.24.1",
    "cheerio": "^1.0.0-rc.12",
    "puppeteer": "^21.7.0",
    "tesseract.js": "^5.0.4",
    "pg": "^8.17.1"
  },
  "devDependencies": {
    "prisma": "6.19.1",
    "typescript": "^5.9.3",
    "@nestjs/cli": "^10.3.0",
    "@nestjs/testing": "^10.3.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.2",
    "supertest": "^6.3.3",
    "prettier": "^3.2.2",
    "eslint": "^8.56.0"
  }
}
```

---

## Quick Reference for the Developer

| Task | Command / Location |
|------|--------------------|
| Add new DB table | Edit `backend/prisma/schema.prisma`, then `npx prisma migrate dev` |
| Protect a route | `@UseGuards(JwtAuthGuard)` |
| Get authenticated user ID | `req.user.userId` |
| Get user role | `req.user.role` |
| Import Prisma | `import { PrismaService } from '../../../shared/database/prisma.service'` |
| Import JWT guard | `import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard'` |
| API base URL | `http://localhost:3000/api` |
| Swagger UI | `http://localhost:3000/api/docs` |
| Start backend | `cd backend && npm run start:dev` |
| Run migrations | `cd backend && npm run prisma:migrate:dev` |
