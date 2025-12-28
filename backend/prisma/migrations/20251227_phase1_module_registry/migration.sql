-- ══════════════════════════════════════════════════════════════
-- PHASE 1: MODULE REGISTRY - SAAS CORE OS
-- ══════════════════════════════════════════════════════════════
-- Date: 2025-12-27
-- Objectif: Créer le système de "Plug & Play" pour modules métier
-- Architecture: Core OS agnostique + Modules Business enchufables
-- ══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. CRÉATION DES ENUMS
-- ──────────────────────────────────────────────────────────────
CREATE TYPE "ModuleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DEPRECATED');

CREATE TYPE "ModuleCategory" AS ENUM (
  'BUSINESS',      -- Modules métier (Immo, Voyage, Casting, RH)
  'INTELLIGENCE',  -- Modules IA (Matching, Scoring, RAG)
  'INTEGRATION',   -- Intégrations externes (WordPress, Stripe, n8n)
  'COMMUNICATION', -- Email, SMS, Notifications
  'MARKETING'      -- SEO, Ads, Analytics
);

-- ──────────────────────────────────────────────────────────────
-- 2. TABLE business_modules (Registre des modules métier)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE "business_modules" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "version" TEXT NOT NULL DEFAULT '1.0.0',
  "status" "ModuleStatus" NOT NULL DEFAULT 'ACTIVE',
  "category" "ModuleCategory" NOT NULL DEFAULT 'BUSINESS',

  -- Manifest JSON (déclaration des besoins du module)
  "manifest" JSONB NOT NULL,

  -- Pricing
  "basePrice" DOUBLE PRECISION,
  "creditsIncluded" INTEGER,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "business_modules_pkey" PRIMARY KEY ("id")
);

-- Index
CREATE UNIQUE INDEX "business_modules_code_key" ON "business_modules"("code");
CREATE INDEX "business_modules_code_idx" ON "business_modules"("code");
CREATE INDEX "business_modules_status_idx" ON "business_modules"("status");

-- ──────────────────────────────────────────────────────────────
-- 3. TABLE module_agency_subscriptions (Souscriptions agences)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE "module_agency_subscriptions" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,

  -- Activation
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),

  -- Configuration spécifique agence (override manifest)
  "config" JSONB,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "module_agency_subscriptions_pkey" PRIMARY KEY ("id")
);

-- Index et contraintes
CREATE UNIQUE INDEX "module_agency_subscriptions_agencyId_moduleId_key"
  ON "module_agency_subscriptions"("agencyId", "moduleId");
CREATE INDEX "module_agency_subscriptions_agencyId_idx"
  ON "module_agency_subscriptions"("agencyId");
CREATE INDEX "module_agency_subscriptions_moduleId_idx"
  ON "module_agency_subscriptions"("moduleId");

-- Foreign keys
ALTER TABLE "module_agency_subscriptions"
  ADD CONSTRAINT "module_agency_subscriptions_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "agencies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "module_agency_subscriptions"
  ADD CONSTRAINT "module_agency_subscriptions_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "business_modules"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ──────────────────────────────────────────────────────────────
-- 4. TABLE dynamic_menu_items (Menus dynamiques)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE "dynamic_menu_items" (
  "id" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,

  -- Menu structure
  "label" TEXT NOT NULL,
  "icon" TEXT,
  "path" TEXT NOT NULL,
  "parentId" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,

  -- Permissions
  "requiredRole" "UserRole",

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dynamic_menu_items_pkey" PRIMARY KEY ("id")
);

-- Index et contraintes
CREATE UNIQUE INDEX "dynamic_menu_items_moduleId_path_key"
  ON "dynamic_menu_items"("moduleId", "path");
CREATE INDEX "dynamic_menu_items_moduleId_idx"
  ON "dynamic_menu_items"("moduleId");

-- Foreign key
ALTER TABLE "dynamic_menu_items"
  ADD CONSTRAINT "dynamic_menu_items_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "business_modules"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ──────────────────────────────────────────────────────────────
-- 5. TABLE module_ai_actions (Actions IA par module)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE "module_ai_actions" (
  "id" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,

  "actionCode" TEXT NOT NULL,
  "actionName" TEXT NOT NULL,
  "description" TEXT,

  -- Lien avec le pricing existant
  "pricingId" TEXT,

  -- Configuration IA (prompts & modèles)
  "systemPrompt" TEXT,
  "userPromptTpl" TEXT,
  "provider" TEXT,
  "model" TEXT,

  "enabled" BOOLEAN NOT NULL DEFAULT true,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "module_ai_actions_pkey" PRIMARY KEY ("id")
);

-- Index et contraintes
CREATE UNIQUE INDEX "module_ai_actions_actionCode_key"
  ON "module_ai_actions"("actionCode");
CREATE INDEX "module_ai_actions_moduleId_idx"
  ON "module_ai_actions"("moduleId");
CREATE INDEX "module_ai_actions_actionCode_idx"
  ON "module_ai_actions"("actionCode");

-- Foreign keys
ALTER TABLE "module_ai_actions"
  ADD CONSTRAINT "module_ai_actions_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "business_modules"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "module_ai_actions"
  ADD CONSTRAINT "module_ai_actions_pricingId_fkey"
  FOREIGN KEY ("pricingId") REFERENCES "ai_pricing"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ──────────────────────────────────────────────────────────────
-- 6. TABLE dynamic_schemas (Schémas métier dynamiques)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE "dynamic_schemas" (
  "id" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,

  "tableName" TEXT NOT NULL,
  "schema" JSONB NOT NULL,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dynamic_schemas_pkey" PRIMARY KEY ("id")
);

-- Index et contraintes
CREATE UNIQUE INDEX "dynamic_schemas_moduleId_tableName_key"
  ON "dynamic_schemas"("moduleId", "tableName");
CREATE INDEX "dynamic_schemas_moduleId_idx"
  ON "dynamic_schemas"("moduleId");

-- Foreign key
ALTER TABLE "dynamic_schemas"
  ADD CONSTRAINT "dynamic_schemas_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "business_modules"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- FIN MIGRATION PHASE 1
-- ══════════════════════════════════════════════════════════════
-- Vérifications suggérées après migration:
-- 1. SELECT * FROM business_modules;
-- 2. SELECT * FROM module_agency_subscriptions;
-- 3. SELECT * FROM dynamic_menu_items;
-- 4. SELECT * FROM module_ai_actions;
-- 5. \d+ business_modules (pour voir la structure)
-- ══════════════════════════════════════════════════════════════
