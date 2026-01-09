-- Fix for failed migration: 20241201000000_add_enums_and_typed_arrays
-- This migration will safely resolve the shadow database issue

-- Remove the failed migration from the _prisma_migrations table
DELETE FROM "_prisma_migrations"
WHERE migration = '20241201000000_add_enums_and_typed_arrays';

-- Verify the delete
SELECT * FROM "_prisma_migrations" ORDER BY started_at DESC LIMIT 10;
