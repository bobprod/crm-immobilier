-- CreateEnum
CREATE TYPE "MandateType" AS ENUM ('simple', 'exclusive', 'semi_exclusive');
CREATE TYPE "MandateCategory" AS ENUM ('sale', 'rental');
CREATE TYPE "MandateStatus" AS ENUM ('active', 'expired', 'cancelled', 'completed');
CREATE TYPE "TransactionType" AS ENUM ('sale', 'rental');
CREATE TYPE "TransactionStatus" AS ENUM ('offer_received', 'offer_accepted', 'promise_signed', 'compromis_signed', 'final_deed_signed', 'cancelled');
CREATE TYPE "CommissionStatus" AS ENUM ('pending', 'partially_paid', 'paid', 'cancelled');
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled');
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'check', 'bank_transfer', 'credit_card', 'other');
CREATE TYPE "ClientType" AS ENUM ('buyer', 'seller', 'tenant', 'landlord');

-- CreateTable: owners
CREATE TABLE "owners" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "country" TEXT DEFAULT 'Tunisie',
    "taxId" TEXT,
    "idCard" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable: mandates
CREATE TABLE "mandates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "propertyId" TEXT,
    "reference" TEXT NOT NULL,
    "type" "MandateType" NOT NULL,
    "category" "MandateCategory" NOT NULL,
    "status" "MandateStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "commission" DOUBLE PRECISION NOT NULL,
    "commissionType" TEXT NOT NULL DEFAULT 'percentage',
    "exclusivityBonus" DOUBLE PRECISION,
    "terms" TEXT,
    "notes" TEXT,
    "documentUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: transactions
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "prospectId" TEXT,
    "mandateId" TEXT,
    "reference" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'offer_received',
    "offerPrice" DOUBLE PRECISION,
    "negotiatedPrice" DOUBLE PRECISION,
    "finalPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "depositAmount" DOUBLE PRECISION,
    "depositPaidAt" TIMESTAMP(3),
    "offerDate" TIMESTAMP(3),
    "promiseDate" TIMESTAMP(3),
    "compromisDate" TIMESTAMP(3),
    "finalDeedDate" TIMESTAMP(3),
    "estimatedClosing" TIMESTAMP(3),
    "actualClosing" TIMESTAMP(3),
    "buyerName" TEXT,
    "buyerEmail" TEXT,
    "buyerPhone" TEXT,
    "notes" TEXT,
    "notaryName" TEXT,
    "notaryContact" TEXT,
    "loanAmount" DOUBLE PRECISION,
    "loanApproved" BOOLEAN NOT NULL DEFAULT false,
    "conditions" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: transaction_steps
CREATE TABLE "transaction_steps" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedBy" TEXT,
    "notes" TEXT,
    "documents" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable: commissions
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'agent',
    "amount" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "status" "CommissionStatus" NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: invoices
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "ownerId" TEXT,
    "number" TEXT NOT NULL,
    "clientType" "ClientType" NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "clientAddress" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "vat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "description" TEXT,
    "items" JSONB,
    "notes" TEXT,
    "pdfUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable: payments
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "commissionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- AlterTable: properties (add new fields)
ALTER TABLE "properties" ADD COLUMN "ownerNewId" TEXT;

-- CreateIndex
CREATE INDEX "owners_userId_idx" ON "owners"("userId");
CREATE INDEX "owners_email_idx" ON "owners"("email");
CREATE INDEX "owners_phone_idx" ON "owners"("phone");

CREATE UNIQUE INDEX "mandates_reference_key" ON "mandates"("reference");
CREATE INDEX "mandates_userId_idx" ON "mandates"("userId");
CREATE INDEX "mandates_ownerId_idx" ON "mandates"("ownerId");
CREATE INDEX "mandates_propertyId_idx" ON "mandates"("propertyId");
CREATE INDEX "mandates_status_idx" ON "mandates"("status");
CREATE INDEX "mandates_endDate_idx" ON "mandates"("endDate");
CREATE INDEX "mandates_reference_idx" ON "mandates"("reference");

CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");
CREATE INDEX "transactions_propertyId_idx" ON "transactions"("propertyId");
CREATE INDEX "transactions_prospectId_idx" ON "transactions"("prospectId");
CREATE INDEX "transactions_mandateId_idx" ON "transactions"("mandateId");
CREATE INDEX "transactions_status_idx" ON "transactions"("status");
CREATE INDEX "transactions_type_idx" ON "transactions"("type");
CREATE INDEX "transactions_estimatedClosing_idx" ON "transactions"("estimatedClosing");
CREATE INDEX "transactions_reference_idx" ON "transactions"("reference");

CREATE INDEX "transaction_steps_transactionId_idx" ON "transaction_steps"("transactionId");
CREATE INDEX "transaction_steps_stage_idx" ON "transaction_steps"("stage");

CREATE INDEX "commissions_userId_idx" ON "commissions"("userId");
CREATE INDEX "commissions_transactionId_idx" ON "commissions"("transactionId");
CREATE INDEX "commissions_agentId_idx" ON "commissions"("agentId");
CREATE INDEX "commissions_status_idx" ON "commissions"("status");
CREATE INDEX "commissions_dueDate_idx" ON "commissions"("dueDate");

CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");
CREATE INDEX "invoices_userId_idx" ON "invoices"("userId");
CREATE INDEX "invoices_transactionId_idx" ON "invoices"("transactionId");
CREATE INDEX "invoices_ownerId_idx" ON "invoices"("ownerId");
CREATE INDEX "invoices_number_idx" ON "invoices"("number");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

CREATE INDEX "payments_userId_idx" ON "payments"("userId");
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");
CREATE INDEX "payments_commissionId_idx" ON "payments"("commissionId");
CREATE INDEX "payments_paidAt_idx" ON "payments"("paidAt");

CREATE INDEX "properties_ownerNewId_idx" ON "properties"("ownerNewId");

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mandates" ADD CONSTRAINT "mandates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "mandates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transaction_steps" ADD CONSTRAINT "transaction_steps_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commissions" ADD CONSTRAINT "commissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "commissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "properties" ADD CONSTRAINT "properties_ownerNewId_fkey" FOREIGN KEY ("ownerNewId") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
