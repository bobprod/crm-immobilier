-- Rename claudeApiKey to anthropicApiKey to match code expectations
ALTER TABLE "ai_settings" RENAME COLUMN "claudeApiKey" TO "anthropicApiKey";
