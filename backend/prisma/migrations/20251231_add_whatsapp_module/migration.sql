-- CreateEnum: WhatsApp Module Enums
CREATE TYPE "WhatsAppProvider" AS ENUM ('meta', 'twilio');
CREATE TYPE "ConversationStatus" AS ENUM ('open', 'assigned', 'resolved', 'closed');
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'document', 'video', 'audio', 'template', 'location');
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'delivered', 'read', 'failed');
CREATE TYPE "TemplateCategory" AS ENUM ('marketing', 'utility', 'authentication');
CREATE TYPE "TemplateStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable: WhatsAppConfig
CREATE TABLE "WhatsAppConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "agencyId" TEXT,
    "phoneNumberId" TEXT,
    "businessAccountId" TEXT,
    "accessToken" TEXT,
    "twilioAccountSid" TEXT,
    "twilioAuthToken" TEXT,
    "twilioPhoneNumber" TEXT,
    "provider" "WhatsAppProvider" NOT NULL DEFAULT 'meta',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "businessHoursOnly" BOOLEAN NOT NULL DEFAULT false,
    "businessHoursStart" TEXT,
    "businessHoursEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WhatsAppConversation
CREATE TABLE "WhatsAppConversation" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "contactName" TEXT,
    "leadId" TEXT,
    "prospectId" TEXT,
    "userId" TEXT,
    "agencyId" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'open',
    "assignedTo" TEXT,
    "tags" TEXT[],
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WhatsAppMessage
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "type" "MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "caption" TEXT,
    "mediaUrl" TEXT,
    "mimeType" TEXT,
    "templateName" TEXT,
    "templateParams" JSONB,
    "status" "MessageStatus" NOT NULL DEFAULT 'sent',
    "sentBy" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WhatsAppTemplate
CREATE TABLE "WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "category" "TemplateCategory" NOT NULL,
    "header" TEXT,
    "body" TEXT NOT NULL,
    "footer" TEXT,
    "buttons" JSONB,
    "variables" TEXT[],
    "status" "TemplateStatus" NOT NULL DEFAULT 'pending',
    "metaTemplateId" TEXT,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: WhatsAppConfig indexes
CREATE UNIQUE INDEX "WhatsAppConfig_userId_key" ON "WhatsAppConfig"("userId");
CREATE UNIQUE INDEX "WhatsAppConfig_agencyId_key" ON "WhatsAppConfig"("agencyId");
CREATE INDEX "WhatsAppConfig_phoneNumberId_idx" ON "WhatsAppConfig"("phoneNumberId");
CREATE INDEX "WhatsAppConfig_provider_idx" ON "WhatsAppConfig"("provider");

-- CreateIndex: WhatsAppConversation indexes
CREATE INDEX "WhatsAppConversation_configId_idx" ON "WhatsAppConversation"("configId");
CREATE INDEX "WhatsAppConversation_phoneNumber_idx" ON "WhatsAppConversation"("phoneNumber");
CREATE INDEX "WhatsAppConversation_leadId_idx" ON "WhatsAppConversation"("leadId");
CREATE INDEX "WhatsAppConversation_prospectId_idx" ON "WhatsAppConversation"("prospectId");
CREATE INDEX "WhatsAppConversation_userId_idx" ON "WhatsAppConversation"("userId");
CREATE INDEX "WhatsAppConversation_status_idx" ON "WhatsAppConversation"("status");
CREATE INDEX "WhatsAppConversation_assignedTo_idx" ON "WhatsAppConversation"("assignedTo");
CREATE INDEX "WhatsAppConversation_userId_phoneNumber_idx" ON "WhatsAppConversation"("userId", "phoneNumber");
CREATE INDEX "WhatsAppConversation_lastMessageAt_idx" ON "WhatsAppConversation"("lastMessageAt");

-- CreateIndex: WhatsAppMessage indexes
CREATE UNIQUE INDEX "WhatsAppMessage_messageId_key" ON "WhatsAppMessage"("messageId");
CREATE INDEX "WhatsAppMessage_conversationId_idx" ON "WhatsAppMessage"("conversationId");
CREATE INDEX "WhatsAppMessage_direction_idx" ON "WhatsAppMessage"("direction");
CREATE INDEX "WhatsAppMessage_status_idx" ON "WhatsAppMessage"("status");
CREATE INDEX "WhatsAppMessage_timestamp_idx" ON "WhatsAppMessage"("timestamp");
CREATE INDEX "WhatsAppMessage_conversationId_timestamp_idx" ON "WhatsAppMessage"("conversationId", "timestamp");

-- CreateIndex: WhatsAppTemplate indexes
CREATE INDEX "WhatsAppTemplate_configId_idx" ON "WhatsAppTemplate"("configId");
CREATE INDEX "WhatsAppTemplate_name_idx" ON "WhatsAppTemplate"("name");
CREATE INDEX "WhatsAppTemplate_status_idx" ON "WhatsAppTemplate"("status");
CREATE UNIQUE INDEX "WhatsAppTemplate_configId_name_language_key" ON "WhatsAppTemplate"("configId", "name", "language");

-- AddForeignKey: WhatsAppConfig relations
ALTER TABLE "WhatsAppConfig" ADD CONSTRAINT "WhatsAppConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: WhatsAppConversation relations
ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_configId_fkey" FOREIGN KEY ("configId") REFERENCES "WhatsAppConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: WhatsAppMessage relations
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: WhatsAppTemplate relations
ALTER TABLE "WhatsAppTemplate" ADD CONSTRAINT "WhatsAppTemplate_configId_fkey" FOREIGN KEY ("configId") REFERENCES "WhatsAppConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
