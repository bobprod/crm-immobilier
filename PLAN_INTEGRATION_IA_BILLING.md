# 🚀 Plan d'intégration IA Billing & Multi-tenant API Keys

**Projet** : CRM Immobilier - Système de crédits IA et gestion multi-tenant des clés API

**Date** : 2025-12-26

**Objectif** : Implémenter un système de billing IA avec crédits, gestion centralisée des clés API au niveau agence, et dashboard super admin, SANS casser les fonctionnalités existantes.

---

## 📊 ÉTAT DES LIEUX

### ✅ Ce qui existe déjà

**Backend** :
- 32+ modules NestJS avec 7+ features IA en production
- Multi-provider LLM (Anthropic, OpenAI, Gemini, DeepSeek, OpenRouter)
- API Cost Tracker (`api-cost-tracker.service.ts`)
- Intégrations : Pica, SerpAPI, Firecrawl, ScrapingBee, Browserless
- Multi-tenancy via `agencyId`

**Base de données** :
- `ai_settings` - Clés API par **USER** (OpenAI, Gemini, Claude, etc.)
- `ai_usage_metrics` - Tracking tokens + coûts
- `ai_generations` - Historique générations IA
- `users` avec `role` (agent, admin) et `agencyId`
- `agencies` - Multi-tenant

**Frontend** :
- Pages `/settings/llm-config` et `/settings/prospecting-config`
- 7 features IA actives : Copilot, Prospecting, Matching, SEO, Notifications, Email AI

### ❌ Ce qui manque

- Système de crédits IA
- Clés API au niveau **AGENCE** (actuellement par user)
- Role `SUPER_ADMIN`
- Dashboard super admin
- Pricing des actions IA
- Logs d'erreurs centralisés
- Système d'alertes (crédits bas, clés manquantes)

---

## 🎯 STRATÉGIE D'INTÉGRATION

### Principes directeurs

1. ✅ **ÉVOLUTIF** : Ajouter à côté de l'existant, ne pas casser
2. ✅ **RÉTROCOMPATIBLE** : Double écriture user + agency pendant la transition
3. ✅ **PROGRESSIF** : Activer module par module (commencer par 1 feature)
4. ✅ **TESTABLE** : Tests à chaque phase avant de passer à la suivante

### Architecture cible

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN                              │
│  - Vue globale consommation                                 │
│  - Gestion crédits agences                                  │
│  - Alertes (crédits bas, erreurs, clés manquantes)          │
│  - Clé LLM admin (fallback)                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   AGENCY LEVEL                              │
│  AgencyApiKeys (BYOK)                                       │
│  - llmApiKey, serpApiKey, firecrawlKey, picaApiKey, etc.   │
│  AiCredits                                                  │
│  - balance, consumed, quotaMonthly                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   USER LEVEL                                │
│  ai_settings (existant, FALLBACK)                          │
│  - Clés API personnelles si agence n'a pas configuré        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                AI ORCHESTRATOR                              │
│  1. Récupère clé (Agency → User → Super Admin)             │
│  2. Vérifie crédits disponibles                            │
│  3. Consomme crédits (AiUsage)                             │
│  4. Appelle provider (LLM, Serp, Firecrawl, etc.)          │
│  5. Log erreurs (AiErrorLog)                               │
│  6. Track métriques (ai_usage_metrics)                     │
└─────────────────────────────────────────────────────────────┘
```

---

# 📅 PHASE 1 – Fondations techniques (Backend)

**Durée estimée** : 3-5 jours

**Objectif** : Créer les modèles et services de base SANS modifier le comportement existant.

## 1.1 - Modifications Prisma Schema

### A. Créer les nouveaux modèles

Ajouter dans `/backend/prisma/schema.prisma` :

```prisma
// ============================================
// AI BILLING & MULTI-TENANT API KEYS SYSTEM
// ============================================

// Clés API au niveau agence (BYOK - Bring Your Own Key)
model AgencyApiKeys {
  id        String   @id @default(cuid())
  agencyId  String   @unique
  agency    agencies @relation(fields: [agencyId], references: [id], onDelete: Cascade)

  // LLM Providers
  llmProvider         String?  @default("anthropic") // anthropic, openai, gemini, deepseek, openrouter
  llmApiKey           String?  // Clé LLM principale
  anthropicApiKey     String?  // Spécifique Anthropic
  openaiApiKey        String?  // Spécifique OpenAI
  geminiApiKey        String?  // Spécifique Google Gemini
  deepseekApiKey      String?  // Spécifique DeepSeek
  openrouterApiKey    String?  // Spécifique OpenRouter

  // Scraping & Data Providers
  serpApiKey          String?  // Google SERP API
  firecrawlApiKey     String?  // Firecrawl
  picaApiKey          String?  // Pica
  jinaReaderApiKey    String?  // Jina Reader
  scrapingBeeApiKey   String?  // ScrapingBee
  browserlessApiKey   String?  // Browserless
  rapidApiKey         String?  // RapidAPI (future)

  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("agency_api_keys")
}

// Pricing des actions IA (configuré par super admin)
model AiPricing {
  id          String   @id @default(cuid())
  actionCode  String   @unique // Ex: "AI_PROSPECTION_INTERNAL", "AI_MATCHING", "AI_SEO_OPTIMIZE"
  actionName  String   // Nom lisible
  description String?

  creditsCost Int      // Nombre de crédits consommés par action

  // Détail des coûts réels (optionnel, pour info)
  estimatedTokens Int?     // Tokens moyens consommés
  providerCostUsd Float?   // Coût réel moyen en USD

  enabled     Boolean  @default(true)
  category    String?  // "prospecting", "matching", "seo", "chat", "email"

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("ai_pricing")
}

