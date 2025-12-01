-- ============================================
-- MIGRATION: Add PostgreSQL Enums & Convert String Columns
-- ============================================
-- This migration creates enum types and converts string columns to enums
-- Some conversions are commented out and require manual data cleanup first

-- ============================================
-- 1. CREATE ENUMS
-- ============================================

-- Property Status Enum
CREATE TYPE "PropertyStatus" AS ENUM ('available', 'reserved', 'sold', 'rented', 'pending');

-- Lead Status Enum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'converted', 'rejected', 'spam');

-- Match Status Enum
CREATE TYPE "MatchStatus" AS ENUM ('pending', 'approved', 'rejected', 'contacted', 'converted');

-- Appointment Status Enum
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Appointment Type Enum
CREATE TYPE "AppointmentType" AS ENUM ('visit', 'phone_call', 'video_call', 'meeting', 'follow_up');

-- Campaign Status Enum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');

-- Communication Status Enum
CREATE TYPE "CommunicationStatus" AS ENUM ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');

-- Prospect Status Enum
CREATE TYPE "ProspectStatus" AS ENUM ('active', 'inactive', 'converted', 'lost');

-- Task Status Enum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');

-- Priority Enum
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- Validation Status Enum
CREATE TYPE "ValidationStatus" AS ENUM ('pending', 'valid', 'suspicious', 'spam');

-- Lead Type Enum
CREATE TYPE "LeadType" AS ENUM ('mandat', 'requete', 'inconnu');

-- Intention Enum
CREATE TYPE "Intention" AS ENUM ('acheter', 'louer', 'vendre', 'investir', 'inconnu');

-- Urgency Enum
CREATE TYPE "Urgency" AS ENUM ('basse', 'moyenne', 'haute', 'inconnu');

-- ============================================
-- 2. ADD NEW COLUMNS (Safe Operations)
-- ============================================

-- Add isQualified column to prospecting_matches
ALTER TABLE "prospecting_matches" ADD COLUMN IF NOT EXISTS "isQualified" BOOLEAN DEFAULT false;

-- ============================================
-- 3. COLUMN TYPE CONVERSIONS (Requires Data Cleanup)
-- ============================================
-- ⚠️ IMPORTANT: These conversions are COMMENTED OUT
-- Before running them, you MUST clean the data first
-- Uncomment and run ONLY after verifying data integrity

-- --------------------------------------------
-- Properties Status Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "properties" SET "status" = 'available' 
-- WHERE "status" NOT IN ('available', 'reserved', 'sold', 'rented', 'pending');

-- Step 2: Convert column type
-- ALTER TABLE "properties" 
-- ALTER COLUMN "status" TYPE "PropertyStatus" 
-- USING "status"::"PropertyStatus";

-- --------------------------------------------
-- Prospecting Leads Status Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "prospecting_leads" SET "status" = 'new' 
-- WHERE "status" NOT IN ('new', 'contacted', 'qualified', 'converted', 'rejected', 'spam');

-- Step 2: Convert column type
-- ALTER TABLE "prospecting_leads" 
-- ALTER COLUMN "status" TYPE "LeadStatus" 
-- USING "status"::"LeadStatus";

-- --------------------------------------------
-- Prospecting Leads validationStatus Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "prospecting_leads" SET "validationStatus" = 'pending' 
-- WHERE "validationStatus" NOT IN ('pending', 'valid', 'suspicious', 'spam');

-- Step 2: Convert column type
-- ALTER TABLE "prospecting_leads" 
-- ALTER COLUMN "validationStatus" TYPE "ValidationStatus" 
-- USING "validationStatus"::"ValidationStatus";

-- --------------------------------------------
-- Prospecting Leads leadType Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "prospecting_leads" SET "leadType" = 'inconnu' 
-- WHERE "leadType" NOT IN ('mandat', 'requete', 'inconnu');

-- Step 2: Convert column type
-- ALTER TABLE "prospecting_leads" 
-- ALTER COLUMN "leadType" TYPE "LeadType" 
-- USING "leadType"::"LeadType";

-- --------------------------------------------
-- Prospecting Leads intention Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "prospecting_leads" SET "intention" = 'inconnu' 
-- WHERE "intention" NOT IN ('acheter', 'louer', 'vendre', 'investir', 'inconnu');

-- Step 2: Convert column type
-- ALTER TABLE "prospecting_leads" 
-- ALTER COLUMN "intention" TYPE "Intention" 
-- USING "intention"::"Intention";

-- --------------------------------------------
-- Prospecting Leads urgency Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "prospecting_leads" SET "urgency" = 'inconnu' 
-- WHERE "urgency" NOT IN ('basse', 'moyenne', 'haute', 'inconnu');

