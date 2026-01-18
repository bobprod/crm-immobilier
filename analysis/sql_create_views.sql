-- Example non-destructive CREATE VIEW statements
-- Generated: 2026-01-17
-- These views simply expose the underlying tables for read-only access
-- Adjust names as needed to match Prisma model names or legacy table names

CREATE OR REPLACE VIEW view_provider_configs AS
SELECT * FROM provider_configs;

CREATE OR REPLACE VIEW view_whatsapp_configs AS
SELECT * FROM whatsapp_configs;

CREATE OR REPLACE VIEW view_agency_api_keys AS
SELECT * FROM agency_api_keys;

-- Example: if Prisma expects a table name like "ProviderConfigs" but DB has snake_case,
-- you could create a view named the PascalCase table and select from the real table.
-- CREATE OR REPLACE VIEW "ProviderConfigs" AS SELECT * FROM provider_configs;

-- Note: these views are non-destructive. Test queries against them before applying any
-- schema migrations or renames.
