-- Investment Intelligence Module
-- Migration: 20251221_add_investment_intelligence

-- ============================================
-- ENUM: Investment Project Source
-- ============================================
CREATE TYPE "InvestmentProjectSource" AS ENUM (
  'bricks',         -- Bricks.co
  'homunity',       -- Homunity.com
  'anaxago',        -- Anaxago.com
  'fundimmo',       -- Fundimmo.com (future)
  'lymo',           -- Lymo.fr (future)
  'raizers',        -- Raizers.com (future)
  'wiseed',         -- Wiseed.com (future)
  'estateguru',     -- Estateguru.co (future)
  'reinvest24',     -- Reinvest24.com (future)
  'crowdestate',    -- Crowdestate.eu (future)
  'tunisia_local',  -- Plateformes locales Tunisie (future)
  'manual',         -- Ajout manuel
  'other'           -- Autre plateforme (scraping générique)
);

-- ============================================
-- ENUM: Investment Project Status
-- ============================================
CREATE TYPE "InvestmentProjectStatus" AS ENUM (
  'draft',          -- Importé mais pas analysé
  'analyzing',      -- Analyse en cours
  'active',         -- Projet actif
  'funded',         -- Financé complètement
  'completed',      -- Terminé
  'archived'        -- Archivé
);

-- ============================================
-- TABLE: investment_projects
-- ============================================
CREATE TABLE "investment_projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    -- Données du projet
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceUrl" TEXT,
    "source" "InvestmentProjectSource" NOT NULL,
    "sourceProjectId" TEXT,

    -- Localisation
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'France',
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    -- Financiers
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "minTicket" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',

    -- Rendements
    "grossYield" DOUBLE PRECISION,
    "netYield" DOUBLE PRECISION,
    "targetYield" DOUBLE PRECISION,

    -- Durée
    "durationMonths" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    -- Type
    "propertyType" TEXT NOT NULL,

    -- Status
    "status" "InvestmentProjectStatus" NOT NULL DEFAULT 'draft',
    "fundingProgress" DOUBLE PRECISION,

    -- Métadonnées
    "rawData" JSONB,
    "images" TEXT[],
    "documents" TEXT[],

    -- Tracking
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAnalyzedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_projects_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- TABLE: investment_analyses
-- ============================================
CREATE TABLE "investment_analyses" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orchestrationId" TEXT,

    -- Scoring global (0-100)
    "overallScore" INTEGER NOT NULL,

    -- Scores détaillés (0-100)
    "locationScore" INTEGER,
    "yieldScore" INTEGER,
    "riskScore" INTEGER,
    "liquidityScore" INTEGER,

    -- Analyses textuelles
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "opportunities" TEXT[],
    "threats" TEXT[],

    -- Recommandation
    "recommendation" TEXT NOT NULL,
    "recommendationReason" TEXT,

    -- Comparaisons de marché
    "marketComparison" JSONB,
    "similarProjects" TEXT[],

    -- Métriques avancées
    "metrics" JSONB,

    -- Alertes/Drapeaux
    "redFlags" TEXT[],

    -- Tracking
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_analyses_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- TABLE: investment_comparisons
-- ============================================
CREATE TABLE "investment_comparisons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,

    -- Projets comparés
    "projectIds" TEXT[],

    -- Critères de comparaison
    "criteria" JSONB NOT NULL,

    -- Résultats
    "results" JSONB NOT NULL,
    "winner" TEXT,
    "recommendations" TEXT[],

    -- Tracking
    "comparedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_comparisons_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- TABLE: investment_alerts
-- ============================================
CREATE TABLE "investment_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    -- Configuration
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    -- Critères de l'alerte
    "criteria" JSONB NOT NULL,

    -- Notifications
    "notificationChannels" JSONB NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'immediate',

    -- Tracking
    "lastTriggeredAt" TIMESTAMP(3),
    "triggeredCount" INTEGER NOT NULL DEFAULT 0,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_alerts_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- TABLE JUNCTION: investment_alert_matches
-- ============================================
CREATE TABLE "_InvestmentAlertMatches" (
    "A" TEXT NOT NULL,  -- investment_alerts.id
    "B" TEXT NOT NULL,  -- investment_projects.id

    CONSTRAINT "_InvestmentAlertMatches_AB_unique" UNIQUE ("A", "B")
);

-- ============================================
-- FOREIGN KEYS
-- ============================================

-- investment_projects -> users
ALTER TABLE "investment_projects" ADD CONSTRAINT "investment_projects_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- investment_analyses -> investment_projects
ALTER TABLE "investment_analyses" ADD CONSTRAINT "investment_analyses_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "investment_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Junction table indexes
CREATE INDEX "_InvestmentAlertMatches_B_index" ON "_InvestmentAlertMatches"("B");

-- ============================================
-- INDEXES
-- ============================================

-- investment_projects
CREATE INDEX "investment_projects_userId_idx" ON "investment_projects"("userId");
CREATE INDEX "investment_projects_tenantId_idx" ON "investment_projects"("tenantId");
CREATE INDEX "investment_projects_status_idx" ON "investment_projects"("status");
CREATE INDEX "investment_projects_source_idx" ON "investment_projects"("source");
CREATE INDEX "investment_projects_city_idx" ON "investment_projects"("city");
CREATE INDEX "investment_projects_grossYield_idx" ON "investment_projects"("grossYield");
CREATE INDEX "investment_projects_netYield_idx" ON "investment_projects"("netYield");
CREATE INDEX "investment_projects_importedAt_idx" ON "investment_projects"("importedAt");

-- investment_analyses
CREATE INDEX "investment_analyses_projectId_idx" ON "investment_analyses"("projectId");
CREATE INDEX "investment_analyses_userId_idx" ON "investment_analyses"("userId");
CREATE INDEX "investment_analyses_overallScore_idx" ON "investment_analyses"("overallScore");
CREATE INDEX "investment_analyses_recommendation_idx" ON "investment_analyses"("recommendation");

-- investment_comparisons
CREATE INDEX "investment_comparisons_userId_idx" ON "investment_comparisons"("userId");

-- investment_alerts
CREATE INDEX "investment_alerts_userId_idx" ON "investment_alerts"("userId");
CREATE INDEX "investment_alerts_tenantId_idx" ON "investment_alerts"("tenantId");
CREATE INDEX "investment_alerts_isActive_idx" ON "investment_alerts"("isActive");
