-- CreateTable
CREATE TABLE "ProspectingSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "type" TEXT NOT NULL,
    "config" JSONB,
    "lastScraped" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProspectingSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prospectId" TEXT,
    "propertyId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "type" TEXT NOT NULL DEFAULT 'visit',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "prospectType" TEXT,
    "subType" TEXT,
    "searchCriteria" JSONB,
    "mandatInfo" JSONB,
    "profiling" JSONB,
    "timeline" TEXT,
    "budget" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "reminder" BOOLEAN NOT NULL DEFAULT true,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" INTEGER DEFAULT 60,
    "attendees" JSONB,
    "notes" TEXT,
    "outcome" TEXT,
    "rating" INTEGER,
    "googleEventId" TEXT,
    "iCalUid" TEXT,
    "recurrence" JSONB,
    "color" TEXT DEFAULT '#3B82F6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "prospectType" TEXT,
    "subType" TEXT,
    "searchCriteria" JSONB,
    "mandatInfo" JSONB,
    "profiling" JSONB,
    "timeline" TEXT,
    "budget" JSONB,
    "content" JSONB NOT NULL,
    "recipients" JSONB NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "stats" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasons" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "prospectType" TEXT,
    "subType" TEXT,
    "searchCriteria" JSONB,
    "mandatInfo" JSONB,
    "profiling" JSONB,
    "timeline" TEXT,
    "budget" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agencyId" TEXT,
    "reference" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "address" TEXT,
    "city" TEXT,
    "delegation" TEXT,
    "zipCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "area" DOUBLE PRECISION,
    "images" JSONB,
    "features" JSONB,
    "status" TEXT NOT NULL DEFAULT 'available',
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "prospectType" TEXT,
    "subType" TEXT,
    "searchCriteria" JSONB,
    "mandatInfo" JSONB,
    "profiling" JSONB,
    "timeline" TEXT,
    "budget" JSONB,
    "wpSyncId" TEXT,
    "wpSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agencyId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "type" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "preferences" JSONB,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "score" INTEGER NOT NULL DEFAULT 0,
    "prospectType" TEXT,
    "subType" TEXT,
    "searchCriteria" JSONB,
    "mandatInfo" JSONB,
    "profiling" JSONB,
    "timeline" TEXT,
    "budget" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "config" JSONB,
    "data" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'agent',
    "agencyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "from" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "prospectType" TEXT,
    "subType" TEXT,
    "searchCriteria" JSONB,
    "mandatInfo" JSONB,
    "profiling" JSONB,
    "timeline" TEXT,
    "budget" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "failedReason" TEXT,
    "prospectId" TEXT,
    "propertyId" TEXT,
    "templateId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "extension" TEXT NOT NULL,
    "prospectId" TEXT,
    "propertyId" TEXT,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "tags" JSONB,
    "metadata" JSONB,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isSigned" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "signedBy" TEXT,
    "ocrProcessed" BOOLEAN NOT NULL DEFAULT false,
    "ocrText" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiGenerationId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "category" TEXT,
    "mimeType" TEXT NOT NULL DEFAULT 'text/html',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "type" TEXT,
    "documentType" TEXT,
    "tokensUsed" INTEGER,
    "cost" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "maxTokens" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "prospectType" TEXT,
    "subType" TEXT,
    "searchCriteria" JSONB,
    "mandatInfo" JSONB,
    "profiling" JSONB,
    "timeline" TEXT,
    "budget" JSONB,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "extractedText" TEXT NOT NULL,
    "text" TEXT,
    "language" TEXT NOT NULL DEFAULT 'fra+eng',
    "confidence" DOUBLE PRECISION,
    "processingTime" INTEGER,
    "engine" TEXT NOT NULL DEFAULT 'tesseract',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultProvider" TEXT NOT NULL DEFAULT 'openai',
    "preferredProvider" TEXT DEFAULT 'openai',
    "openaiApiKey" TEXT,
    "geminiApiKey" TEXT,
    "claudeApiKey" TEXT,
    "deepseekApiKey" TEXT,
    "openrouterApiKey" TEXT,
    "customApiKeys" JSONB,
    "defaultModel" TEXT,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2000,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospecting_campaigns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "prospectType" TEXT,
    "subType" TEXT,
    "searchCriteria" JSONB,
    "mandatInfo" JSONB,
    "profiling" JSONB,
    "timeline" TEXT,
    "budget" JSONB,
    "targetCount" INTEGER,
    "foundCount" INTEGER NOT NULL DEFAULT 0,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospecting_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospecting_leads" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "propertyType" TEXT,
    "source" TEXT,
    "sourceUrl" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'new',
    "prospectType" TEXT,
    "subType" TEXT,
    "searchCriteria" JSONB,
    "mandatInfo" JSONB,
    "profiling" JSONB,
    "timeline" TEXT,
    "budget" JSONB,
    "matchedPropertyIds" JSONB,
    "metadata" JSONB,
    "convertedProspectId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospecting_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospecting_matches" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "prospectId" TEXT,
    "propertyId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reason" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "prospectType" TEXT,
    "subType" TEXT,
    "searchCriteria" JSONB,
    "mandatInfo" JSONB,
    "profiling" JSONB,
    "timeline" TEXT,
    "budget" JSONB,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospecting_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_validations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactType" TEXT NOT NULL,
    "contactValue" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "validationMethod" TEXT,
    "reason" TEXT,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "isDisposable" BOOLEAN NOT NULL DEFAULT false,
    "isCatchAll" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT,
    "metadata" JSONB,
    "prospectId" TEXT,
    "leadId" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_blacklist" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT,
    "addedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validation_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_whitelist" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "addedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validation_whitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disposable_domains" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disposable_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "prospectType" TEXT,
    "subType" TEXT,
    "searchCriteria" JSONB,
    "mandatInfo" JSONB,
    "profiling" JSONB,
    "timeline" TEXT,
    "budget" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "prospectId" TEXT,
    "propertyId" TEXT,
    "appointmentId" TEXT,
    "tags" JSONB,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "type" TEXT NOT NULL DEFAULT 'string',
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_interactions" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "notes" TEXT,
    "nextAction" TEXT,
    "nextActionDate" TIMESTAMP(3),
    "sentiment" TEXT,
    "propertyShown" TEXT,
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_preferences" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "liked" JSONB,
    "disliked" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospect_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_timeline" (
    "budget" JSONB,
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "outcome" TEXT,
    "notes" TEXT,

    CONSTRAINT "prospect_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_properties_shown" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "shownDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitType" TEXT,
    "feedback" TEXT,
    "interestLevel" INTEGER,
    "reasons" JSONB,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_properties_shown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitrineConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "agencyName" TEXT NOT NULL,
    "logo" TEXT,
    "slogan" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#10B981',
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "schedule" JSONB,
    "socialLinks" JSONB,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "heroImage" TEXT,
    "aboutText" TEXT,
    "services" JSONB,
    "testimonials" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "analyticsId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VitrineConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishedProperty" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishedProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitrineAnalytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "propertyId" TEXT,
    "source" TEXT,

    CONSTRAINT "VitrineAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertySeo" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "slug" TEXT NOT NULL,
    "keywords" TEXT[],
    "altTexts" JSONB,
    "faq" JSONB,
    "schemaOrg" JSONB,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "lastOptimized" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertySeo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'claude',
    "language" TEXT NOT NULL DEFAULT 'fr',
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "targetKeywords" TEXT[],
    "geoArea" TEXT[],
    "autoOptimize" BOOLEAN NOT NULL DEFAULT true,
    "blogFrequency" TEXT NOT NULL DEFAULT 'weekly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoBlogPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "keywords" TEXT[],
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SeoBlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LlmConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'anthropic',
    "apiKey" TEXT,
    "model" TEXT,
    "defaultMaxTokens" INTEGER DEFAULT 1000,
    "defaultTemperature" DOUBLE PRECISION DEFAULT 0.7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LlmConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "template" TEXT,
    "seo" JSONB,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "useServerSide" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "sessionId" TEXT,
    "prospectId" TEXT,
    "propertyId" TEXT,
    "data" JSONB,
    "source" TEXT NOT NULL DEFAULT 'web',
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "url" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversionProbability" DOUBLE PRECISION,
    "leadScore" INTEGER,
    "segment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MlConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'suggestion',
    "enableConversionPrediction" BOOLEAN NOT NULL DEFAULT true,
    "enableAnomalyDetection" BOOLEAN NOT NULL DEFAULT true,
    "enableAutoSegmentation" BOOLEAN NOT NULL DEFAULT true,
    "enableSmartAttribution" BOOLEAN NOT NULL DEFAULT true,
    "budgetAdjustmentLimit" INTEGER DEFAULT 20,
    "minConfidenceScore" DOUBLE PRECISION DEFAULT 0.7,
    "customRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MlConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "campaign" TEXT,
    "currentValue" JSONB NOT NULL,
    "suggestedValue" JSONB NOT NULL,
    "expectedImpact" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "AiSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectedAnomaly" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "expectedValue" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL,
    "deviation" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "recommendations" JSONB,
    "autoFixed" BOOLEAN NOT NULL DEFAULT false,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetectedAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION,
    "requestType" TEXT NOT NULL,
    "endpoint" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT,
    "prospectId" TEXT,
    "propertyId" TEXT,
    "appointmentId" TEXT,
    "value" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointments_userId_idx" ON "appointments"("userId");

