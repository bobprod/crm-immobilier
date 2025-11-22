-- CreateTable for Notifications
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable for SyncLog
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "externalId" TEXT,
    "errorMessage" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable for Activity (for cache service)
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- Add WordPress fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wordpressUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wordpressUsername" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wordpressPassword" TEXT;

-- Add WordPress fields to properties table
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "wordpressId" TEXT;

-- Create indexes for better performance
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

CREATE INDEX "sync_logs_entityType_entityId_idx" ON "sync_logs"("entityType", "entityId");
CREATE INDEX "sync_logs_platform_idx" ON "sync_logs"("platform");
CREATE INDEX "sync_logs_status_idx" ON "sync_logs"("status");
CREATE INDEX "sync_logs_syncedAt_idx" ON "sync_logs"("syncedAt");

CREATE INDEX "activities_userId_idx" ON "activities"("userId");
CREATE INDEX "activities_type_idx" ON "activities"("type");
CREATE INDEX "activities_createdAt_idx" ON "activities"("createdAt");
CREATE INDEX "activities_entityType_entityId_idx" ON "activities"("entityType", "entityId");

-- Add foreign key constraints
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