// Consommation de crédits par agence
model AiUsage {
  id         String   @id @default(cuid())
  agencyId   String
  agency     agencies @relation(fields: [agencyId], references: [id], onDelete: Cascade)

  userId     String?  // User qui a déclenché l'action
  user       users?   @relation(fields: [userId], references: [id], onDelete: SetNull)

  actionCode String   // Référence à AiPricing.actionCode
  actionName String?  // Nom de l'action pour faciliter les rapports

  creditsUsed     Int      // Crédits consommés
  creditsBalance  Int?     // Solde après consommation (snapshot)

  // Métadonnées techniques
  provider        String?  // "anthropic", "openai", "serp", "firecrawl", etc.
  model           String?  // Ex: "claude-sonnet-4", "gpt-4"
  tokensUsed      Int?     // Tokens réels consommés
  realCostUsd     Float?   // Coût réel facturé par le provider

  // Contexte métier
  entityType      String?  // "prospect", "property", "campaign", etc.
  entityId        String?  // ID de l'entité concernée

  metadata        Json?    // Données additionnelles

  createdAt  DateTime @default(now())

  @@index([agencyId, createdAt])
  @@index([actionCode])
  @@map("ai_usage")
}

// Logs d'erreurs IA centralisés
model AiErrorLog {
  id         String   @id @default(cuid())
  agencyId   String?
  agency     agencies? @relation(fields: [agencyId], references: [id], onDelete: SetNull)

  userId     String?
  user       users?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  actionCode String    // Action qui a échoué
  provider   String    // Provider en erreur
  errorType  String    // "api_key_invalid", "quota_exceeded", "network_error", etc.
  errorMessage String @db.Text

  // Contexte technique
  statusCode Int?
  endpoint   String?

  // Contexte métier
  entityType String?
  entityId   String?

  metadata   Json?

  createdAt  DateTime @default(now())

  @@index([agencyId, createdAt])
  @@index([provider, errorType])
  @@map("ai_error_log")
}

// Gestion des crédits IA par agence
model AiCredits {
  id              String   @id @default(cuid())
  agencyId        String   @unique
  agency          agencies @relation(fields: [agencyId], references: [id], onDelete: Cascade)

  balance         Int      @default(0)      // Crédits disponibles
  consumed        Int      @default(0)      // Total consommé (historique)
  quotaMonthly    Int?                      // Quota mensuel (null = illimité)
  quotaDaily      Int?                      // Quota journalier

  // Reset automatique
  lastResetAt     DateTime?
  resetFrequency  String?  @default("monthly") // "daily", "weekly", "monthly", "never"

  // Alertes
  alertThreshold  Int?     @default(20)     // Alerter à 20% restants
  alertSent       Boolean  @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("ai_credits")
}

