-- AlterTable: Add soft delete field to properties
ALTER TABLE "properties" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex: Add index on deletedAt for better query performance
CREATE INDEX "properties_deletedAt_idx" ON "properties"("deletedAt");

-- CreateTable: PropertyHistory for tracking all changes
CREATE TABLE "property_history" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Indexes for PropertyHistory
CREATE INDEX "property_history_propertyId_idx" ON "property_history"("propertyId");
CREATE INDEX "property_history_userId_idx" ON "property_history"("userId");
CREATE INDEX "property_history_action_idx" ON "property_history"("action");
CREATE INDEX "property_history_createdAt_idx" ON "property_history"("createdAt");

-- AddForeignKey: Link PropertyHistory to properties
ALTER TABLE "property_history" ADD CONSTRAINT "property_history_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
