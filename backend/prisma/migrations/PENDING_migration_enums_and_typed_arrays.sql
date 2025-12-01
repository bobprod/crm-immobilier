-- ============================================
-- PENDING MIGRATION: Add Enums and Typed Arrays
-- ============================================
-- This migration adds:
-- 1. PostgreSQL enums for status fields
-- 2. Converts Json columns to typed String[] arrays
-- 3. Adds isQualified field to prospecting_matches
--
-- IMPORTANT: This migration may require data cleanup before applying
-- Ensure all existing data conforms to the new enum values.
--
-- Run with: npx prisma migrate dev --name add_enums_and_typed_arrays
-- ============================================

-- Create enums
CREATE TYPE "PropertyStatus" AS ENUM ('available', 'reserved', 'sold', 'rented', 'pending');
CREATE TYPE "PropertyType" AS ENUM ('apartment', 'house', 'villa', 'studio', 'land', 'commercial', 'office', 'appartement', 'maison', 'terrain');
CREATE TYPE "PropertyCategory" AS ENUM ('sale', 'rent');
CREATE TYPE "PropertyPriority" AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'converted', 'rejected');
CREATE TYPE "LeadType" AS ENUM ('requete', 'mandat', 'inconnu');
CREATE TYPE "ValidationStatus" AS ENUM ('pending', 'valid', 'suspicious', 'spam');
CREATE TYPE "MatchStatus" AS ENUM ('pending', 'notified', 'contacted', 'converted', 'ignored');
CREATE TYPE "Intention" AS ENUM ('acheter', 'louer', 'vendre', 'investir', 'inconnu');
CREATE TYPE "Urgency" AS ENUM ('basse', 'moyenne', 'haute', 'inconnu');
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'active', 'paused', 'completed');

-- Update properties table
-- Note: May need to update existing data to match enum values first
-- ALTER TABLE "properties" ALTER COLUMN "category" TYPE "PropertyCategory" USING "category"::"PropertyCategory";
-- ALTER TABLE "properties" ALTER COLUMN "status" TYPE "PropertyStatus" USING "status"::"PropertyStatus";
-- ALTER TABLE "properties" ALTER COLUMN "priority" TYPE "PropertyPriority" USING "priority"::"PropertyPriority";

-- Convert JSON columns to typed arrays for properties
-- Note: This requires data migration
-- ALTER TABLE "properties" ALTER COLUMN "images" TYPE TEXT[] USING ARRAY[]::TEXT[];
-- ALTER TABLE "properties" ALTER COLUMN "features" TYPE TEXT[] USING ARRAY[]::TEXT[];
-- ALTER TABLE "properties" ALTER COLUMN "tags" TYPE TEXT[] USING ARRAY[]::TEXT[];

-- Update prospecting_leads table
-- ALTER TABLE "prospecting_leads" ALTER COLUMN "status" TYPE "LeadStatus" USING "status"::"LeadStatus";
-- ALTER TABLE "prospecting_leads" ALTER COLUMN "leadType" TYPE "LeadType" USING "leadType"::"LeadType";
-- ALTER TABLE "prospecting_leads" ALTER COLUMN "validationStatus" TYPE "ValidationStatus" USING "validationStatus"::"ValidationStatus";
-- ALTER TABLE "prospecting_leads" ALTER COLUMN "intention" TYPE "Intention" USING "intention"::"Intention";
-- ALTER TABLE "prospecting_leads" ALTER COLUMN "urgency" TYPE "Urgency" USING "urgency"::"Urgency";

-- Convert JSON columns to typed arrays for prospecting_leads
-- ALTER TABLE "prospecting_leads" ALTER COLUMN "propertyTypes" TYPE TEXT[] USING ARRAY[]::TEXT[];
-- ALTER TABLE "prospecting_leads" ALTER COLUMN "matchedPropertyIds" TYPE TEXT[] USING ARRAY[]::TEXT[];

-- Update prospecting_matches table
-- ALTER TABLE "prospecting_matches" ALTER COLUMN "status" TYPE "MatchStatus" USING "status"::"MatchStatus";
ALTER TABLE "prospecting_matches" ADD COLUMN IF NOT EXISTS "isQualified" BOOLEAN NOT NULL DEFAULT false;

-- Update prospecting_campaigns table
-- ALTER TABLE "prospecting_campaigns" ALTER COLUMN "status" TYPE "CampaignStatus" USING "status"::"CampaignStatus";