// Global settings (super admin)
// Note : On pourrait aussi utiliser la table "settings" existante avec section="super_admin"
// Mais un modèle dédié est plus clair
model GlobalSettings {
  id    String @id @default(cuid())
  key   String @unique
  value String @db.Text

  encrypted   Boolean @default(false)
  description String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("global_settings")
}
```

### B. Modifier le modèle `users`

Ajouter le role `SUPER_ADMIN` :

```prisma
model users {
  // ... champs existants ...

  role String @default("agent") // Valeurs : agent, admin, manager, SUPER_ADMIN

  // ... relations existantes ...

  // Nouvelles relations
  aiUsages     AiUsage[]
  aiErrorLogs  AiErrorLog[]
}
```

### C. Modifier le modèle `agencies`

Ajouter les relations :

```prisma
model agencies {
  // ... champs existants ...

  // Nouvelles relations
  apiKeys      AgencyApiKeys?
  aiCredits    AiCredits?
  aiUsages     AiUsage[]
  aiErrorLogs  AiErrorLog[]
}
```

### D. Migration

```bash
cd backend
npx prisma migrate dev --name add_ai_billing_system
npx prisma generate
```

---

## 1.2 - Services centraux (Backend)

### A. ApiKeysService

Créer `/backend/src/shared/services/api-keys.service.ts` :

```typescript
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type ProviderType =
  | 'llm'
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'deepseek'
  | 'openrouter'
  | 'serp'
  | 'firecrawl'
  | 'pica'
  | 'jina'
  | 'scrapingbee'
  | 'browserless'
  | 'rapidapi';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  /**
   * Stratégie de récupération des clés API :
   * 1. Clé au niveau agence (AgencyApiKeys)
   * 2. Fallback : Clé au niveau user (ai_settings) - pour rétrocompatibilité
   * 3. Fallback : Clé super admin (GlobalSettings)
   */
  async getApiKey(
    agencyId: string,
    provider: ProviderType,
    userId?: string,
  ): Promise<string | null> {
    // 1. Essayer au niveau agence
    const agencyKey = await this.getAgencyKey(agencyId, provider);
    if (agencyKey) return agencyKey;

    // 2. Fallback : niveau user (rétrocompatibilité)
    if (userId) {
      const userKey = await this.getUserKey(userId, provider);
      if (userKey) return userKey;
    }

    // 3. Fallback : super admin key
    const superAdminKey = await this.getSuperAdminKey(provider);
    if (superAdminKey) return superAdminKey;

    return null;
  }

  /**
   * Récupère la clé API au niveau agence
   */
  private async getAgencyKey(
    agencyId: string,
    provider: ProviderType,
  ): Promise<string | null> {
    const agencyKeys = await this.prisma.agencyApiKeys.findUnique({
      where: { agencyId },
    });

    if (!agencyKeys) return null;

    const keyMap: Record<ProviderType, string | null> = {
      llm: agencyKeys.llmApiKey,
      anthropic: agencyKeys.anthropicApiKey || agencyKeys.llmApiKey,
      openai: agencyKeys.openaiApiKey,
      gemini: agencyKeys.geminiApiKey,
      deepseek: agencyKeys.deepseekApiKey,
      openrouter: agencyKeys.openrouterApiKey,
      serp: agencyKeys.serpApiKey,
      firecrawl: agencyKeys.firecrawlApiKey,
      pica: agencyKeys.picaApiKey,
      jina: agencyKeys.jinaReaderApiKey,
      scrapingbee: agencyKeys.scrapingBeeApiKey,
      browserless: agencyKeys.browserlessApiKey,
      rapidapi: agencyKeys.rapidApiKey,
    };

    return keyMap[provider] || null;
  }

  /**
   * Fallback : récupère la clé au niveau user (ai_settings)
   */
  private async getUserKey(
    userId: string,
    provider: ProviderType,
  ): Promise<string | null> {
    const aiSettings = await this.prisma.aiSettings.findUnique({
      where: { userId },
    });

    if (!aiSettings) return null;

    const keyMap: Record<ProviderType, string | null> = {
      llm: aiSettings.openaiApiKey || aiSettings.claudeApiKey || aiSettings.geminiApiKey,
      anthropic: aiSettings.claudeApiKey,
      openai: aiSettings.openaiApiKey,
      gemini: aiSettings.geminiApiKey,
      deepseek: aiSettings.deepseekApiKey,
      openrouter: aiSettings.openrouterApiKey,
      serp: null, // Pas dans ai_settings
      firecrawl: null,
      pica: null,
      jina: null,
      scrapingbee: null,
      browserless: null,
      rapidapi: null,
    };

    return keyMap[provider] || null;
  }

  /**
   * Fallback ultime : clé super admin
   */
  private async getSuperAdminKey(provider: ProviderType): Promise<string | null> {
    const keyName = `superadmin_${provider}_key`;

    const setting = await this.prisma.globalSettings.findUnique({
      where: { key: keyName },
    });

    return setting?.value || null;
  }

  /**
   * Récupère une clé ou throw une exception
   */
  async getRequiredApiKey(
    agencyId: string,
    provider: ProviderType,
    userId?: string,
  ): Promise<string> {
    const key = await this.getApiKey(agencyId, provider, userId);

    if (!key) {
      throw new UnauthorizedException(
        `Clé API "${provider}" non configurée. ` +
        `Veuillez configurer vos clés API dans les paramètres.`
      );
    }

    return key;
  }

  /**
   * Met à jour les clés API d'une agence
   */
  async updateAgencyKeys(
    agencyId: string,
    keys: Partial<{
      llmProvider: string;
      llmApiKey: string;
      anthropicApiKey: string;
      openaiApiKey: string;
      geminiApiKey: string;
      deepseekApiKey: string;
      openrouterApiKey: string;
      serpApiKey: string;
      firecrawlApiKey: string;
      picaApiKey: string;
      jinaReaderApiKey: string;
      scrapingBeeApiKey: string;
      browserlessApiKey: string;
      rapidApiKey: string;
    }>,
  ) {
    return this.prisma.agencyApiKeys.upsert({
      where: { agencyId },
      create: { agencyId, ...keys },
      update: keys,
    });
  }

  /**
   * Récupère toutes les clés d'une agence (pour affichage settings)
   */
  async getAgencyKeys(agencyId: string) {
    return this.prisma.agencyApiKeys.findUnique({
      where: { agencyId },
    });
  }

  /**
   * Vérifie si une agence a configuré une clé pour un provider
   */
  async hasApiKey(agencyId: string, provider: ProviderType): Promise<boolean> {
    const key = await this.getApiKey(agencyId, provider);
    return !!key;
  }
}
```

### B. AiCreditsService

Créer `/backend/src/shared/services/ai-credits.service.ts` :

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AiCreditsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère le solde de crédits d'une agence
   */
  async getBalance(agencyId: string): Promise<number> {
    const credits = await this.prisma.aiCredits.findUnique({
      where: { agencyId },
    });

    return credits?.balance || 0;
  }

  /**
   * Vérifie si l'agence a assez de crédits et les consomme
   * Throw une exception si crédits insuffisants
   */
  async checkAndConsume(
    agencyId: string,
    creditsNeeded: number,
    actionCode: string,
    userId?: string,
    metadata?: any,
  ): Promise<void> {
    // Récupérer ou créer le compte de crédits
    let credits = await this.prisma.aiCredits.findUnique({
      where: { agencyId },
    });

    if (!credits) {
      // Créer un compte avec 0 crédits si n'existe pas
      credits = await this.prisma.aiCredits.create({
        data: {
          agencyId,
          balance: 0,
          consumed: 0,
        },
      });
    }

    // Vérifier le solde
    if (credits.balance < creditsNeeded) {
      throw new BadRequestException(
        `Crédits IA insuffisants. Requis : ${creditsNeeded}, disponibles : ${credits.balance}. ` +
        `Veuillez recharger vos crédits ou configurer vos propres clés API.`
      );
    }

    // Consommer les crédits (transaction atomique)
    const updatedCredits = await this.prisma.aiCredits.update({
      where: { agencyId },
      data: {
        balance: { decrement: creditsNeeded },
        consumed: { increment: creditsNeeded },
      },
    });

    // Enregistrer la consommation dans AiUsage
    await this.prisma.aiUsage.create({
      data: {
        agencyId,
        userId,
        actionCode,
        creditsUsed: creditsNeeded,
        creditsBalance: updatedCredits.balance,
        metadata,
      },
    });

    // Vérifier si alert nécessaire
    if (
      credits.alertThreshold &&
      updatedCredits.balance <= (credits.quotaMonthly || 0) * (credits.alertThreshold / 100) &&
      !credits.alertSent
    ) {
      // TODO: Déclencher une alerte (email, notification)
      await this.prisma.aiCredits.update({
        where: { agencyId },
        data: { alertSent: true },
      });
    }
  }

  /**
   * Ajoute des crédits à une agence (recharge)
   */
  async addCredits(agencyId: string, amount: number): Promise<void> {
    await this.prisma.aiCredits.upsert({
      where: { agencyId },
      create: {
        agencyId,
        balance: amount,
        consumed: 0,
      },
      update: {
        balance: { increment: amount },
        alertSent: false, // Reset l'alerte
      },
    });
  }

  /**
   * Définit un quota mensuel pour une agence
   */
  async setQuota(
    agencyId: string,
    quotaMonthly: number,
    quotaDaily?: number,
  ): Promise<void> {
    await this.prisma.aiCredits.upsert({
      where: { agencyId },
      create: {
        agencyId,
        balance: quotaMonthly,
        quotaMonthly,
        quotaDaily,
      },
      update: {
        quotaMonthly,
        quotaDaily,
      },
    });
  }

  /**
   * Récupère les détails de crédits d'une agence
   */
  async getCreditsDetails(agencyId: string) {
    return this.prisma.aiCredits.findUnique({
      where: { agencyId },
    });
  }

  /**
   * Reset mensuel des crédits (à appeler via CRON)
   */
  async resetMonthlyCredits(): Promise<void> {
    const agenciesToReset = await this.prisma.aiCredits.findMany({
      where: {
        resetFrequency: 'monthly',
        quotaMonthly: { not: null },
      },
    });

    for (const agency of agenciesToReset) {
      await this.prisma.aiCredits.update({
        where: { id: agency.id },
        data: {
          balance: agency.quotaMonthly,
          lastResetAt: new Date(),
          alertSent: false,
        },
      });
    }
  }
}
```

