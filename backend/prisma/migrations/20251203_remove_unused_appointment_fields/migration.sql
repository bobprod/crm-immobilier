-- Migration: Remove unused fields from appointments table
-- These fields were mistakenly copied from prospects/campaigns schema
-- and are not used anywhere in the appointments module

-- Drop unused columns from appointments table
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "prospectType";
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "subType";
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "searchCriteria";
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "mandatInfo";
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "profiling";
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "timeline";
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "budget";
