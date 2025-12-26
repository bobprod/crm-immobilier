-- AlterTable
ALTER TABLE "prospects" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "prospect_history" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prospects_deletedAt_idx" ON "prospects"("deletedAt");

-- CreateIndex
CREATE INDEX "prospect_history_prospectId_idx" ON "prospect_history"("prospectId");

-- CreateIndex
CREATE INDEX "prospect_history_userId_idx" ON "prospect_history"("userId");

-- CreateIndex
CREATE INDEX "prospect_history_action_idx" ON "prospect_history"("action");

-- CreateIndex
CREATE INDEX "prospect_history_createdAt_idx" ON "prospect_history"("createdAt");

-- AddForeignKey
ALTER TABLE "prospect_history" ADD CONSTRAINT "prospect_history_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_history" ADD CONSTRAINT "prospect_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
