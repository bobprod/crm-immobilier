-- Add qualificationNotes field to prospecting_leads
ALTER TABLE "prospecting_leads" ADD COLUMN IF NOT EXISTS "qualificationNotes" TEXT;

-- Add unique constraint on prospecting_matches (leadId + propertyId)
ALTER TABLE "prospecting_matches" ADD CONSTRAINT "prospecting_matches_leadId_propertyId_key" UNIQUE ("leadId", "propertyId");

-- Add index on city for faster location queries
CREATE INDEX IF NOT EXISTS "prospecting_leads_city_idx" ON "prospecting_leads"("city");
