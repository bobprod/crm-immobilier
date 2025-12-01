-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "fees" DOUBLE PRECISION,
ADD COLUMN     "feesPercentage" DOUBLE PRECISION,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastContactAt" TIMESTAMP(3),
ADD COLUMN     "netPrice" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "tags" JSONB;

-- AlterTable
ALTER TABLE "prospecting_leads" ADD COLUMN     "budgetCurrency" TEXT DEFAULT 'TND',
ADD COLUMN     "budgetMax" DOUBLE PRECISION,
ADD COLUMN     "budgetMin" DOUBLE PRECISION,
ADD COLUMN     "country" TEXT DEFAULT 'Tunisie',
ADD COLUMN     "intention" TEXT,
ADD COLUMN     "leadType" TEXT DEFAULT 'inconnu',
ADD COLUMN     "propertyTypes" JSONB,
ADD COLUMN     "rawText" TEXT,
ADD COLUMN     "rooms" INTEGER,
ADD COLUMN     "seriousnessScore" INTEGER,
ADD COLUMN     "surfaceM2" INTEGER,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "urgency" TEXT,
ADD COLUMN     "validationStatus" TEXT DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "properties_priority_idx" ON "properties"("priority");

-- CreateIndex
CREATE INDEX "properties_isFeatured_idx" ON "properties"("isFeatured");

-- CreateIndex
CREATE INDEX "properties_assignedTo_idx" ON "properties"("assignedTo");

-- CreateIndex
CREATE INDEX "properties_ownerId_idx" ON "properties"("ownerId");

-- CreateIndex
CREATE INDEX "prospecting_leads_leadType_idx" ON "prospecting_leads"("leadType");

-- CreateIndex
CREATE INDEX "prospecting_leads_validationStatus_idx" ON "prospecting_leads"("validationStatus");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
