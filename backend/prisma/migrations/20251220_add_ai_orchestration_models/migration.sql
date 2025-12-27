-- CreateTable
CREATE TABLE IF NOT EXISTS "ai_orchestrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "plan" JSONB,
    "results" JSONB,
    "finalResult" JSONB,
    "metrics" JSONB,
    "errors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ai_orchestrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tool_call_logs" (
    "id" TEXT NOT NULL,
    "orchestrationId" TEXT NOT NULL,
    "toolType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "executionTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "tool_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "integration_keys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serpApiKey" TEXT,
    "firecrawlKey" TEXT,
    "picaAiKey" TEXT,
    "googleApiKey" TEXT,
    "customKeys" JSONB,

    CONSTRAINT "integration_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_orchestrations_userId_tenantId_status_objective_crea_idx" ON "ai_orchestrations"("userId", "tenantId", "status", "objective", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tool_call_logs_orchestrationId_toolType_status_createdAt_idx" ON "tool_call_logs"("orchestrationId", "toolType", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "integration_keys_tenantId_key" ON "integration_keys"("tenantId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ai_orchestrations_userId_fkey'
    ) THEN
        ALTER TABLE "ai_orchestrations" ADD CONSTRAINT "ai_orchestrations_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'tool_call_logs_orchestrationId_fkey'
    ) THEN
        ALTER TABLE "tool_call_logs" ADD CONSTRAINT "tool_call_logs_orchestrationId_fkey"
        FOREIGN KEY ("orchestrationId") REFERENCES "ai_orchestrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
