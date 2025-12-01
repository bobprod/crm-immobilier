-- Migration: Add indexes for matching performance
-- Date: 2024-12-01
-- Description: Add indexes on properties table for faster matching queries

-- Index for price filtering in matching algorithm
CREATE INDEX IF NOT EXISTS "properties_price_idx" ON "properties"("price");

-- Index for city filtering in location matching
CREATE INDEX IF NOT EXISTS "properties_city_idx" ON "properties"("city");

-- Index for property type matching
CREATE INDEX IF NOT EXISTS "properties_type_idx" ON "properties"("type");

-- Index for status filtering (available properties only)
CREATE INDEX IF NOT EXISTS "properties_status_idx" ON "properties"("status");

-- Composite index for typical matching query pattern
-- Used when filtering by userId, status, and price range
CREATE INDEX IF NOT EXISTS "properties_user_status_price_idx" ON "properties"("userId", "status", "price");
