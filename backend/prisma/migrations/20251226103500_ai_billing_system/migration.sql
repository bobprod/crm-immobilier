-- CreateTable
CREATE TABLE "agency_api_keys" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "anthropicApiKey" TEXT,
    "openaiApiKey" TEXT,
    "geminiApiKey" TEXT,
    "deepseekApiKey" TEXT,
    "openrouterApiKey" TEXT,
    "serpApiKey" TEXT,
    "firecrawlApiKey" TEXT,
    "picaApiKey" TEXT,
    "jinaReaderApiKey" TEXT,
    "scrapingBeeApiKey" TEXT,
    "browserlessApiKey" TEXT,
    "rapidApiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_pricing" (
    "id" TEXT NOT NULL,
    "actionCode" TEXT NOT NULL,
    "actionName" TEXT NOT NULL,
    "description" TEXT,
    "creditsCost" INTEGER NOT NULL,
    "estimatedTokens" INTEGER,
    "providerCostUsd" DOUBLE PRECISION,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "userId" TEXT,
    "actionCode" TEXT NOT NULL,
    "actionName" TEXT,
    "creditsUsed" INTEGER NOT NULL,
    "creditsBalance" INTEGER,
    "provider" TEXT,
    "model" TEXT,
    "tokensUsed" INTEGER,
    "realCostUsd" DOUBLE PRECISION,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_error_log" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "userId" TEXT,
    "actionCode" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "statusCode" INTEGER,
    "endpoint" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_error_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_credits" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "consumed" INTEGER NOT NULL DEFAULT 0,
    "quotaMonthly" INTEGER,
    "quotaDaily" INTEGER,
    "lastResetAt" TIMESTAMP(3),
    "resetFrequency" TEXT DEFAULT 'monthly',
    "alertThreshold" INTEGER DEFAULT 20,
    "alertSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_ai_credits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "consumed" INTEGER NOT NULL DEFAULT 0,
    "quotaMonthly" INTEGER,
    "quotaDaily" INTEGER,
    "lastResetAt" TIMESTAMP(3),
    "resetFrequency" TEXT DEFAULT 'monthly',
    "alertThreshold" INTEGER DEFAULT 20,
    "alertSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ai_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agency_api_keys_agencyId_key" ON "agency_api_keys"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_pricing_actionCode_key" ON "ai_pricing"("actionCode");

-- CreateIndex
CREATE INDEX "ai_usage_agencyId_createdAt_idx" ON "ai_usage"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_userId_createdAt_idx" ON "ai_usage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_actionCode_idx" ON "ai_usage"("actionCode");

-- CreateIndex
CREATE UNIQUE INDEX "ai_credits_agencyId_key" ON "ai_credits"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "user_ai_credits_userId_key" ON "user_ai_credits"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "global_settings_key_key" ON "global_settings"("key");

-- AddForeignKey
ALTER TABLE "agency_api_keys" ADD CONSTRAINT "agency_api_keys_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_error_log" ADD CONSTRAINT "ai_error_log_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_error_log" ADD CONSTRAINT "ai_error_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_credits" ADD CONSTRAINT "ai_credits_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ai_credits" ADD CONSTRAINT "user_ai_credits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
