-- =============================================================
-- CRM IMMO SAAS — DATABASE SCHEMA (Invoice Module Integration)
-- Database: PostgreSQL
-- ORM: Prisma 6.19.1
-- Generated from: backend/prisma/schema.prisma
-- =============================================================

-- NOTE: Prisma uses CUID strings for all primary keys (not UUID or serial INT).
-- All IDs are 25-character strings, e.g. "clx2k9q0e0000abc12345wxyz"

-- =============================================================
-- 1. USERS TABLE
-- =============================================================

CREATE TABLE "users" (
    "id"                  TEXT         NOT NULL,   -- CUID, e.g. "clx2k9..."
    "email"               TEXT         NOT NULL,
    "password"            TEXT         NOT NULL,   -- bcrypt hash (salt rounds = 10)
    "firstName"           TEXT,
    "lastName"            TEXT,
    "agencyId"            TEXT,                    -- FK → agencies.id (multi-tenant)
    "role"                TEXT         NOT NULL DEFAULT 'AGENT',  -- ENUM: ADMIN | AGENT | MANAGER
    "wordpressPassword"   TEXT,
    "wordpressUrl"        TEXT,
    "wordpressUsername"   TEXT,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- =============================================================
-- 2. AGENCIES TABLE  (multi-tenant — maps to "companies")
-- =============================================================

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

-- =============================================================
-- 3. INVOICES TABLE  (existing finance model)
-- =============================================================

-- NOTE: The Invoice model already exists in the schema.
-- The invoice module integration should extend this model.

CREATE TABLE "Invoice" (
    "id"          TEXT         NOT NULL,
    "userId"      TEXT         NOT NULL,   -- FK → users.id
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- =============================================================
-- 4. TRANSACTIONS TABLE  (related finance model)
-- =============================================================

CREATE TABLE "Transaction" (
    "id"          TEXT         NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- =============================================================
-- 5. FOREIGN KEY RELATIONSHIPS  (key ones for invoice context)
-- =============================================================

ALTER TABLE "users"
    ADD CONSTRAINT "users_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice"
    ADD CONSTRAINT "Invoice_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================
-- 6. ENUMS
-- =============================================================

-- UserRole (Prisma enum → stored as TEXT in PostgreSQL)
-- Valid values: ADMIN | AGENT | MANAGER
-- Default: AGENT

-- =============================================================
-- NOTES FOR INVOICE MODULE DEVELOPER
-- =============================================================
-- • All IDs: CUID strings (TEXT). Never use serial INT or UUID.
-- • Timestamps: TIMESTAMP(3) with timezone-naive UTC storage.
-- • Multi-tenancy: every resource is scoped to agencyId via users.agencyId.
--   Your invoice rows MUST include either userId or agencyId for tenant isolation.
-- • Soft deletes: some models use a "deletedAt" field instead of hard deletes.
--   Follow the same pattern if adding invoice line items.
-- • The full schema has 112 models — see backend/prisma/schema.prisma for all.
-- • To add new tables: edit schema.prisma, then run:
--       cd backend && npx prisma migrate dev --name add_invoice_module
-- =============================================================