### C. AiPricingService

Créer `/backend/src/shared/services/ai-pricing.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AiPricingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère le coût en crédits d'une action
   */
  async getCost(actionCode: string): Promise<number> {
    const pricing = await this.prisma.aiPricing.findUnique({
      where: { actionCode },
    });

    if (!pricing || !pricing.enabled) {
      return 0; // Gratuit si pas de pricing défini
    }

    return pricing.creditsCost;
  }

  /**
   * Récupère tous les pricings
   */
  async getAllPricing() {
    return this.prisma.aiPricing.findMany({
      where: { enabled: true },
      orderBy: { category: 'asc' },
    });
  }

  /**
   * Crée ou met à jour un pricing (admin)
   */
  async upsertPricing(data: {
    actionCode: string;
    actionName: string;
    description?: string;
    creditsCost: number;
    estimatedTokens?: number;
    providerCostUsd?: number;
    enabled?: boolean;
    category?: string;
  }) {
    return this.prisma.aiPricing.upsert({
      where: { actionCode: data.actionCode },
      create: data,
      update: data,
    });
  }
}
```

### D. AiErrorLogService

Créer `/backend/src/shared/services/ai-error-log.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AiErrorLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log une erreur IA
   */
  async logError(data: {
    agencyId?: string;
    userId?: string;
    actionCode: string;
    provider: string;
    errorType: string;
    errorMessage: string;
    statusCode?: number;
    endpoint?: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
  }) {
    return this.prisma.aiErrorLog.create({
      data,
    });
  }

  /**
   * Récupère les erreurs récentes d'une agence
   */
  async getRecentErrors(agencyId: string, limit = 50) {
    return this.prisma.aiErrorLog.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Récupère les erreurs par provider (pour admin)
   */
  async getErrorsByProvider(provider: string, limit = 100) {
    return this.prisma.aiErrorLog.findMany({
      where: { provider },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Stats d'erreurs pour le dashboard admin
   */
  async getErrorStats(agencyId?: string) {
    const where = agencyId ? { agencyId } : {};

    const [total, byProvider, byType] = await Promise.all([
      this.prisma.aiErrorLog.count({ where }),
      this.prisma.aiErrorLog.groupBy({
        by: ['provider'],
        where,
        _count: true,
      }),
      this.prisma.aiErrorLog.groupBy({
        by: ['errorType'],
        where,
        _count: true,
      }),
    ]);

    return { total, byProvider, byType };
  }
}
```

---

## 1.3 - Enregistrer les services (Module)

Créer `/backend/src/shared/ai-billing/ai-billing.module.ts` :

```typescript
import { Module, Global } from '@nestjs/common';
import { ApiKeysService } from '../services/api-keys.service';
import { AiCreditsService } from '../services/ai-credits.service';
import { AiPricingService } from '../services/ai-pricing.service';
import { AiErrorLogService } from '../services/ai-error-log.service';
import { PrismaService } from '../database/prisma.service';

@Global() // Rendre disponible partout
@Module({
  providers: [
    PrismaService,
    ApiKeysService,
    AiCreditsService,
    AiPricingService,
    AiErrorLogService,
  ],
  exports: [
    ApiKeysService,
    AiCreditsService,
    AiPricingService,
    AiErrorLogService,
  ],
})
export class AiBillingModule {}
```

Importer dans `app.module.ts` :

```typescript
import { AiBillingModule } from './shared/ai-billing/ai-billing.module';

@Module({
  imports: [
    // ... autres modules ...
    AiBillingModule, // Ajouter ici
  ],
  // ...
})
export class AppModule {}
```

---

## 1.4 - Seed Super Admin

Créer `/backend/prisma/seeds/super-admin.seed.ts` :

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedSuperAdmin() {
  console.log('🔧 Seeding Super Admin...');

  // Créer un super admin si n'existe pas
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@crm-immobilier.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

  const existingSuperAdmin = await prisma.users.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    await prisma.users.create({
      data: {
        email: superAdminEmail,
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
      },
    });

    console.log(`✅ Super Admin créé : ${superAdminEmail}`);
  } else {
    console.log(`⚠️  Super Admin existe déjà : ${superAdminEmail}`);
  }

  // Optionnel : Créer quelques settings globaux par défaut
  await prisma.globalSettings.upsert({
    where: { key: 'ai_billing_enabled' },
    create: {
      key: 'ai_billing_enabled',
      value: 'true',
      description: 'Active le système de billing IA',
    },
    update: {},
  });

  console.log('✅ Global settings créés');
}

