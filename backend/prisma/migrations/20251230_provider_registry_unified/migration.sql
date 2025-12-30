-- CreateEnum: Provider Types
CREATE TYPE "ProviderType" AS ENUM ('scraping', 'llm', 'storage', 'email', 'payment', 'communication', 'integration');

-- CreateEnum: Provider Category
CREATE TYPE "ProviderCategory" AS ENUM ('internal', 'external_api', 'cloud_service', 'saas');

-- CreateEnum: Provider Status
CREATE TYPE "ProviderStatus" AS ENUM ('active', 'inactive', 'error', 'testing');

-- CreateTable: provider_configs
CREATE TABLE "provider_configs" (
    "id" TEXT NOT NULL,
    "type" "ProviderType" NOT NULL,
    "category" "ProviderCategory" NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "agencyId" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "endpoint" TEXT,
    "config" JSONB,
    "status" "ProviderStatus" NOT NULL DEFAULT 'active',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "monthlyBudget" DOUBLE PRECISION,
    "dailyBudget" DOUBLE PRECISION,
    "rateLimit" INTEGER,
    "maxConcurrent" INTEGER,
    "monthlyUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "successCalls" INTEGER NOT NULL DEFAULT 0,
    "failedCalls" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "avgLatency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "metadata" JSONB,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastHealthCheckAt" TIMESTAMP(3),

    CONSTRAINT "provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: provider_usage_logs
CREATE TABLE "provider_usage_logs" (
    "id" TEXT NOT NULL,
    "providerConfigId" TEXT NOT NULL,
    "userId" TEXT,
    "agencyId" TEXT,
    "operationType" TEXT NOT NULL,
    "operationCode" TEXT,
    "requestData" JSONB,
    "responseData" JSONB,
    "tokensInput" INTEGER,
    "tokensOutput" INTEGER,
    "latencyMs" INTEGER,
    "cost" DOUBLE PRECISION,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: provider_metrics
CREATE TABLE "provider_metrics" (
    "id" TEXT NOT NULL,
    "providerConfigId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "operationType" TEXT,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "successCalls" INTEGER NOT NULL DEFAULT 0,
    "failedCalls" INTEGER NOT NULL DEFAULT 0,
    "avgLatency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minLatency" DOUBLE PRECISION,
    "maxLatency" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_configs_userId_idx" ON "provider_configs"("userId");
CREATE INDEX "provider_configs_agencyId_idx" ON "provider_configs"("agencyId");
CREATE INDEX "provider_configs_type_idx" ON "provider_configs"("type");
CREATE INDEX "provider_configs_provider_idx" ON "provider_configs"("provider");
CREATE INDEX "provider_configs_status_idx" ON "provider_configs"("status");
CREATE INDEX "provider_configs_isActive_idx" ON "provider_configs"("isActive");
CREATE INDEX "provider_configs_userId_type_idx" ON "provider_configs"("userId", "type");
CREATE INDEX "provider_configs_agencyId_type_idx" ON "provider_configs"("agencyId", "type");
CREATE UNIQUE INDEX "provider_configs_userId_type_provider_key" ON "provider_configs"("userId", "type", "provider");
CREATE UNIQUE INDEX "provider_configs_agencyId_type_provider_key" ON "provider_configs"("agencyId", "type", "provider");

-- CreateIndex: provider_usage_logs
CREATE INDEX "provider_usage_logs_providerConfigId_idx" ON "provider_usage_logs"("providerConfigId");
CREATE INDEX "provider_usage_logs_userId_idx" ON "provider_usage_logs"("userId");
CREATE INDEX "provider_usage_logs_agencyId_idx" ON "provider_usage_logs"("agencyId");
CREATE INDEX "provider_usage_logs_operationType_idx" ON "provider_usage_logs"("operationType");
CREATE INDEX "provider_usage_logs_createdAt_idx" ON "provider_usage_logs"("createdAt");
CREATE INDEX "provider_usage_logs_success_idx" ON "provider_usage_logs"("success");

-- CreateIndex: provider_metrics
CREATE INDEX "provider_metrics_providerConfigId_idx" ON "provider_metrics"("providerConfigId");
CREATE INDEX "provider_metrics_date_idx" ON "provider_metrics"("date");
CREATE INDEX "provider_metrics_operationType_idx" ON "provider_metrics"("operationType");
CREATE UNIQUE INDEX "provider_metrics_providerConfigId_date_operationType_key" ON "provider_metrics"("providerConfigId", "date", "operationType");

-- AddForeignKey
ALTER TABLE "provider_configs" ADD CONSTRAINT "provider_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_configs" ADD CONSTRAINT "provider_configs_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: provider_usage_logs
ALTER TABLE "provider_usage_logs" ADD CONSTRAINT "provider_usage_logs_providerConfigId_fkey" FOREIGN KEY ("providerConfigId") REFERENCES "provider_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: provider_metrics
ALTER TABLE "provider_metrics" ADD CONSTRAINT "provider_metrics_providerConfigId_fkey" FOREIGN KEY ("providerConfigId") REFERENCES "provider_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
