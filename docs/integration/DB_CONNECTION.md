# Database Connection — CRM Immo Saas

---

## Overview

| Property | Value |
|----------|-------|
| Database | PostgreSQL |
| ORM | Prisma v6.19.1 |
| Adapter | `@prisma/adapter-neon` (Neon serverless PostgreSQL) |
| Connection string | `DATABASE_URL` env var |
| Connection pool | Managed by Prisma / Neon driver |

---

## Prisma Client Setup

**File:** `backend/src/shared/database/prisma.service.ts`

This is the **global singleton** — import and inject this service in any NestJS module that needs database access:

```typescript
// backend/src/shared/database/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

---

## Database Configuration

**File:** `backend/src/config/database.config.ts`

```typescript
// Key settings:
// - Provider: postgresql
// - URL: process.env.DATABASE_URL
// - Synchronize: true  (development only — Prisma handles this via migrations)
// - Logging: true      (development only)
```

The Neon adapter is used for serverless/edge compatibility:
```typescript
import { neon } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
```

---

## Migration System

Prisma Migrate manages schema changes. All migrations are stored in:
```
backend/prisma/migrations/
```

### Common Migration Commands

```bash
# Development — create and apply new migration
cd backend
npm run prisma:migrate:dev
# or: npx prisma migrate dev --name describe_your_change

# Production — apply pending migrations only (no prompts)
npm run prisma:migrate
# or: npx prisma migrate deploy

# Check migration status
npm run prisma:migrate:status

# Push schema without migration (use for prototyping only)
npm run prisma:push

# Open Prisma Studio (visual DB browser)
npm run prisma:studio

# Regenerate Prisma client after schema change
npm run prisma:generate
```

### Adding a New Table (Invoice Module Workflow)

1. Edit `backend/prisma/schema.prisma` — add your new model(s)
2. Run: `npx prisma migrate dev --name add_invoice_module`
3. Run: `npx prisma generate` (updates the TypeScript client)
4. The new table is now queryable via `prisma.yourModel.*`

---

## Using PrismaService in Your Module

```typescript
// 1. Import PrismaModule in your module
import { PrismaService } from '../../../shared/database/prisma.service';

@Module({
  providers: [InvoicesService, PrismaService],
  controllers: [InvoicesController],
})
export class InvoicesModule {}

// 2. Inject in your service
@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
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

---

## Connection String Format

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

**Example (local dev):**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crm_immobilier?schema=public"
```

**Example (Neon cloud):**
```
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/crm_immobilier?sslmode=require"
```
