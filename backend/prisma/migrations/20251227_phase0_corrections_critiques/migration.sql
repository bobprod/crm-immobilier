-- ══════════════════════════════════════════════════════════════
-- PHASE 0: CORRECTIONS CRITIQUES - SAAS CORE OS
-- ══════════════════════════════════════════════════════════════
-- Date: 2025-12-27
-- Objectif: Préparer le CRM pour migration vers Core OS modulaire
-- ══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. CRÉATION DE L'ENUM UserRole
-- ──────────────────────────────────────────────────────────────
CREATE TYPE "UserRole" AS ENUM ('USER', 'AGENT', 'ADMIN', 'SUPER_ADMIN');

-- ──────────────────────────────────────────────────────────────
-- 2. AJOUT DES CHAMPS SCRAPING À ai_settings
-- ──────────────────────────────────────────────────────────────
-- Ajout de 7 nouveaux champs pour les providers de scraping
ALTER TABLE "ai_settings" ADD COLUMN "serpApiKey" TEXT;
ALTER TABLE "ai_settings" ADD COLUMN "firecrawlApiKey" TEXT;
ALTER TABLE "ai_settings" ADD COLUMN "picaApiKey" TEXT;
ALTER TABLE "ai_settings" ADD COLUMN "jinaReaderApiKey" TEXT;
ALTER TABLE "ai_settings" ADD COLUMN "scrapingBeeApiKey" TEXT;
ALTER TABLE "ai_settings" ADD COLUMN "browserlessApiKey" TEXT;
ALTER TABLE "ai_settings" ADD COLUMN "rapidApiKey" TEXT;

-- ──────────────────────────────────────────────────────────────
-- 3. MIGRATION DU CHAMP role DANS users
-- ──────────────────────────────────────────────────────────────

-- Étape 1: Mapper les anciennes valeurs vers les nouvelles (temporaire)
-- "agent" → AGENT
-- "admin" → ADMIN
-- "superadmin" → SUPER_ADMIN
-- autres → AGENT (valeur par défaut)

-- Étape 2: Ajouter une nouvelle colonne temporaire avec le bon type
ALTER TABLE "users" ADD COLUMN "role_new" "UserRole" NOT NULL DEFAULT 'AGENT';

-- Étape 3: Migrer les données
UPDATE "users" SET "role_new" = 'AGENT' WHERE "role" = 'agent';
UPDATE "users" SET "role_new" = 'ADMIN' WHERE "role" = 'admin';
UPDATE "users" SET "role_new" = 'SUPER_ADMIN' WHERE "role" = 'superadmin';
UPDATE "users" SET "role_new" = 'AGENT' WHERE "role" NOT IN ('agent', 'admin', 'superadmin');

-- Étape 4: Supprimer l'ancienne colonne
ALTER TABLE "users" DROP COLUMN "role";

-- Étape 5: Renommer la nouvelle colonne
ALTER TABLE "users" RENAME COLUMN "role_new" TO "role";

-- ══════════════════════════════════════════════════════════════
-- FIN MIGRATION PHASE 0
-- ══════════════════════════════════════════════════════════════
-- Vérifications suggérées après migration:
-- 1. SELECT DISTINCT role FROM users;
-- 2. SELECT * FROM ai_settings LIMIT 1;
-- 3. SELECT column_name, data_type FROM information_schema.columns
--    WHERE table_name = 'users' AND column_name = 'role';
-- ══════════════════════════════════════════════════════════════
