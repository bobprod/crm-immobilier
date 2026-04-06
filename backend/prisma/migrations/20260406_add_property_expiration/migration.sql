-- AlterTable
ALTER TABLE "properties" ADD COLUMN "expirationDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "properties_expirationDate_status_idx" ON "properties"("expirationDate", "status");
