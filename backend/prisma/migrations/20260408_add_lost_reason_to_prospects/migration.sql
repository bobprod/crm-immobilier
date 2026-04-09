-- Migration: Add lostReason field to prospects table
-- Inspired by Odoo CRM "Lost Reason" feature to track why deals are lost

ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "lostReason" TEXT;
