-- Migration: Add missing fields identified in TypeScript compilation errors
-- Generated: 2025-11-08
-- Fixes: 43 TypeScript compilation errors

-- ============================================
-- 1. AI_SETTINGS - Add preferredProvider
-- ============================================
ALTER TABLE "ai_settings" 
ADD COLUMN IF NOT EXISTS "preferredProvider" TEXT DEFAULT 'openai';

COMMENT ON COLUMN "ai_settings"."preferredProvider" IS 'Provider préféré pour les services AI';

-- ============================================
-- 2. AI_GENERATIONS - Add type field
-- ============================================
ALTER TABLE "ai_generations" 
ADD COLUMN IF NOT EXISTS "type" TEXT;

COMMENT ON COLUMN "ai_generations"."type" IS 'Type de génération : document_generation, email_validation, etc.';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "ai_generations_type_idx" ON "ai_generations"("type");

-- ============================================
-- 3. OCR_RESULTS - Add text field (alias for extractedText)
-- ============================================
-- Option: Ajouter un champ text qui référence extractedText
-- Ou renommer extractedText en text
ALTER TABLE "ocr_results" 
ADD COLUMN IF NOT EXISTS "text" TEXT;

-- Copier les données existantes si nécessaire
UPDATE "ocr_results" SET "text" = "extractedText" WHERE "text" IS NULL;

COMMENT ON COLUMN "ocr_results"."text" IS 'Texte extrait (alias de extractedText pour compatibilité)';

-- ============================================
-- 4. PROPERTIES - Add reference and viewsCount
-- ============================================
ALTER TABLE "properties" 
ADD COLUMN IF NOT EXISTS "reference" TEXT,
ADD COLUMN IF NOT EXISTS "viewsCount" INTEGER DEFAULT 0;

COMMENT ON COLUMN "properties"."reference" IS 'Référence unique du bien immobilier';
COMMENT ON COLUMN "properties"."viewsCount" IS 'Nombre de fois que le bien a été consulté';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "properties_reference_idx" ON "properties"("reference");
CREATE INDEX IF NOT EXISTS "properties_viewsCount_idx" ON "properties"("viewsCount");

-- ============================================
-- 5. PROSPECTS - Add score field
-- ============================================
ALTER TABLE "prospects" 
ADD COLUMN IF NOT EXISTS "score" INTEGER DEFAULT 0;

COMMENT ON COLUMN "prospects"."score" IS 'Score de qualification du prospect (0-100)';

-- Create index for filtering/sorting
CREATE INDEX IF NOT EXISTS "prospects_score_idx" ON "prospects"("score");

-- ============================================
-- 6. CAMPAIGNS - Add description field
-- ============================================
ALTER TABLE "campaigns" 
ADD COLUMN IF NOT EXISTS "description" TEXT;

COMMENT ON COLUMN "campaigns"."description" IS 'Description de la campagne marketing';

-- ============================================
-- 7. USER_INTEGRATIONS - Add data field
-- ============================================
ALTER TABLE "user_integrations" 
ADD COLUMN IF NOT EXISTS "data" JSONB;

COMMENT ON COLUMN "user_integrations"."data" IS 'Données additionnelles de l\'intégration';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Vérifier que toutes les colonnes ont été ajoutées
DO $$ 
BEGIN
    -- Check ai_settings
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_settings' AND column_name = 'preferredProvider'
    ) THEN
        RAISE EXCEPTION 'Column preferredProvider not added to ai_settings';
    END IF;

    -- Check ai_generations
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_generations' AND column_name = 'type'
    ) THEN
        RAISE EXCEPTION 'Column type not added to ai_generations';
    END IF;

    -- Check ocr_results
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ocr_results' AND column_name = 'text'
    ) THEN
        RAISE EXCEPTION 'Column text not added to ocr_results';
    END IF;

    -- Check properties
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'reference'
    ) THEN
        RAISE EXCEPTION 'Column reference not added to properties';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'viewsCount'
    ) THEN
        RAISE EXCEPTION 'Column viewsCount not added to properties';
    END IF;

    -- Check prospects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prospects' AND column_name = 'score'
    ) THEN
        RAISE EXCEPTION 'Column score not added to prospects';
    END IF;

    -- Check campaigns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'description'
    ) THEN
        RAISE EXCEPTION 'Column description not added to campaigns';
    END IF;

    -- Check user_integrations
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_integrations' AND column_name = 'data'
    ) THEN
        RAISE EXCEPTION 'Column data not added to user_integrations';
    END IF;

    RAISE NOTICE 'All columns added successfully!';
END $$;

-- ============================================
-- NOTES
-- ============================================

-- 1. Budget dans prospecting_leads reste JSONB (correct)
--    Le code TypeScript doit être corrigé pour gérer le type Json
--
-- 2. OCR_RESULTS : Le champ 'text' a été ajouté comme alias
--    Considérer de migrer complètement vers 'text' dans une future version
--
-- 3. AI_METRICS_SERVICE : Les méthodes manquantes doivent être ajoutées
--    dans le code TypeScript (pas de changement DB)
--
-- 4. Après cette migration, exécuter :
--    - npx prisma generate
--    - npm run build
