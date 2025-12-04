-- Migration: Remove deprecated prospecting fields from properties and tasks tables
-- Date: 2024-12-04
-- These fields were copied from prospecting domain and are no longer used

-- ============================================
-- PROPERTIES TABLE
-- ============================================
-- Remove deprecated prospecting fields from properties
ALTER TABLE "properties" DROP COLUMN IF EXISTS "prospectType";
ALTER TABLE "properties" DROP COLUMN IF EXISTS "subType";
ALTER TABLE "properties" DROP COLUMN IF EXISTS "searchCriteria";
ALTER TABLE "properties" DROP COLUMN IF EXISTS "mandatInfo";
ALTER TABLE "properties" DROP COLUMN IF EXISTS "profiling";
ALTER TABLE "properties" DROP COLUMN IF EXISTS "timeline";
ALTER TABLE "properties" DROP COLUMN IF EXISTS "budget";

-- ============================================
-- TASKS TABLE
-- ============================================
-- Remove deprecated prospecting fields from tasks
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "prospectType";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "subType";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "searchCriteria";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "mandatInfo";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "profiling";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "timeline";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "budget";