-- CreateIndex
CREATE INDEX "appointments_prospectId_idx" ON "appointments"("prospectId");

-- CreateIndex
CREATE INDEX "appointments_propertyId_idx" ON "appointments"("propertyId");

-- CreateIndex
CREATE INDEX "appointments_startTime_idx" ON "appointments"("startTime");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_type_idx" ON "appointments"("type");

-- CreateIndex
CREATE UNIQUE INDEX "matches_propertyId_prospectId_key" ON "matches"("propertyId", "prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "user_integrations_userId_type_key" ON "user_integrations"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "communications_userId_idx" ON "communications"("userId");

-- CreateIndex
CREATE INDEX "communications_prospectId_idx" ON "communications"("prospectId");

-- CreateIndex
CREATE INDEX "communications_type_idx" ON "communications"("type");

-- CreateIndex
CREATE INDEX "communications_status_idx" ON "communications"("status");

-- CreateIndex
CREATE INDEX "communication_templates_userId_idx" ON "communication_templates"("userId");

-- CreateIndex
CREATE INDEX "communication_templates_type_idx" ON "communication_templates"("type");

-- CreateIndex
CREATE INDEX "document_categories_parentId_idx" ON "document_categories"("parentId");

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- CreateIndex
CREATE INDEX "documents_categoryId_idx" ON "documents"("categoryId");

-- CreateIndex
CREATE INDEX "documents_prospectId_idx" ON "documents"("prospectId");

-- CreateIndex
CREATE INDEX "documents_propertyId_idx" ON "documents"("propertyId");

-- CreateIndex
CREATE INDEX "documents_relatedType_relatedId_idx" ON "documents"("relatedType", "relatedId");

-- CreateIndex
CREATE INDEX "document_templates_userId_idx" ON "document_templates"("userId");

-- CreateIndex
CREATE INDEX "document_templates_category_idx" ON "document_templates"("category");

-- CreateIndex
CREATE INDEX "ai_generations_userId_idx" ON "ai_generations"("userId");

-- CreateIndex
CREATE INDEX "ai_generations_provider_idx" ON "ai_generations"("provider");

-- CreateIndex
CREATE INDEX "ai_generations_status_idx" ON "ai_generations"("status");

-- CreateIndex
CREATE INDEX "ocr_results_userId_idx" ON "ocr_results"("userId");

-- CreateIndex
CREATE INDEX "ocr_results_documentId_idx" ON "ocr_results"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_settings_userId_key" ON "ai_settings"("userId");

-- CreateIndex
CREATE INDEX "ai_settings_userId_idx" ON "ai_settings"("userId");

-- CreateIndex
CREATE INDEX "prospecting_campaigns_userId_idx" ON "prospecting_campaigns"("userId");

-- CreateIndex
CREATE INDEX "prospecting_campaigns_status_idx" ON "prospecting_campaigns"("status");

-- CreateIndex
CREATE INDEX "prospecting_campaigns_type_idx" ON "prospecting_campaigns"("type");

-- CreateIndex
CREATE INDEX "prospecting_leads_campaignId_idx" ON "prospecting_leads"("campaignId");

-- CreateIndex
CREATE INDEX "prospecting_leads_userId_idx" ON "prospecting_leads"("userId");

-- CreateIndex
CREATE INDEX "prospecting_leads_status_idx" ON "prospecting_leads"("status");

-- CreateIndex
CREATE INDEX "prospecting_leads_score_idx" ON "prospecting_leads"("score");

-- CreateIndex
CREATE INDEX "prospecting_leads_email_idx" ON "prospecting_leads"("email");

-- CreateIndex
CREATE INDEX "prospecting_matches_leadId_idx" ON "prospecting_matches"("leadId");

-- CreateIndex
CREATE INDEX "prospecting_matches_prospectId_idx" ON "prospecting_matches"("prospectId");

-- CreateIndex
CREATE INDEX "prospecting_matches_propertyId_idx" ON "prospecting_matches"("propertyId");

-- CreateIndex
CREATE INDEX "prospecting_matches_score_idx" ON "prospecting_matches"("score");

-- CreateIndex
CREATE INDEX "prospecting_matches_status_idx" ON "prospecting_matches"("status");

-- CreateIndex
CREATE INDEX "contact_validations_userId_idx" ON "contact_validations"("userId");

-- CreateIndex
CREATE INDEX "contact_validations_contactValue_idx" ON "contact_validations"("contactValue");

-- CreateIndex
CREATE INDEX "contact_validations_isValid_idx" ON "contact_validations"("isValid");

-- CreateIndex
CREATE INDEX "contact_validations_isSpam_idx" ON "contact_validations"("isSpam");

-- CreateIndex
CREATE INDEX "contact_validations_prospectId_idx" ON "contact_validations"("prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "validation_blacklist_value_key" ON "validation_blacklist"("value");

-- CreateIndex
CREATE INDEX "validation_blacklist_type_idx" ON "validation_blacklist"("type");

-- CreateIndex
CREATE INDEX "validation_blacklist_value_idx" ON "validation_blacklist"("value");

-- CreateIndex
CREATE INDEX "validation_blacklist_isActive_idx" ON "validation_blacklist"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "validation_whitelist_value_key" ON "validation_whitelist"("value");

-- CreateIndex
CREATE INDEX "validation_whitelist_type_idx" ON "validation_whitelist"("type");

-- CreateIndex
CREATE INDEX "validation_whitelist_value_idx" ON "validation_whitelist"("value");

-- CreateIndex
CREATE INDEX "validation_whitelist_isActive_idx" ON "validation_whitelist"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "disposable_domains_domain_key" ON "disposable_domains"("domain");

-- CreateIndex
CREATE INDEX "disposable_domains_domain_idx" ON "disposable_domains"("domain");

-- CreateIndex
CREATE INDEX "disposable_domains_isActive_idx" ON "disposable_domains"("isActive");

-- CreateIndex
CREATE INDEX "tasks_userId_idx" ON "tasks"("userId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

-- CreateIndex
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");

-- CreateIndex
CREATE INDEX "tasks_prospectId_idx" ON "tasks"("prospectId");

-- CreateIndex
CREATE INDEX "tasks_propertyId_idx" ON "tasks"("propertyId");

-- CreateIndex
CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");

-- CreateIndex
CREATE INDEX "analytics_events_eventType_idx" ON "analytics_events"("eventType");

-- CreateIndex
CREATE INDEX "analytics_events_timestamp_idx" ON "analytics_events"("timestamp");

-- CreateIndex
CREATE INDEX "settings_section_idx" ON "settings"("section");

-- CreateIndex
CREATE INDEX "settings_userId_idx" ON "settings"("userId");

-- CreateIndex
CREATE INDEX "settings_section_userId_idx" ON "settings"("section", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_section_key_userId_key" ON "settings"("section", "key", "userId");

-- CreateIndex
CREATE INDEX "prospect_interactions_prospectId_idx" ON "prospect_interactions"("prospectId");

-- CreateIndex
CREATE INDEX "prospect_interactions_userId_idx" ON "prospect_interactions"("userId");

-- CreateIndex
CREATE INDEX "prospect_interactions_date_idx" ON "prospect_interactions"("date");

-- CreateIndex
CREATE INDEX "prospect_interactions_nextActionDate_idx" ON "prospect_interactions"("nextActionDate");

-- CreateIndex
CREATE INDEX "prospect_preferences_prospectId_idx" ON "prospect_preferences"("prospectId");

-- CreateIndex
CREATE INDEX "prospect_preferences_category_idx" ON "prospect_preferences"("category");

-- CreateIndex
CREATE INDEX "prospect_timeline_prospectId_idx" ON "prospect_timeline"("prospectId");

-- CreateIndex
CREATE INDEX "prospect_timeline_stage_idx" ON "prospect_timeline"("stage");

-- CreateIndex
CREATE INDEX "prospect_timeline_enteredAt_idx" ON "prospect_timeline"("enteredAt");

-- CreateIndex
CREATE INDEX "prospect_properties_shown_prospectId_idx" ON "prospect_properties_shown"("prospectId");

-- CreateIndex
CREATE INDEX "prospect_properties_shown_propertyId_idx" ON "prospect_properties_shown"("propertyId");

-- CreateIndex
CREATE INDEX "prospect_properties_shown_shownDate_idx" ON "prospect_properties_shown"("shownDate");

-- CreateIndex
CREATE INDEX "prospect_properties_shown_interestLevel_idx" ON "prospect_properties_shown"("interestLevel");

-- CreateIndex
CREATE UNIQUE INDEX "VitrineConfig_userId_key" ON "VitrineConfig"("userId");

-- CreateIndex
CREATE INDEX "PublishedProperty_userId_idx" ON "PublishedProperty"("userId");

-- CreateIndex
CREATE INDEX "PublishedProperty_isFeatured_idx" ON "PublishedProperty"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "PublishedProperty_propertyId_userId_key" ON "PublishedProperty"("propertyId", "userId");

-- CreateIndex
CREATE INDEX "VitrineAnalytics_userId_date_idx" ON "VitrineAnalytics"("userId", "date");

-- CreateIndex
CREATE INDEX "VitrineAnalytics_propertyId_idx" ON "VitrineAnalytics"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertySeo_propertyId_key" ON "PropertySeo"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertySeo_slug_key" ON "PropertySeo"("slug");

-- CreateIndex
CREATE INDEX "PropertySeo_propertyId_idx" ON "PropertySeo"("propertyId");

-- CreateIndex
CREATE INDEX "PropertySeo_seoScore_idx" ON "PropertySeo"("seoScore");

-- CreateIndex
CREATE INDEX "PropertySeo_slug_idx" ON "PropertySeo"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SeoConfig_userId_key" ON "SeoConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SeoBlogPost_slug_key" ON "SeoBlogPost"("slug");

-- CreateIndex
CREATE INDEX "SeoBlogPost_userId_idx" ON "SeoBlogPost"("userId");

-- CreateIndex
CREATE INDEX "SeoBlogPost_publishedAt_idx" ON "SeoBlogPost"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LlmConfig_userId_key" ON "LlmConfig"("userId");

-- CreateIndex
CREATE INDEX "LlmConfig_userId_idx" ON "LlmConfig"("userId");

-- CreateIndex
CREATE INDEX "LlmConfig_provider_idx" ON "LlmConfig"("provider");

-- CreateIndex
CREATE INDEX "Page_userId_idx" ON "Page"("userId");

-- CreateIndex
CREATE INDEX "Page_slug_idx" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_isPublished_idx" ON "Page"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "Page_userId_slug_key" ON "Page"("userId", "slug");

-- CreateIndex
CREATE INDEX "TrackingConfig_userId_idx" ON "TrackingConfig"("userId");

-- CreateIndex
CREATE INDEX "TrackingConfig_platform_idx" ON "TrackingConfig"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingConfig_userId_platform_key" ON "TrackingConfig"("userId", "platform");

-- CreateIndex
CREATE INDEX "TrackingEvent_userId_idx" ON "TrackingEvent"("userId");

-- CreateIndex
CREATE INDEX "TrackingEvent_sessionId_idx" ON "TrackingEvent"("sessionId");

-- CreateIndex
CREATE INDEX "TrackingEvent_prospectId_idx" ON "TrackingEvent"("prospectId");

-- CreateIndex
CREATE INDEX "TrackingEvent_timestamp_idx" ON "TrackingEvent"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MlConfig_userId_key" ON "MlConfig"("userId");

-- CreateIndex
CREATE INDEX "MlConfig_userId_idx" ON "MlConfig"("userId");

-- CreateIndex
CREATE INDEX "AiSuggestion_userId_idx" ON "AiSuggestion"("userId");

-- CreateIndex
CREATE INDEX "AiSuggestion_status_idx" ON "AiSuggestion"("status");

-- CreateIndex
CREATE INDEX "DetectedAnomaly_userId_idx" ON "DetectedAnomaly"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_metrics_userId_idx" ON "ai_usage_metrics"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_metrics_provider_idx" ON "ai_usage_metrics"("provider");

-- CreateIndex
CREATE INDEX "ai_usage_metrics_timestamp_idx" ON "ai_usage_metrics"("timestamp");

-- CreateIndex
CREATE INDEX "ai_usage_metrics_userId_timestamp_idx" ON "ai_usage_metrics"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "conversion_events_userId_idx" ON "conversion_events"("userId");

-- CreateIndex
CREATE INDEX "conversion_events_eventType_idx" ON "conversion_events"("eventType");

-- CreateIndex
CREATE INDEX "conversion_events_prospectId_idx" ON "conversion_events"("prospectId");

-- CreateIndex
CREATE INDEX "conversion_events_propertyId_idx" ON "conversion_events"("propertyId");

-- CreateIndex
CREATE INDEX "conversion_events_timestamp_idx" ON "conversion_events"("timestamp");

-- CreateIndex
CREATE INDEX "conversion_events_userId_timestamp_idx" ON "conversion_events"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "conversion_events_userId_eventType_idx" ON "conversion_events"("userId", "eventType");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_templates" ADD CONSTRAINT "communication_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_categories" ADD CONSTRAINT "document_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "document_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "document_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_aiGenerationId_fkey" FOREIGN KEY ("aiGenerationId") REFERENCES "ai_generations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_results" ADD CONSTRAINT "ocr_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_results" ADD CONSTRAINT "ocr_results_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospecting_campaigns" ADD CONSTRAINT "prospecting_campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospecting_leads" ADD CONSTRAINT "prospecting_leads_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "prospecting_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospecting_leads" ADD CONSTRAINT "prospecting_leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospecting_leads" ADD CONSTRAINT "prospecting_leads_convertedProspectId_fkey" FOREIGN KEY ("convertedProspectId") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospecting_matches" ADD CONSTRAINT "prospecting_matches_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospecting_matches" ADD CONSTRAINT "prospecting_matches_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_validations" ADD CONSTRAINT "contact_validations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_validations" ADD CONSTRAINT "contact_validations_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_interactions" ADD CONSTRAINT "prospect_interactions_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_interactions" ADD CONSTRAINT "prospect_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_preferences" ADD CONSTRAINT "prospect_preferences_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_timeline" ADD CONSTRAINT "prospect_timeline_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_properties_shown" ADD CONSTRAINT "prospect_properties_shown_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_properties_shown" ADD CONSTRAINT "prospect_properties_shown_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitrineConfig" ADD CONSTRAINT "VitrineConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedProperty" ADD CONSTRAINT "PublishedProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedProperty" ADD CONSTRAINT "PublishedProperty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitrineAnalytics" ADD CONSTRAINT "VitrineAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitrineAnalytics" ADD CONSTRAINT "VitrineAnalytics_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertySeo" ADD CONSTRAINT "PropertySeo_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoConfig" ADD CONSTRAINT "SeoConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoBlogPost" ADD CONSTRAINT "SeoBlogPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LlmConfig" ADD CONSTRAINT "LlmConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingConfig" ADD CONSTRAINT "TrackingConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MlConfig" ADD CONSTRAINT "MlConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSuggestion" ADD CONSTRAINT "AiSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedAnomaly" ADD CONSTRAINT "DetectedAnomaly_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_metrics" ADD CONSTRAINT "ai_usage_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_events" ADD CONSTRAINT "conversion_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
