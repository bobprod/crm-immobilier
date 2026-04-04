-- Migration: Add Personnel Module
-- Date: 2026-04-04
-- Description: Add AgentProfile, CommissionConfig, AgentCommissionOverride,
--              AnnualBonusConfig, AgentMonthlyPerformance models and MANAGER role

-- Add MANAGER to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MANAGER';

-- CreateTable: agent_profiles
CREATE TABLE IF NOT EXISTS "agent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "jobTitle" TEXT,
    "phone" TEXT,
    "hireDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: commission_configs
CREATE TABLE IF NOT EXISTS "commission_configs" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "tier1MaxAmount" DOUBLE PRECISION NOT NULL DEFAULT 4000,
    "tier2MinAmount" DOUBLE PRECISION NOT NULL DEFAULT 7000,
    "tier2Rate" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "tier3MinAmount" DOUBLE PRECISION NOT NULL DEFAULT 11000,
    "tier3Rate" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "directSaleRate" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: agent_commission_overrides
CREATE TABLE IF NOT EXISTS "agent_commission_overrides" (
    "id" TEXT NOT NULL,
    "agentProfileId" TEXT NOT NULL,
    "tier1MaxAmount" DOUBLE PRECISION,
    "tier2MinAmount" DOUBLE PRECISION,
    "tier2Rate" DOUBLE PRECISION,
    "tier3MinAmount" DOUBLE PRECISION,
    "tier3Rate" DOUBLE PRECISION,
    "directSaleRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_commission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable: annual_bonus_configs
CREATE TABLE IF NOT EXISTS "annual_bonus_configs" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "tier1MinAmount" DOUBLE PRECISION NOT NULL DEFAULT 180000,
    "tier1Rate" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "tier2MinAmount" DOUBLE PRECISION,
    "tier2Rate" DOUBLE PRECISION,
    "tier3MinAmount" DOUBLE PRECISION,
    "tier3Rate" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annual_bonus_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: agent_monthly_performances
CREATE TABLE IF NOT EXISTS "agent_monthly_performances" (
    "id" TEXT NOT NULL,
    "agentProfileId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "caAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "directSalesCA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "directSalesCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_monthly_performances_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "agent_profiles_userId_key" ON "agent_profiles"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "commission_configs_agencyId_key" ON "commission_configs"("agencyId");
CREATE UNIQUE INDEX IF NOT EXISTS "agent_commission_overrides_agentProfileId_key" ON "agent_commission_overrides"("agentProfileId");
CREATE UNIQUE INDEX IF NOT EXISTS "annual_bonus_configs_agencyId_key" ON "annual_bonus_configs"("agencyId");
CREATE UNIQUE INDEX IF NOT EXISTS "agent_monthly_performances_agentProfileId_year_month_key" ON "agent_monthly_performances"("agentProfileId", "year", "month");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "agent_profiles_agencyId_idx" ON "agent_profiles"("agencyId");
CREATE INDEX IF NOT EXISTS "agent_monthly_performances_agentProfileId_idx" ON "agent_monthly_performances"("agentProfileId");
CREATE INDEX IF NOT EXISTS "agent_monthly_performances_year_month_idx" ON "agent_monthly_performances"("year", "month");

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commission_configs" ADD CONSTRAINT "commission_configs_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_commission_overrides" ADD CONSTRAINT "agent_commission_overrides_agentProfileId_fkey"
    FOREIGN KEY ("agentProfileId") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "annual_bonus_configs" ADD CONSTRAINT "annual_bonus_configs_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_monthly_performances" ADD CONSTRAINT "agent_monthly_performances_agentProfileId_fkey"
    FOREIGN KEY ("agentProfileId") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
