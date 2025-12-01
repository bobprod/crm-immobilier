-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('available', 'reserved', 'sold', 'rented', 'pending');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('apartment', 'house', 'villa', 'studio', 'land', 'commercial', 'office', 'appartement', 'maison', 'terrain');

-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('sale', 'rent');

-- CreateEnum
CREATE TYPE "PropertyPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'converted', 'rejected');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('requete', 'mandat', 'inconnu');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('pending', 'valid', 'suspicious', 'spam');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('pending', 'notified', 'contacted', 'converted', 'ignored');

-- CreateEnum
CREATE TYPE "Intention" AS ENUM ('acheter', 'louer', 'vendre', 'investir', 'inconnu');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('basse', 'moyenne', 'haute', 'inconnu');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'active', 'paused', 'completed');

-- Add isQualified to prospecting_matches
ALTER TABLE "prospecting_matches" ADD COLUMN IF NOT EXISTS "isQualified" BOOLEAN NOT NULL DEFAULT false;

-- Note: The following changes require data migration before applying
-- Uncomment and run after ensuring data conforms to enum values

-- AlterTable properties - convert status to enum
-- First, update any non-conforming values
-- UPDATE "properties" SET "status" = 'available' WHERE "status" NOT IN ('available', 'reserved', 'sold', 'rented', 'pending');
-- UPDATE "properties" SET "category" = 'sale' WHERE "category" NOT IN ('sale', 'rent');
-- UPDATE "properties" SET "priority" = 'medium' WHERE "priority" IS NULL OR "priority" NOT IN ('low', 'medium', 'high', 'urgent');

-- Then convert columns (commented - run manually after data cleanup)
-- ALTER TABLE "properties" ALTER COLUMN "status" TYPE "PropertyStatus" USING "status"::"PropertyStatus";
-- ALTER TABLE "properties" ALTER COLUMN "category" TYPE "PropertyCategory" USING "category"::"PropertyCategory";
-- ALTER TABLE "properties" ALTER COLUMN "priority" TYPE "PropertyPriority" USING "priority"::"PropertyPriority";

-- AlterTable prospecting_leads - convert status to enum
-- UPDATE "prospecting_leads" SET "status" = 'new' WHERE "status" NOT IN ('new', 'contacted', 'qualified', 'converted', 'rejected');
-- UPDATE "prospecting_leads" SET "leadType" = 'inconnu' WHERE "leadType" IS NULL OR "leadType" NOT IN ('requete', 'mandat', 'inconnu');
-- UPDATE "prospecting_leads" SET "validationStatus" = 'pending' WHERE "validationStatus" IS NULL OR "validationStatus" NOT IN ('pending', 'valid', 'suspicious', 'spam');

-- ALTER TABLE "prospecting_leads" ALTER COLUMN "status" TYPE "LeadStatus" USING "status"::"LeadStatus";
-- ALTER TABLE "prospecting_leads" ALTER COLUMN "leadType" TYPE "LeadType" USING "leadType"::"LeadType";
-- ALTER TABLE "prospecting_leads" ALTER COLUMN "validationStatus" TYPE "ValidationStatus" USING "validationStatus"::"ValidationStatus";

-- AlterTable prospecting_matches - convert status to enum
-- UPDATE "prospecting_matches" SET "status" = 'pending' WHERE "status" NOT IN ('pending', 'notified', 'contacted', 'converted', 'ignored');
-- ALTER TABLE "prospecting_matches" ALTER COLUMN "status" TYPE "MatchStatus" USING "status"::"MatchStatus";

-- AlterTable prospecting_campaigns - convert status to enum
-- UPDATE "prospecting_campaigns" SET "status" = 'draft' WHERE "status" NOT IN ('draft', 'active', 'paused', 'completed');
-- ALTER TABLE "prospecting_campaigns" ALTER COLUMN "status" TYPE "CampaignStatus" USING "status"::"CampaignStatus";

-- Convert Json columns to String[] arrays (requires PostgreSQL array support)
-- Note: This requires data migration - existing JSON data must be converted
-- These are commented out - run manually after data preparation

-- For properties.images, features, tags:
-- ALTER TABLE "properties" ALTER COLUMN "images" TYPE TEXT[] USING COALESCE(ARRAY(SELECT jsonb_array_elements_text("images"::jsonb)), ARRAY[]::TEXT[]);
-- ALTER TABLE "properties" ALTER COLUMN "features" TYPE TEXT[] USING COALESCE(ARRAY(SELECT jsonb_array_elements_text("features"::jsonb)), ARRAY[]::TEXT[]);
-- ALTER TABLE "properties" ALTER COLUMN "tags" TYPE TEXT[] USING COALESCE(ARRAY(SELECT jsonb_array_elements_text("tags"::jsonb)), ARRAY[]::TEXT[]);

-- For prospecting_leads.propertyTypes, matchedPropertyIds:
-- ALTER TABLE "prospecting_leads" ALTER COLUMN "propertyTypes" TYPE TEXT[] USING COALESCE(ARRAY(SELECT jsonb_array_elements_text("propertyTypes"::jsonb)), ARRAY[]::TEXT[]);
-- ALTER TABLE "prospecting_leads" ALTER COLUMN "matchedPropertyIds" TYPE TEXT[] USING COALESCE(ARRAY(SELECT jsonb_array_elements_text("matchedPropertyIds"::jsonb)), ARRAY[]::TEXT[]);
