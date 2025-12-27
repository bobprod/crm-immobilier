-- ============================================
-- Smart AI Notifications Migration
-- ============================================
-- Description: Ajoute le système de notifications intelligentes avec
--              routage AI, préférences utilisateur, et analytics par canal

-- ============================================
-- 1. Modifier table notifications
-- ============================================

-- Ajouter colonne channel (canal de livraison)
ALTER TABLE "notifications" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'in_app';

-- Ajouter colonnes de tracking
ALTER TABLE "notifications" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN "openedAt" TIMESTAMP(3);

-- Ajouter index pour performance
CREATE INDEX "notifications_channel_idx" ON "notifications"("channel");

-- ============================================
-- 2. Créer table notification_preferences
-- ============================================

CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channels" JSONB NOT NULL DEFAULT '{"appointment":["in_app","email"],"task":["in_app"],"lead":["in_app","email"],"system":["in_app"],"property":["in_app"],"message":["in_app","push"]}',
    "quietHours" JSONB,
    "maxPerHour" INTEGER NOT NULL DEFAULT 10,
    "aiOptimization" BOOLEAN NOT NULL DEFAULT true,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "digestTime" TEXT,
    "minPriority" TEXT NOT NULL DEFAULT 'low',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- 3. Contraintes et index
-- ============================================

-- Index unique sur userId (relation 1-to-1)
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- Foreign key vers users
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 4. Données initiales (optionnel)
-- ============================================

-- Créer préférences par défaut pour les utilisateurs existants qui ont des notifications
INSERT INTO "notification_preferences" ("id", "userId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    DISTINCT "userId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "notifications"
WHERE "userId" NOT IN (SELECT "userId" FROM "notification_preferences")
ON CONFLICT ("userId") DO NOTHING;

-- ============================================
-- 5. Commentaires pour documentation
-- ============================================

COMMENT ON COLUMN "notifications"."channel" IS 'Canal de livraison: in_app, email, sms, push, whatsapp';
COMMENT ON COLUMN "notifications"."deliveredAt" IS 'Timestamp de livraison effective de la notification';
COMMENT ON COLUMN "notifications"."openedAt" IS 'Timestamp d''ouverture/clic par l''utilisateur';

COMMENT ON TABLE "notification_preferences" IS 'Préférences de notification par utilisateur pour Smart AI routing';
COMMENT ON COLUMN "notification_preferences"."channels" IS 'Configuration des canaux autorisés par type de notification (JSON)';
COMMENT ON COLUMN "notification_preferences"."quietHours" IS 'Plage horaire à éviter (JSON: {start, end, timezone})';
COMMENT ON COLUMN "notification_preferences"."maxPerHour" IS 'Nombre maximum de notifications par heure';
COMMENT ON COLUMN "notification_preferences"."aiOptimization" IS 'Activer l''optimisation AI du canal de livraison';
COMMENT ON COLUMN "notification_preferences"."dailyDigest" IS 'Activer le digest quotidien des notifications';
COMMENT ON COLUMN "notification_preferences"."digestTime" IS 'Heure d''envoi du digest quotidien (format: HH:MM)';
COMMENT ON COLUMN "notification_preferences"."minPriority" IS 'Priorité minimale des notifications à recevoir (low, medium, high)';