-- Step 2: Convert column type
-- ALTER TABLE "prospecting_leads" 
-- ALTER COLUMN "urgency" TYPE "Urgency" 
-- USING "urgency"::"Urgency";

-- --------------------------------------------
-- Prospecting Matches Status Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "prospecting_matches" SET "status" = 'pending' 
-- WHERE "status" NOT IN ('pending', 'approved', 'rejected', 'contacted', 'converted');

-- Step 2: Convert column type
-- ALTER TABLE "prospecting_matches" 
-- ALTER COLUMN "status" TYPE "MatchStatus" 
-- USING "status"::"MatchStatus";

-- --------------------------------------------
-- Matches Status Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "matches" SET "status" = 'pending' 
-- WHERE "status" NOT IN ('pending', 'approved', 'rejected', 'contacted', 'converted');

-- Step 2: Convert column type
-- ALTER TABLE "matches" 
-- ALTER COLUMN "status" TYPE "MatchStatus" 
-- USING "status"::"MatchStatus";

-- --------------------------------------------
-- Appointments Status Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "appointments" SET "status" = 'scheduled' 
-- WHERE "status" NOT IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Step 2: Convert column type
-- ALTER TABLE "appointments" 
-- ALTER COLUMN "status" TYPE "AppointmentStatus" 
-- USING "status"::"AppointmentStatus";

-- --------------------------------------------
-- Appointments Type Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "appointments" SET "type" = 'visit' 
-- WHERE "type" NOT IN ('visit', 'phone_call', 'video_call', 'meeting', 'follow_up');

-- Step 2: Convert column type
-- ALTER TABLE "appointments" 
-- ALTER COLUMN "type" TYPE "AppointmentType" 
-- USING "type"::"AppointmentType";

-- --------------------------------------------
-- Campaigns Status Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "campaigns" SET "status" = 'draft' 
-- WHERE "status" NOT IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');

-- Step 2: Convert column type
-- ALTER TABLE "campaigns" 
-- ALTER COLUMN "status" TYPE "CampaignStatus" 
-- USING "status"::"CampaignStatus";

-- --------------------------------------------
-- Communications Status Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "communications" SET "status" = 'sent' 
-- WHERE "status" NOT IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');

-- Step 2: Convert column type
-- ALTER TABLE "communications" 
-- ALTER COLUMN "status" TYPE "CommunicationStatus" 
-- USING "status"::"CommunicationStatus";

-- --------------------------------------------
-- Prospects Status Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "prospects" SET "status" = 'active' 
-- WHERE "status" NOT IN ('active', 'inactive', 'converted', 'lost');

-- Step 2: Convert column type
-- ALTER TABLE "prospects" 
-- ALTER COLUMN "status" TYPE "ProspectStatus" 
-- USING "status"::"ProspectStatus";

-- --------------------------------------------
-- Tasks Status Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "tasks" SET "status" = 'todo' 
-- WHERE "status" NOT IN ('todo', 'in_progress', 'completed', 'cancelled');

-- Step 2: Convert column type
-- ALTER TABLE "tasks" 
-- ALTER COLUMN "status" TYPE "TaskStatus" 
-- USING "status"::"TaskStatus";

-- --------------------------------------------
-- Tasks Priority Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "tasks" SET "priority" = 'medium' 
-- WHERE "priority" NOT IN ('low', 'medium', 'high', 'urgent');

-- Step 2: Convert column type
-- ALTER TABLE "tasks" 
-- ALTER COLUMN "priority" TYPE "Priority" 
-- USING "priority"::"Priority";

-- --------------------------------------------
-- Properties Priority Conversion
-- --------------------------------------------
-- Step 1: Clean data first
-- UPDATE "properties" SET "priority" = 'medium' 
-- WHERE "priority" NOT IN ('low', 'medium', 'high', 'urgent');

-- Step 2: Convert column type
-- ALTER TABLE "properties" 
-- ALTER COLUMN "priority" TYPE "Priority" 
-- USING "priority"::"Priority";

-- ============================================
-- 4. POST-MIGRATION NOTES
-- ============================================
-- ✅ Enums created successfully
-- ✅ isQualified column added to prospecting_matches
-- ⚠️ Column conversions are COMMENTED OUT
-- 
-- TO COMPLETE THE MIGRATION:
-- 1. Review your data in each table
-- 2. Uncomment and run data cleanup statements one by one
-- 3. Uncomment and run ALTER TABLE statements one by one
-- 4. Update your Prisma schema to use enum types instead of String
-- 5. Run `npx prisma generate` to update Prisma Client