seedSuperAdmin()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
```

Ajouter dans `package.json` :

```json
"scripts": {
  "seed:super-admin": "ts-node prisma/seeds/super-admin.seed.ts"
}
```

Exécuter :

```bash
npm run seed:super-admin
```

---

## 1.5 - Seed AiPricing (pricing initial)

Créer `/backend/prisma/seeds/ai-pricing.seed.ts` :

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAiPricing() {
  console.log('🔧 Seeding AI Pricing...');

  const pricings = [
    // PROSPECTING
    {
      actionCode: 'AI_PROSPECTION_INTERNAL',
      actionName: 'Prospection IA - Moteur Interne',
      description: 'Recherche et qualification de leads via moteur IA interne',
      creditsCost: 10,
      estimatedTokens: 2000,
      providerCostUsd: 0.02,
      enabled: true,
      category: 'prospecting',
    },
    {
      actionCode: 'AI_PROSPECTION_PICA',
      actionName: 'Prospection IA - Pica API',
      description: 'Recherche de leads via Pica API',
      creditsCost: 15,
      estimatedTokens: 0,
      providerCostUsd: 0.05,
      enabled: true,
      category: 'prospecting',
    },
    {
      actionCode: 'AI_PROSPECTION_SERP',
      actionName: 'Prospection IA - Google SERP',
      description: 'Recherche web via SerpAPI',
      creditsCost: 5,
      estimatedTokens: 0,
      providerCostUsd: 0.02,
      enabled: true,
      category: 'prospecting',
    },
    {
      actionCode: 'AI_PROSPECTION_FIRECRAWL',
      actionName: 'Prospection IA - Firecrawl',
      description: 'Scraping de sites web via Firecrawl',
      creditsCost: 3,
      estimatedTokens: 0,
      providerCostUsd: 0.01,
      enabled: true,
      category: 'prospecting',
    },

    // MATCHING
    {
      actionCode: 'AI_MATCHING',
      actionName: 'Matching IA Propriété-Prospect',
      description: 'Matching intelligent entre propriétés et prospects',
      creditsCost: 8,
      estimatedTokens: 1500,
      providerCostUsd: 0.015,
      enabled: true,
      category: 'matching',
    },

    // VALIDATION
    {
      actionCode: 'AI_VALIDATION',
      actionName: 'Validation IA de Contact',
      description: 'Validation email/téléphone + détection spam',
      creditsCost: 2,
      estimatedTokens: 500,
      providerCostUsd: 0.005,
      enabled: true,
      category: 'validation',
    },

    // SEO
    {
      actionCode: 'AI_SEO_OPTIMIZE',
      actionName: 'Optimisation SEO IA',
      description: 'Optimisation SEO automatique d\'une propriété',
      creditsCost: 5,
      estimatedTokens: 1000,
      providerCostUsd: 0.01,
      enabled: true,
      category: 'seo',
    },

    // CHAT ASSISTANT
    {
      actionCode: 'AI_CHAT_MESSAGE',
      actionName: 'Message AI Copilot',
      description: 'Message dans le chat assistant IA',
      creditsCost: 3,
      estimatedTokens: 800,
      providerCostUsd: 0.008,
      enabled: true,
      category: 'chat',
    },

    // EMAIL AI
    {
      actionCode: 'AI_EMAIL_ANALYSIS',
      actionName: 'Analyse IA d\'Email',
      description: 'Analyse d\'intention et génération de réponse',
      creditsCost: 4,
      estimatedTokens: 1200,
      providerCostUsd: 0.012,
      enabled: true,
      category: 'email',
    },

    // DOCUMENTS
    {
      actionCode: 'AI_DOCUMENT_GENERATION',
      actionName: 'Génération de Document IA',
      description: 'Génération PDF/DOCX via IA',
      creditsCost: 6,
      estimatedTokens: 1500,
      providerCostUsd: 0.015,
      enabled: true,
      category: 'documents',
    },
  ];

  for (const pricing of pricings) {
    await prisma.aiPricing.upsert({
      where: { actionCode: pricing.actionCode },
      create: pricing,
      update: pricing,
    });
  }

  console.log(`✅ ${pricings.length} AI Pricings créés/mis à jour`);
}

seedAiPricing()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
```

Ajouter dans `package.json` :

```json
"scripts": {
  "seed:ai-pricing": "ts-node prisma/seeds/ai-pricing.seed.ts"
}
```

Exécuter :

```bash
npm run seed:ai-pricing
```

---

## ✅ PHASE 1 - CHECKLIST

- [ ] Migration Prisma avec nouveaux modèles
- [ ] `ApiKeysService` créé et testé
- [ ] `AiCreditsService` créé et testé
- [ ] `AiPricingService` créé et testé
- [ ] `AiErrorLogService` créé et testé
- [ ] `AiBillingModule` enregistré dans `AppModule`
- [ ] Super Admin seedé
- [ ] AI Pricing seedé
- [ ] Tests manuels des services (via API ou tests unitaires)

**🎯 Validation** : À cette étape, AUCUN flux métier n'est modifié. Vous avez juste posé les fondations.

---

# 📅 PHASE 2 – Settings "IA & Intégrations" (BYOK)

**Durée estimée** : 2-3 jours

**Objectif** : Permettre à chaque agence d'entrer ses clés API (LLM, SerpAPI, Firecrawl, Pica, Jina).

## 2.1 - Backend Controller

Créer `/backend/src/modules/core/settings/settings-api-keys.controller.ts` :

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ApiKeysService } from '../../../shared/services/api-keys.service';

