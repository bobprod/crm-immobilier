-- CreateTable: user_integrations
-- Migration pour système multi-tenant d'intégrations API

-- Table pour stocker les configurations d'intégrations API par utilisateur
CREATE TABLE IF NOT EXISTS "user_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT,
    "monthlyQuota" INTEGER,
    "currentUsage" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "lastTestError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id")
);

-- Indexes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS "user_integrations_userId_idx" ON "user_integrations"("userId");
CREATE INDEX IF NOT EXISTS "user_integrations_provider_idx" ON "user_integrations"("provider");
CREATE INDEX IF NOT EXISTS "user_integrations_isActive_idx" ON "user_integrations"("isActive");

-- Contrainte unique: un user ne peut avoir qu'une seule config par provider
CREATE UNIQUE INDEX IF NOT EXISTS "user_integrations_userId_provider_key" ON "user_integrations"("userId", "provider");

-- Foreign key vers la table users
ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Commentaires pour documentation
COMMENT ON TABLE "user_integrations" IS 'Stocke les configurations API chiffrées par utilisateur pour Email, SMS, WhatsApp, Push';
COMMENT ON COLUMN "user_integrations"."config" IS 'Configuration chiffrée (AES-256-CBC) contenant les clés API';
COMMENT ON COLUMN "user_integrations"."provider" IS 'Type de provider: resend, sendgrid, twilio, firebase';
COMMENT ON COLUMN "user_integrations"."monthlyQuota" IS 'Quota mensuel configuré par l''utilisateur';
COMMENT ON COLUMN "user_integrations"."currentUsage" IS 'Usage actuel du mois en cours';
COMMENT ON COLUMN "user_integrations"."lastResetAt" IS 'Date du dernier reset mensuel de l''usage';
COMMENT ON COLUMN "user_integrations"."lastTestStatus" IS 'Résultat du dernier test: success ou failed';