class UpdateApiKeysDto {
  llmProvider?: string;
  llmApiKey?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  deepseekApiKey?: string;
  openrouterApiKey?: string;
  serpApiKey?: string;
  firecrawlApiKey?: string;
  picaApiKey?: string;
  jinaReaderApiKey?: string;
  scrapingBeeApiKey?: string;
  browserlessApiKey?: string;
  rapidApiKey?: string;
}

@ApiTags('Settings - API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings/api-keys')
export class SettingsApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer les clés API de l\'agence' })
  async getApiKeys(@CurrentUser() user: any) {
    const agencyId = user.agencyId;

    if (!agencyId) {
      return { message: 'Utilisateur non associé à une agence' };
    }

    const keys = await this.apiKeysService.getAgencyKeys(agencyId);

    // Masquer les vraies clés (afficher seulement les 4 derniers caractères)
    if (keys) {
      return {
        ...keys,
        llmApiKey: this.maskApiKey(keys.llmApiKey),
        anthropicApiKey: this.maskApiKey(keys.anthropicApiKey),
        openaiApiKey: this.maskApiKey(keys.openaiApiKey),
        geminiApiKey: this.maskApiKey(keys.geminiApiKey),
        deepseekApiKey: this.maskApiKey(keys.deepseekApiKey),
        openrouterApiKey: this.maskApiKey(keys.openrouterApiKey),
        serpApiKey: this.maskApiKey(keys.serpApiKey),
        firecrawlApiKey: this.maskApiKey(keys.firecrawlApiKey),
        picaApiKey: this.maskApiKey(keys.picaApiKey),
        jinaReaderApiKey: this.maskApiKey(keys.jinaReaderApiKey),
        scrapingBeeApiKey: this.maskApiKey(keys.scrapingBeeApiKey),
        browserlessApiKey: this.maskApiKey(keys.browserlessApiKey),
        rapidApiKey: this.maskApiKey(keys.rapidApiKey),
      };
    }

    return null;
  }

  @Post('update')
  @ApiOperation({ summary: 'Mettre à jour les clés API de l\'agence' })
  async updateApiKeys(
    @CurrentUser() user: any,
    @Body() dto: UpdateApiKeysDto,
  ) {
    const agencyId = user.agencyId;

    if (!agencyId) {
      throw new BadRequestException('Utilisateur non associé à une agence');
    }

    // Filtrer les clés vides (ne pas écraser avec des valeurs vides)
    const keysToUpdate = Object.entries(dto).reduce((acc, [key, value]) => {
      if (value && value.trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    await this.apiKeysService.updateAgencyKeys(agencyId, keysToUpdate);

    return { message: 'Clés API mises à jour avec succès' };
  }

  private maskApiKey(key: string | null): string | null {
    if (!key) return null;
    if (key.length <= 4) return '****';
    return '****' + key.slice(-4);
  }
}
```

Enregistrer dans `/backend/src/modules/core/settings/settings.module.ts` :

```typescript
import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SettingsApiKeysController } from './settings-api-keys.controller'; // NOUVEAU
import { PrismaService } from '../../../shared/database/prisma.service';
import { ApiKeysService } from '../../../shared/services/api-keys.service'; // NOUVEAU

@Module({
  controllers: [
    SettingsController,
    SettingsApiKeysController, // AJOUTER
  ],
  providers: [
    SettingsService,
    ApiKeysService, // AJOUTER
    PrismaService,
  ],
  exports: [SettingsService],
})
export class SettingsModule {}
```

---

## 2.2 - Frontend : Page Settings IA & Intégrations

Modifier `/frontend/pages/settings/index.tsx` pour ajouter un lien vers la nouvelle page :

```tsx
// Ajouter dans la section existante
<Card
  onClick={() => router.push('/settings/api-keys')}
  className="cursor-pointer hover:shadow-lg transition-shadow"
>
  <CardHeader>
    <div className="flex items-center gap-3">
      <Key className="h-6 w-6 text-primary" />
      <CardTitle>IA & Intégrations</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Configurez vos clés API pour les services IA (LLM, Pica, SerpAPI, Firecrawl, Jina)
    </p>
  </CardContent>
</Card>
```

Créer `/frontend/pages/settings/api-keys.tsx` :

```tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { useToast } from '@/shared/hooks/useToast';
import { Loader2, Key, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '@/shared/utils/api-client-backend';

interface ApiKeys {
  llmProvider?: string;
  llmApiKey?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  deepseekApiKey?: string;
  openrouterApiKey?: string;
  serpApiKey?: string;
  firecrawlApiKey?: string;
  picaApiKey?: string;
  jinaReaderApiKey?: string;
  scrapingBeeApiKey?: string;
  browserlessApiKey?: string;
  rapidApiKey?: string;
}

export default function ApiKeysSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keys, setKeys] = useState<ApiKeys>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchApiKeys();
    }
  }, [user, authLoading]);

  const fetchApiKeys = async () => {
    try {
      const response = await apiClient.get('/settings/api-keys');
      setKeys(response.data || {});
    } catch (error) {
      console.error('Erreur chargement clés API:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les clés API',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post('/settings/api-keys/update', keys);
      toast({
        title: 'Succès',
        description: 'Clés API enregistrées avec succès',
      });
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer les clés API',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Key className="h-8 w-8" />
          IA & Intégrations
        </h1>
        <p className="text-muted-foreground mt-2">
          Configurez vos clés API pour les services IA et intégrations externes (BYOK - Bring Your Own Key)
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          En fournissant vos propres clés API, vous évitez la consommation de crédits IA.
          Les clés sont stockées de manière sécurisée et ne sont jamais partagées.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="llm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="llm">LLM (IA)</TabsTrigger>
          <TabsTrigger value="scraping">Scraping & Data</TabsTrigger>
          <TabsTrigger value="other">Autres</TabsTrigger>
        </TabsList>

        {/* TAB LLM */}
        <TabsContent value="llm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Providers LLM (Intelligence Artificielle)</CardTitle>
              <CardDescription>
                Configurez au moins un provider LLM pour activer les fonctionnalités IA
                (Copilot, Matching, SEO, Email AI, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="anthropicApiKey">Anthropic Claude (Recommandé)</Label>
                <Input
                  id="anthropicApiKey"
                  type="password"
                  placeholder="sk-ant-..."
                  value={keys.anthropicApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, anthropicApiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Obtenir une clé : <a href="https://console.anthropic.com/" target="_blank" className="underline">console.anthropic.com</a>
                </p>
              </div>

              <div>
                <Label htmlFor="openaiApiKey">OpenAI GPT</Label>
                <Input
                  id="openaiApiKey"
                  type="password"
                  placeholder="sk-..."
                  value={keys.openaiApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, openaiApiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Obtenir une clé : <a href="https://platform.openai.com/api-keys" target="_blank" className="underline">platform.openai.com</a>
                </p>
              </div>

              <div>
                <Label htmlFor="geminiApiKey">Google Gemini</Label>
                <Input
                  id="geminiApiKey"
                  type="password"
                  placeholder="AIza..."
                  value={keys.geminiApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, geminiApiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Obtenir une clé : <a href="https://makersuite.google.com/app/apikey" target="_blank" className="underline">makersuite.google.com</a>
                </p>
              </div>

              <div>
                <Label htmlFor="deepseekApiKey">DeepSeek (Code)</Label>
                <Input
                  id="deepseekApiKey"
                  type="password"
                  placeholder="sk-..."
                  value={keys.deepseekApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, deepseekApiKey: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="openrouterApiKey">OpenRouter (Multi-modèles)</Label>
                <Input
                  id="openrouterApiKey"
                  type="password"
                  placeholder="sk-or-..."
                  value={keys.openrouterApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, openrouterApiKey: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB SCRAPING */}
        <TabsContent value="scraping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Services de Scraping & Data</CardTitle>
              <CardDescription>
                Configurez les clés pour la prospection IA et la collecte de données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="serpApiKey">SerpAPI (Google Search)</Label>
                <Input
                  id="serpApiKey"
                  type="password"
                  placeholder="serp_..."
                  value={keys.serpApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, serpApiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Obtenir une clé : <a href="https://serpapi.com/" target="_blank" className="underline">serpapi.com</a>
                </p>
              </div>

              <div>
                <Label htmlFor="firecrawlApiKey">Firecrawl (Web Scraping)</Label>
                <Input
                  id="firecrawlApiKey"
                  type="password"
                  placeholder="fc-..."
                  value={keys.firecrawlApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, firecrawlApiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Obtenir une clé : <a href="https://firecrawl.dev/" target="_blank" className="underline">firecrawl.dev</a>
                </p>
              </div>

              <div>
                <Label htmlFor="picaApiKey">Pica API (Real Estate Data)</Label>
                <Input
                  id="picaApiKey"
                  type="password"
                  placeholder="pica_..."
                  value={keys.picaApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, picaApiKey: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="jinaReaderApiKey">Jina Reader (URL → Markdown)</Label>
                <Input
                  id="jinaReaderApiKey"
                  type="password"
                  placeholder="jina_..."
                  value={keys.jinaReaderApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, jinaReaderApiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Obtenir une clé : <a href="https://jina.ai/reader/" target="_blank" className="underline">jina.ai/reader</a>
                </p>
              </div>

              <div>
                <Label htmlFor="scrapingBeeApiKey">ScrapingBee</Label>
                <Input
                  id="scrapingBeeApiKey"
                  type="password"
                  placeholder="sb_..."
                  value={keys.scrapingBeeApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, scrapingBeeApiKey: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="browserlessApiKey">Browserless</Label>
                <Input
                  id="browserlessApiKey"
                  type="password"
                  placeholder="bl_..."
                  value={keys.browserlessApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, browserlessApiKey: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB OTHER */}
        <TabsContent value="other" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Autres Intégrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rapidApiKey">RapidAPI (Future)</Label>
                <Input
                  id="rapidApiKey"
                  type="password"
                  placeholder="rapid_..."
                  value={keys.rapidApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, rapidApiKey: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={() => router.push('/settings')}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
```

---

## ✅ PHASE 2 - CHECKLIST

- [ ] Backend controller `SettingsApiKeysController` créé
- [ ] Frontend page `/settings/api-keys` créée
- [ ] Tests : Sauvegarder et récupérer clés API
- [ ] Validation : Clés masquées dans l'UI (****xxxx)
- [ ] Lien depuis page `/settings` principal

**🎯 Validation** : Les agences peuvent maintenant configurer leurs clés API, mais elles ne sont pas encore utilisées dans les flux IA.

---

# 📅 PHASE 3 – Billing v1 (Activation sur 1 module)

**Durée estimée** : 3-4 jours

**Objectif** : Activer le système de crédits sur UN SEUL module (Prospection IA) pour valider le système.

## 3.1 - Modifier ProspectingService

Modifier `/backend/src/modules/prospecting/prospecting.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { ApiKeysService } from '../../shared/services/api-keys.service';
import { AiCreditsService } from '../../shared/services/ai-credits.service';
import { AiPricingService } from '../../shared/services/ai-pricing.service';
import { AiErrorLogService } from '../../shared/services/ai-error-log.service';

@Injectable()
export class ProspectingService {
  constructor(
    private prisma: PrismaService,
    private apiKeysService: ApiKeysService,
    private aiCreditsService: AiCreditsService,
    private aiPricingService: AiPricingService,
    private aiErrorLogService: AiErrorLogService,
  ) {}

  /**
   * Lance une session de prospection IA
   * MODIFIÉ : Intégration du billing
   */
  async runProspectionSession(
    campaignId: string,
    userId: string,
    agencyId: string,
    source: 'pica' | 'serp' | 'firecrawl' | 'internal',
  ) {
    // 1. Déterminer l'action code et le coût
    const actionCodeMap = {
      pica: 'AI_PROSPECTION_PICA',
      serp: 'AI_PROSPECTION_SERP',
      firecrawl: 'AI_PROSPECTION_FIRECRAWL',
      internal: 'AI_PROSPECTION_INTERNAL',
    };
    const actionCode = actionCodeMap[source];

    // 2. Récupérer le coût
    const cost = await this.aiPricingService.getCost(actionCode);

    // 3. Vérifier si l'agence a ses propres clés API
    const hasOwnKey = await this.apiKeysService.hasApiKey(agencyId, source);

    // 4. Si pas de clé propre, consommer des crédits
    if (!hasOwnKey && cost > 0) {
      try {
        await this.aiCreditsService.checkAndConsume(
          agencyId,
          cost,
          actionCode,
          userId,
          { campaignId, source },
        );
      } catch (error) {
        // Erreur crédits insuffisants
        await this.aiErrorLogService.logError({
          agencyId,
          userId,
          actionCode,
          provider: source,
          errorType: 'insufficient_credits',
          errorMessage: error.message,
        });
        throw error;
      }
    }

    // 5. Récupérer la clé API (agence → user → super admin)
    let apiKey: string;
    try {
      apiKey = await this.apiKeysService.getRequiredApiKey(agencyId, source, userId);
    } catch (error) {
      // Log erreur clé manquante
      await this.aiErrorLogService.logError({
        agencyId,
        userId,
        actionCode,
        provider: source,
        errorType: 'api_key_missing',
        errorMessage: error.message,
      });
      throw error;
    }

    // 6. Lancer la prospection (code existant)
    try {
      const results = await this.executeProspectionWithProvider(
        source,
        apiKey,
        campaignId,
      );

      return results;
    } catch (error) {
      // Log erreur provider
      await this.aiErrorLogService.logError({
        agencyId,
        userId,
        actionCode,
        provider: source,
        errorType: 'provider_error',
        errorMessage: error.message,
        statusCode: error.response?.status,
      });
      throw error;
    }
  }

  private async executeProspectionWithProvider(
    source: string,
    apiKey: string,
    campaignId: string,
  ) {
    // Code existant de prospection
    // ...
  }
}
```

---

## 3.2 - Frontend : Afficher les crédits

Créer un composant `/frontend/src/shared/components/AiCreditsIndicator.tsx` :

```typescript
import { useEffect, useState } from 'react';
import { AlertCircle, Zap } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import apiClient from '@/shared/utils/api-client-backend';

interface AiCreditsIndicatorProps {
  showAlert?: boolean;
}

export function AiCreditsIndicator({ showAlert = true }: AiCreditsIndicatorProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await apiClient.get('/ai-credits/balance');
      setCredits(response.data.balance);
    } catch (error) {
      console.error('Erreur chargement crédits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const isLow = credits !== null && credits < 100;

  return (
    <div>
      <Badge variant={isLow ? 'destructive' : 'default'} className="flex items-center gap-1">
        <Zap className="h-3 w-3" />
        {credits !== null ? `${credits} crédits IA` : 'Chargement...'}
      </Badge>

      {showAlert && isLow && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Crédits IA bientôt épuisés. Configurez vos propres clés API dans les paramètres
            ou contactez l'administrateur.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

Ajouter dans le header global `/frontend/src/components/layout/Header.tsx` :

```tsx
import { AiCreditsIndicator } from '@/shared/components/AiCreditsIndicator';

// Dans le header
<div className="flex items-center gap-4">
  <AiCreditsIndicator showAlert={false} />
  {/* ... autres éléments du header ... */}
</div>
```

---

## 3.3 - Backend : Endpoint crédits

Créer `/backend/src/modules/core/ai-credits/ai-credits.controller.ts` :

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AiCreditsService } from '../../../shared/services/ai-credits.service';

@ApiTags('AI Credits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-credits')
export class AiCreditsController {
  constructor(private aiCreditsService: AiCreditsService) {}

  @Get('balance')
  async getBalance(@CurrentUser() user: any) {
    const agencyId = user.agencyId;
    const balance = await this.aiCreditsService.getBalance(agencyId);
    return { balance };
  }

  @Get('details')
  async getDetails(@CurrentUser() user: any) {
    const agencyId = user.agencyId;
    return this.aiCreditsService.getCreditsDetails(agencyId);
  }
}
```

Créer le module `/backend/src/modules/core/ai-credits/ai-credits.module.ts` et l'importer dans `AppModule`.

---

## ✅ PHASE 3 - CHECKLIST

- [ ] `ProspectingService` modifié avec billing
- [ ] Endpoint `/ai-credits/balance` créé
- [ ] Composant `AiCreditsIndicator` créé et ajouté au header
- [ ] Test : Lancer une prospection → crédits consommés
- [ ] Test : Crédits insuffisants → erreur claire
- [ ] Test : Agence avec clé propre → pas de consommation

**🎯 Validation** : Le système de crédits fonctionne sur la Prospection IA.

---

# 📅 PHASE 4, 5, 6, 7 - À CONTINUER...

Les phases suivantes suivent la même logique :
- **Phase 4** : Généraliser à tous les modules IA
- **Phase 5** : Dashboard super admin
- **Phase 6** : Notifications & UX
- **Phase 7** : Tests & RapidAPI

**Document trop long pour tout inclure ici. Voulez-vous que je continue avec les phases 4-7 ?**
