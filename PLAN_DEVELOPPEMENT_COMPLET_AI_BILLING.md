# 🚀 PLAN DE DÉVELOPPEMENT COMPLET - Système AI Billing Multi-tenant

**Projet** : CRM Immobilier - Système de crédits IA avec gestion USER → AGENCY → SUPER ADMIN

**Architecture choisie** : Option 1 - Hiérarchie flexible

**Date** : 2025-12-26

---

## 📊 ARCHITECTURE GLOBALE

### Hiérarchie

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN                              │
│  - Clés API fallback (tous providers)                      │
│  - Dashboard global (toutes agences + users)                │
│  - Gestion crédits & quotas                                 │
│  - Alertes système                                          │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   USERS INDÉPENDANTS     │   │    USERS EN AGENCE       │
│  (agencyId = null)       │   │   (agencyId != null)     │
├──────────────────────────┤   ├──────────────────────────┤
│ Clés API:                │   │ Clés API (priorité):     │
│  1. ai_settings (user)   │   │  1. ai_settings (user)   │
│  2. Super Admin fallback │   │  2. AgencyApiKeys        │
│                          │   │  3. Super Admin fallback │
├──────────────────────────┤   ├──────────────────────────┤
│ Crédits:                 │   │ Crédits:                 │
│  - UserAiCredits (perso) │   │  - AiCredits (agence)    │
│  - Quota individuel      │   │  - Pool partagé          │
└──────────────────────────┘   └──────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │      AI ORCHESTRATOR          │
            │  - Récupère clé (fallback)    │
            │  - Vérifie crédits            │
            │  - Consomme crédits           │
            │  - Appelle provider           │
            │  - Log erreurs                │
            │  - Track métriques            │
            └───────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │     11 PROVIDERS              │
            │  LLM: Anthropic, OpenAI,      │
            │       Gemini, DeepSeek,       │
            │       OpenRouter              │
            │  Data: SerpAPI, Firecrawl,    │
            │        Pica, Jina,            │
            │        ScrapingBee, RapidAPI  │
            └───────────────────────────────┘
```

### Use Cases couverts

| Type d'utilisateur | Clés API | Crédits | Use Case |
|-------------------|----------|---------|----------|
| **Freelance indépendant** | `ai_settings` (user) | `UserAiCredits` | Agent immobilier freelance avec ses propres outils |
| **Testeur gratuit** | Super Admin keys | `UserAiCredits` (offerts) | Quelqu'un qui teste le CRM |
| **Investisseur** | `ai_settings` (user) | `UserAiCredits` | Investisseur qui gère son portefeuille |
| **Agent (clés perso)** | `ai_settings` (user) | `AiCredits` (agence) | Agent qui préfère ses clés mais pool agence |
| **Agent (clés agence)** | `AgencyApiKeys` | `AiCredits` (agence) | Agent qui utilise les clés fournies par l'agence |
| **Acheteur occasionnel** | Super Admin keys | `UserAiCredits` (offerts) | Particulier qui cherche un bien |

---

## 🎯 STRATÉGIE D'IMPLÉMENTATION

### Principes directeurs

1. ✅ **ÉVOLUTIF** : Ajouter à côté de l'existant, ne rien casser
2. ✅ **RÉTROCOMPATIBLE** : `ai_settings` déjà utilisé, on garde
3. ✅ **PROGRESSIF** : Phase par phase, module par module
4. ✅ **TESTABLE** : Tests à chaque étape
5. ✅ **FLEXIBLE** : Supporte users indépendants ET agences

### Durée estimée totale : 25-35 jours

| Phase | Durée | Description |
|-------|-------|-------------|
| Phase 1 | 3-5 jours | Fondations (modèles, services) |
| Phase 2 | 2-3 jours | Settings BYOK (users + agences) |
| Phase 3 | 3-4 jours | Billing v1 (1 module) |
| Phase 4 | 5-7 jours | Orchestrator (tous modules) |
| Phase 5 | 4-6 jours | Dashboard Super Admin |
| Phase 6 | 2-3 jours | Notifications & UX |
| Phase 7 | 3-4 jours | Tests & RapidAPI |

---

# 📅 PHASE 1 – FONDATIONS BACKEND

**Durée** : 3-5 jours

**Objectif** : Créer les modèles Prisma et services de base SANS modifier les flux existants.

---

## 1.1 - MODIFICATIONS PRISMA SCHEMA

Ouvrir `/backend/prisma/schema.prisma` et ajouter :

### A. Nouveaux modèles

```prisma
// ============================================
// AI BILLING & MULTI-TENANT API KEYS SYSTEM
// ============================================

// ──────────────────────────────────────────
// 1. CLÉS API AU NIVEAU AGENCE (BYOK)
// ──────────────────────────────────────────
model AgencyApiKeys {
  id        String   @id @default(cuid())
  agencyId  String   @unique
  agency    agencies @relation(fields: [agencyId], references: [id], onDelete: Cascade)

  // ── LLM Providers ──
  llmProvider         String?  @default("anthropic") // Provider par défaut
  llmApiKey           String?  // Clé LLM principale (déprécié, utiliser les spécifiques)
  anthropicApiKey     String?
  openaiApiKey        String?
  geminiApiKey        String?
  deepseekApiKey      String?
  openrouterApiKey    String?

  // ── Scraping & Data Providers ──
  serpApiKey          String?  // Google SERP
  firecrawlApiKey     String?  // Firecrawl web scraping
  picaApiKey          String?  // Pica real estate data
  jinaReaderApiKey    String?  // Jina Reader (URL → Markdown)
  scrapingBeeApiKey   String?  // ScrapingBee
  browserlessApiKey   String?  // Browserless headless browser
  rapidApiKey         String?  // RapidAPI (futur)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("agency_api_keys")
}

// ──────────────────────────────────────────
// 2. PRICING DES ACTIONS IA
// ──────────────────────────────────────────
model AiPricing {
  id          String   @id @default(cuid())
  actionCode  String   @unique // Ex: "AI_PROSPECTION_INTERNAL", "AI_MATCHING"
  actionName  String   // Nom lisible
  description String?

  creditsCost Int      // Crédits consommés par action

  // Détails techniques (optionnel)
  estimatedTokens Int?     // Tokens moyens
  providerCostUsd Float?   // Coût réel USD

  enabled     Boolean  @default(true)
  category    String?  // "prospecting", "matching", "seo", "chat", "email"

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("ai_pricing")
}

// ──────────────────────────────────────────
// 3. CONSOMMATION DE CRÉDITS
// ──────────────────────────────────────────
model AiUsage {
  id         String   @id @default(cuid())

  // ── Soit agence, soit user (au moins un des deux) ──
  agencyId   String?
  agency     agencies? @relation(fields: [agencyId], references: [id], onDelete: Cascade)

  userId     String?
  user       users?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  // ── Action ──
  actionCode String
  actionName String?

  // ── Crédits ──
  creditsUsed     Int
  creditsBalance  Int?     // Snapshot du solde après

  // ── Métadonnées techniques ──
  provider        String?  // "anthropic", "serp", etc.
  model           String?
  tokensUsed      Int?
  realCostUsd     Float?

  // ── Contexte métier ──
  entityType      String?  // "prospect", "property", "campaign"
  entityId        String?

  metadata        Json?

  createdAt  DateTime @default(now())

  @@index([agencyId, createdAt])
  @@index([userId, createdAt])
  @@index([actionCode])
  @@map("ai_usage")
}

// ──────────────────────────────────────────
// 4. LOGS D'ERREURS IA
// ──────────────────────────────────────────
model AiErrorLog {
  id         String   @id @default(cuid())

  agencyId   String?
  agency     agencies? @relation(fields: [agencyId], references: [id], onDelete: SetNull)

  userId     String?
  user       users?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  actionCode   String
  provider     String
  errorType    String    // "api_key_invalid", "quota_exceeded", "network_error"
  errorMessage String    @db.Text

  // Contexte technique
  statusCode Int?
  endpoint   String?

  // Contexte métier
  entityType String?
  entityId   String?

  metadata   Json?

  createdAt  DateTime @default(now())

  @@index([agencyId, createdAt])
  @@index([userId, createdAt])
  @@index([provider, errorType])
  @@map("ai_error_log")
}

// ──────────────────────────────────────────
// 5. CRÉDITS AGENCE (pool partagé)
// ──────────────────────────────────────────
model AiCredits {
  id              String   @id @default(cuid())
  agencyId        String   @unique
  agency          agencies @relation(fields: [agencyId], references: [id], onDelete: Cascade)

  balance         Int      @default(0)
  consumed        Int      @default(0)
  quotaMonthly    Int?                      // null = illimité
  quotaDaily      Int?

  // Reset automatique
  lastResetAt     DateTime?
  resetFrequency  String?  @default("monthly") // "daily", "weekly", "monthly", "never"

  // Alertes
  alertThreshold  Int?     @default(20)     // % restants
  alertSent       Boolean  @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("ai_credits")
}

// ──────────────────────────────────────────
// 6. CRÉDITS USER (users indépendants)
// ──────────────────────────────────────────
model UserAiCredits {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            users    @relation(fields: [userId], references: [id], onDelete: Cascade)

  balance         Int      @default(0)
  consumed        Int      @default(0)
  quotaMonthly    Int?
  quotaDaily      Int?

  lastResetAt     DateTime?
  resetFrequency  String?  @default("monthly")

  alertThreshold  Int?     @default(20)
  alertSent       Boolean  @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("user_ai_credits")
}

// ──────────────────────────────────────────
// 7. GLOBAL SETTINGS (Super Admin)
// ──────────────────────────────────────────
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

Ajouter les relations :

```prisma
model users {
  // ... champs existants ...

  role String @default("agent") // agent, admin, manager, SUPER_ADMIN

  // ... relations existantes ...

  // ── Nouvelles relations IA ──
  aiUsages       AiUsage[]
  aiErrorLogs    AiErrorLog[]
  userAiCredits  UserAiCredits?  // Crédits pour users indépendants

  @@map("users")
}
```

### C. Modifier le modèle `agencies`

Ajouter les relations :

```prisma
model agencies {
  // ... champs existants ...

  // ── Nouvelles relations IA ──
  apiKeys      AgencyApiKeys?
  aiCredits    AiCredits?
  aiUsages     AiUsage[]
  aiErrorLogs  AiErrorLog[]

  @@map("agencies")
}
```

### D. Migration

```bash
cd backend
npx prisma migrate dev --name add_ai_billing_system_v1
npx prisma generate
```

---

## 1.2 - SERVICES CENTRAUX

### A. ApiKeysService

Créer `/backend/src/shared/services/api-keys.service.ts` :

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type ProviderType =
  | 'llm'           // LLM générique
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'deepseek'
  | 'openrouter'
  | 'serp'          // Google SERP API
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
   * ═══════════════════════════════════════════════════════════
   * STRATÉGIE DE RÉCUPÉRATION DES CLÉS API
   * ═══════════════════════════════════════════════════════════
   *
   * 1. Clé au niveau USER (ai_settings) - PRIORITÉ 1
   * 2. Clé au niveau AGENCY (AgencyApiKeys) - PRIORITÉ 2 (si user en agence)
   * 3. Clé SUPER ADMIN (GlobalSettings) - FALLBACK ULTIME
   */
  async getApiKey(
    userId: string,
    provider: ProviderType,
    agencyId?: string | null,
  ): Promise<string | null> {
    // 1. User level (TOUJOURS prioritaire)
    const userKey = await this.getUserKey(userId, provider);
    if (userKey) return userKey;

    // 2. Agency level (si user en agence)
    if (agencyId) {
      const agencyKey = await this.getAgencyKey(agencyId, provider);
      if (agencyKey) return agencyKey;
    }

    // 3. Super Admin fallback
    const superAdminKey = await this.getSuperAdminKey(provider);
    if (superAdminKey) return superAdminKey;

    return null;
  }

  /**
   * Récupère la clé au niveau USER (ai_settings)
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
      // Pas de scraping keys dans ai_settings
      serp: null,
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
   * Récupère la clé au niveau AGENCY (AgencyApiKeys)
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
   * Fallback : clé SUPER ADMIN
   */
  private async getSuperAdminKey(provider: ProviderType): Promise<string | null> {
    const keyName = `superadmin_${provider}_key`;

    const setting = await this.prisma.globalSettings.findUnique({
      where: { key: keyName },
    });

    return setting?.value || null;
  }

  /**
   * Récupère une clé ou throw exception
   */
  async getRequiredApiKey(
    userId: string,
    provider: ProviderType,
    agencyId?: string | null,
  ): Promise<string> {
    const key = await this.getApiKey(userId, provider, agencyId);

    if (!key) {
      throw new UnauthorizedException(
        `Clé API "${provider}" non configurée. ` +
        `Veuillez configurer vos clés API dans les paramètres ou contactez l'administrateur.`
      );
    }

    return key;
  }

  /**
   * Vérifie si une clé existe (user OU agency)
   */
  async hasApiKey(
    userId: string,
    provider: ProviderType,
    agencyId?: string | null,
  ): Promise<boolean> {
    const key = await this.getApiKey(userId, provider, agencyId);
    return !!key;
  }

  /**
   * Met à jour les clés API d'une AGENCE
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
   * Récupère toutes les clés d'une agence
   */
  async getAgencyKeys(agencyId: string) {
    return this.prisma.agencyApiKeys.findUnique({
      where: { agencyId },
    });
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
   * ═══════════════════════════════════════════════════════════
   * RÉCUPÉRATION DU SOLDE
   * ═══════════════════════════════════════════════════════════
   *
   * - Si user en agence → solde AGENCE
   * - Si user indépendant → solde USER
   */
  async getBalance(userId: string, agencyId?: string | null): Promise<number> {
    if (agencyId) {
      // Pool agence
      const credits = await this.prisma.aiCredits.findUnique({
        where: { agencyId },
      });
      return credits?.balance || 0;
    } else {
      // Crédits user
      const credits = await this.prisma.userAiCredits.findUnique({
        where: { userId },
      });
      return credits?.balance || 0;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * VÉRIFIER ET CONSOMMER LES CRÉDITS
   * ═══════════════════════════════════════════════════════════
   */
  async checkAndConsume(
    userId: string,
    agencyId: string | null,
    creditsNeeded: number,
    actionCode: string,
    metadata?: any,
  ): Promise<void> {
    if (agencyId) {
      await this.consumeAgencyCredits(agencyId, userId, creditsNeeded, actionCode, metadata);
    } else {
      await this.consumeUserCredits(userId, creditsNeeded, actionCode, metadata);
    }
  }

  /**
   * Consomme les crédits AGENCE
   */
  private async consumeAgencyCredits(
    agencyId: string,
    userId: string,
    creditsNeeded: number,
    actionCode: string,
    metadata?: any,
  ): Promise<void> {
    let credits = await this.prisma.aiCredits.findUnique({
      where: { agencyId },
    });

    if (!credits) {
      credits = await this.prisma.aiCredits.create({
        data: { agencyId, balance: 0, consumed: 0 },
      });
    }

    if (credits.balance < creditsNeeded) {
      throw new BadRequestException(
        `Crédits IA insuffisants (agence). Requis: ${creditsNeeded}, disponibles: ${credits.balance}. ` +
        `Configurez vos clés API ou contactez l'administrateur.`
      );
    }

    const updatedCredits = await this.prisma.aiCredits.update({
      where: { agencyId },
      data: {
        balance: { decrement: creditsNeeded },
        consumed: { increment: creditsNeeded },
      },
    });

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

    await this.checkAlertThreshold(agencyId, updatedCredits.balance, credits);
  }

  /**
   * Consomme les crédits USER
   */
  private async consumeUserCredits(
    userId: string,
    creditsNeeded: number,
    actionCode: string,
    metadata?: any,
  ): Promise<void> {
    let credits = await this.prisma.userAiCredits.findUnique({
      where: { userId },
    });

    if (!credits) {
      credits = await this.prisma.userAiCredits.create({
        data: { userId, balance: 0, consumed: 0 },
      });
    }

    if (credits.balance < creditsNeeded) {
      throw new BadRequestException(
        `Crédits IA insuffisants. Requis: ${creditsNeeded}, disponibles: ${credits.balance}. ` +
        `Configurez vos clés API dans les paramètres.`
      );
    }

    const updatedCredits = await this.prisma.userAiCredits.update({
      where: { userId },
      data: {
        balance: { decrement: creditsNeeded },
        consumed: { increment: creditsNeeded },
      },
    });

    await this.prisma.aiUsage.create({
      data: {
        userId,
        actionCode,
        creditsUsed: creditsNeeded,
        creditsBalance: updatedCredits.balance,
        metadata,
      },
    });

    await this.checkUserAlertThreshold(userId, updatedCredits.balance, credits);
  }

  /**
   * Vérifie si alerte nécessaire (agence)
   */
  private async checkAlertThreshold(
    agencyId: string,
    balance: number,
    credits: any,
  ): Promise<void> {
    if (
      credits.alertThreshold &&
      credits.quotaMonthly &&
      balance <= (credits.quotaMonthly * credits.alertThreshold) / 100 &&
      !credits.alertSent
    ) {
      await this.prisma.aiCredits.update({
        where: { agencyId },
        data: { alertSent: true },
      });
      // TODO: Déclencher notification
    }
  }

  /**
   * Vérifie si alerte nécessaire (user)
   */
  private async checkUserAlertThreshold(
    userId: string,
    balance: number,
    credits: any,
  ): Promise<void> {
    if (
      credits.alertThreshold &&
      credits.quotaMonthly &&
      balance <= (credits.quotaMonthly * credits.alertThreshold) / 100 &&
      !credits.alertSent
    ) {
      await this.prisma.userAiCredits.update({
        where: { userId },
        data: { alertSent: true },
      });
      // TODO: Déclencher notification
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * AJOUTER DES CRÉDITS
   * ═══════════════════════════════════════════════════════════
   */
  async addCreditsToAgency(agencyId: string, amount: number): Promise<void> {
    await this.prisma.aiCredits.upsert({
      where: { agencyId },
      create: { agencyId, balance: amount, consumed: 0 },
      update: {
        balance: { increment: amount },
        alertSent: false,
      },
    });
  }

  async addCreditsToUser(userId: string, amount: number): Promise<void> {
    await this.prisma.userAiCredits.upsert({
      where: { userId },
      create: { userId, balance: amount, consumed: 0 },
      update: {
        balance: { increment: amount },
        alertSent: false,
      },
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * QUOTAS
   * ═══════════════════════════════════════════════════════════
   */
  async setAgencyQuota(
    agencyId: string,
    quotaMonthly: number,
    quotaDaily?: number,
  ): Promise<void> {
    await this.prisma.aiCredits.upsert({
      where: { agencyId },
      create: { agencyId, balance: quotaMonthly, quotaMonthly, quotaDaily },
      update: { quotaMonthly, quotaDaily },
    });
  }

  async setUserQuota(
    userId: string,
    quotaMonthly: number,
    quotaDaily?: number,
  ): Promise<void> {
    await this.prisma.userAiCredits.upsert({
      where: { userId },
      create: { userId, balance: quotaMonthly, quotaMonthly, quotaDaily },
      update: { quotaMonthly, quotaDaily },
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * DÉTAILS
   * ═══════════════════════════════════════════════════════════
   */
  async getCreditsDetails(userId: string, agencyId?: string | null) {
    if (agencyId) {
      return this.prisma.aiCredits.findUnique({ where: { agencyId } });
    } else {
      return this.prisma.userAiCredits.findUnique({ where: { userId } });
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * RESET MENSUEL (CRON)
   * ═══════════════════════════════════════════════════════════
   */
  async resetMonthlyCredits(): Promise<void> {
    // Agences
    const agencies = await this.prisma.aiCredits.findMany({
      where: {
        resetFrequency: 'monthly',
        quotaMonthly: { not: null },
      },
    });

    for (const agency of agencies) {
      await this.prisma.aiCredits.update({
        where: { id: agency.id },
        data: {
          balance: agency.quotaMonthly,
          lastResetAt: new Date(),
          alertSent: false,
        },
      });
    }

    // Users
    const users = await this.prisma.userAiCredits.findMany({
      where: {
        resetFrequency: 'monthly',
        quotaMonthly: { not: null },
      },
    });

    for (const user of users) {
      await this.prisma.userAiCredits.update({
        where: { id: user.id },
        data: {
          balance: user.quotaMonthly,
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

  async getCost(actionCode: string): Promise<number> {
    const pricing = await this.prisma.aiPricing.findUnique({
      where: { actionCode },
    });

    if (!pricing || !pricing.enabled) {
      return 0;
    }

    return pricing.creditsCost;
  }

  async getAllPricing() {
    return this.prisma.aiPricing.findMany({
      where: { enabled: true },
      orderBy: { category: 'asc' },
    });
  }

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

  async logError(data: {
    agencyId?: string | null;
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
    return this.prisma.aiErrorLog.create({ data });
  }

  async getRecentErrors(userId?: string, agencyId?: string, limit = 50) {
    return this.prisma.aiErrorLog.findMany({
      where: {
        ...(userId && { userId }),
        ...(agencyId && { agencyId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getErrorsByProvider(provider: string, limit = 100) {
    return this.prisma.aiErrorLog.findMany({
      where: { provider },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getErrorStats(agencyId?: string, userId?: string) {
    const where: any = {};
    if (agencyId) where.agencyId = agencyId;
    if (userId) where.userId = userId;

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

## 1.3 - ENREGISTRER LES SERVICES (MODULE)

Créer `/backend/src/shared/ai-billing/ai-billing.module.ts` :

```typescript
import { Module, Global } from '@nestjs/common';
import { ApiKeysService } from '../services/api-keys.service';
import { AiCreditsService } from '../services/ai-credits.service';
import { AiPricingService } from '../services/ai-pricing.service';
import { AiErrorLogService } from '../services/ai-error-log.service';
import { PrismaService } from '../database/prisma.service';

@Global()
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

Importer dans `/backend/src/app.module.ts` :

```typescript
import { AiBillingModule } from './shared/ai-billing/ai-billing.module';

@Module({
  imports: [
    // ... autres modules ...
    AiBillingModule, // AJOUTER
  ],
})
export class AppModule {}
```

---

## 1.4 - SEED SUPER ADMIN

Créer `/backend/prisma/seeds/super-admin.seed.ts` :

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedSuperAdmin() {
  console.log('🔧 Seeding Super Admin...');

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@crm-immobilier.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

  const existing = await prisma.users.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existing) {
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

    console.log(`✅ Super Admin créé: ${superAdminEmail}`);
  } else {
    console.log(`⚠️  Super Admin existe: ${superAdminEmail}`);
  }

  // Global settings
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

## 1.5 - SEED AI PRICING

Créer `/backend/prisma/seeds/ai-pricing.seed.ts` :

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAiPricing() {
  console.log('🔧 Seeding AI Pricing...');

  const pricings = [
    // ══ PROSPECTING ══
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

    // ══ MATCHING ══
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

    // ══ VALIDATION ══
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

    // ══ SEO ══
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

    // ══ CHAT ══
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

    // ══ EMAIL ══
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

    // ══ DOCUMENTS ══
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

  console.log(`✅ ${pricings.length} AI Pricings créés`);
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

- [ ] Migration Prisma avec 7 nouveaux modèles
- [ ] `ApiKeysService` créé (fallback user → agency → super admin)
- [ ] `AiCreditsService` créé (gère user ET agency)
- [ ] `AiPricingService` créé
- [ ] `AiErrorLogService` créé
- [ ] `AiBillingModule` enregistré dans `AppModule`
- [ ] Super Admin seedé
- [ ] AI Pricing seedé (10 actions)
- [ ] Tests manuels des services

**🎯 Validation** : AUCUN flux métier modifié, seulement les fondations.

---

# 📅 PHASE 2 – SETTINGS "IA & INTÉGRATIONS" (BYOK)

**Durée** : 2-3 jours

**Objectif** : Pages de configuration des clés API pour USERS et AGENCES.

---

## 2.1 - BACKEND CONTROLLERS

### A. Settings API Keys (User Level)

La page `/settings/llm-config` existe déjà et utilise `ai_settings`. On la garde telle quelle.

### B. Settings API Keys (Agency Level)

Créer `/backend/src/modules/core/settings/settings-agency-keys.controller.ts` :

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ApiKeysService } from '../../../shared/services/api-keys.service';

class UpdateAgencyApiKeysDto {
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

@ApiTags('Settings - Agency API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings/agency-keys')
export class SettingsAgencyKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer les clés API de l\'agence' })
  async getAgencyKeys(@CurrentUser() user: any) {
    const agencyId = user.agencyId;

    if (!agencyId) {
      return { message: 'Utilisateur non associé à une agence' };
    }

    const keys = await this.apiKeysService.getAgencyKeys(agencyId);

    if (keys) {
      return {
        ...keys,
        // Masquer les vraies clés
        llmApiKey: this.mask(keys.llmApiKey),
        anthropicApiKey: this.mask(keys.anthropicApiKey),
        openaiApiKey: this.mask(keys.openaiApiKey),
        geminiApiKey: this.mask(keys.geminiApiKey),
        deepseekApiKey: this.mask(keys.deepseekApiKey),
        openrouterApiKey: this.mask(keys.openrouterApiKey),
        serpApiKey: this.mask(keys.serpApiKey),
        firecrawlApiKey: this.mask(keys.firecrawlApiKey),
        picaApiKey: this.mask(keys.picaApiKey),
        jinaReaderApiKey: this.mask(keys.jinaReaderApiKey),
        scrapingBeeApiKey: this.mask(keys.scrapingBeeApiKey),
        browserlessApiKey: this.mask(keys.browserlessApiKey),
        rapidApiKey: this.mask(keys.rapidApiKey),
      };
    }

    return null;
  }

  @Post('update')
  @ApiOperation({ summary: 'Mettre à jour les clés API de l\'agence' })
  async updateAgencyKeys(
    @CurrentUser() user: any,
    @Body() dto: UpdateAgencyApiKeysDto,
  ) {
    const agencyId = user.agencyId;

    if (!agencyId) {
      throw new BadRequestException('Utilisateur non associé à une agence');
    }

    // Vérifier que user a le droit (admin agence)
    if (user.role !== 'admin' && user.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Seuls les admins peuvent modifier les clés agence');
    }

    const keysToUpdate = Object.entries(dto).reduce((acc, [key, value]) => {
      if (value && value.trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    await this.apiKeysService.updateAgencyKeys(agencyId, keysToUpdate);

    return { message: 'Clés API agence mises à jour' };
  }

  private mask(key: string | null): string | null {
    if (!key) return null;
    if (key.length <= 4) return '****';
    return '****' + key.slice(-4);
  }
}
```

Enregistrer dans `/backend/src/modules/core/settings/settings.module.ts` :

```typescript
import { SettingsAgencyKeysController } from './settings-agency-keys.controller';

@Module({
  controllers: [
    SettingsController,
    SettingsAgencyKeysController, // AJOUTER
  ],
  // ...
})
export class SettingsModule {}
```

### C. Endpoint Crédits

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
    const balance = await this.aiCreditsService.getBalance(user.id, user.agencyId);
    return { balance };
  }

  @Get('details')
  async getDetails(@CurrentUser() user: any) {
    return this.aiCreditsService.getCreditsDetails(user.id, user.agencyId);
  }
}
```

Créer `/backend/src/modules/core/ai-credits/ai-credits.module.ts` et l'importer dans `AppModule`.

---

## 2.2 - FRONTEND

### A. Page Settings - API Keys (User Level)

Modifier `/frontend/pages/settings/index.tsx` pour ajouter un lien :

```tsx
import { Key } from 'lucide-react';

// Ajouter dans la section existante
<Card
  onClick={() => router.push('/settings/api-keys')}
  className="cursor-pointer hover:shadow-lg transition-shadow"
>
  <CardHeader>
    <div className="flex items-center gap-3">
      <Key className="h-6 w-6 text-primary" />
      <CardTitle>Mes Clés API Personnelles</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Configurez vos clés API personnelles pour ne pas consommer de crédits
    </p>
  </CardContent>
</Card>

{user?.agencyId && (user?.role === 'admin' || user?.role === 'SUPER_ADMIN') && (
  <Card
    onClick={() => router.push('/settings/agency-keys')}
    className="cursor-pointer hover:shadow-lg transition-shadow"
  >
    <CardHeader>
      <div className="flex items-center gap-3">
        <Key className="h-6 w-6 text-primary" />
        <CardTitle>Clés API Agence</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        Configurez les clés API partagées pour toute l'agence (admin uniquement)
      </p>
    </CardContent>
  </Card>
)}
```

### B. Page Clés API Personnelles

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
import { Loader2, Key, AlertCircle, Info } from 'lucide-react';
import apiClient from '@/shared/utils/api-client-backend';

export default function ApiKeysPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keys, setKeys] = useState<any>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchKeys();
    }
  }, [user, authLoading]);

  const fetchKeys = async () => {
    try {
      // Récupérer depuis ai_settings (endpoint existant)
      const response = await apiClient.get('/llm-config');
      setKeys(response.data || {});
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Sauvegarder dans ai_settings (endpoint existant)
      await apiClient.post('/llm-config', keys);
      toast({
        title: 'Succès',
        description: 'Vos clés API ont été enregistrées',
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer les clés',
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
          Mes Clés API Personnelles
        </h1>
        <p className="text-muted-foreground mt-2">
          Configurez vos propres clés API pour éviter de consommer des crédits IA
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Priorité des clés</strong> : Vos clés personnelles sont TOUJOURS utilisées en priorité.
          {user?.agencyId && ' Si vous n\'avez pas de clé, les clés de l\'agence seront utilisées.'}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="llm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="llm">LLM (IA)</TabsTrigger>
          <TabsTrigger value="scraping">Scraping & Data</TabsTrigger>
        </TabsList>

        {/* LLM */}
        <TabsContent value="llm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Providers LLM</CardTitle>
              <CardDescription>
                Configurez au moins un provider pour utiliser les fonctionnalités IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="claudeApiKey">Anthropic Claude (Recommandé)</Label>
                <Input
                  id="claudeApiKey"
                  type="password"
                  placeholder="sk-ant-..."
                  value={keys.claudeApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, claudeApiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  <a href="https://console.anthropic.com/" target="_blank" className="underline">
                    Obtenir une clé
                  </a>
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
              </div>

              <div>
                <Label htmlFor="deepseekApiKey">DeepSeek</Label>
                <Input
                  id="deepseekApiKey"
                  type="password"
                  placeholder="sk-..."
                  value={keys.deepseekApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, deepseekApiKey: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="openrouterApiKey">OpenRouter</Label>
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

        {/* SCRAPING */}
        <TabsContent value="scraping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Services de Scraping</CardTitle>
              <CardDescription>
                Pour la prospection IA et la collecte de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Les clés de scraping ne sont pas stockées dans ai_settings actuellement.
                  Elles doivent être configurées au niveau agence.
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                {user?.agencyId
                  ? 'Demandez à votre administrateur de configurer les clés agence.'
                  : 'Créez ou rejoignez une agence pour utiliser ces services.'}
              </p>
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

### C. Page Clés API Agence

Créer `/frontend/pages/settings/agency-keys.tsx` :

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
import { Loader2, Key, AlertCircle, Info } from 'lucide-react';
import apiClient from '@/shared/utils/api-client-backend';

export default function AgencyKeysPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keys, setKeys] = useState<any>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      if (!user.agencyId) {
        toast({
          title: 'Accès refusé',
          description: 'Vous n\'êtes pas associé à une agence',
          variant: 'destructive',
        });
        router.push('/settings');
        return;
      }
      if (user.role !== 'admin' && user.role !== 'SUPER_ADMIN') {
        toast({
          title: 'Accès refusé',
          description: 'Réservé aux administrateurs',
          variant: 'destructive',
        });
        router.push('/settings');
        return;
      }
      fetchKeys();
    }
  }, [user, authLoading]);

  const fetchKeys = async () => {
    try {
      const response = await apiClient.get('/settings/agency-keys');
      setKeys(response.data || {});
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post('/settings/agency-keys/update', keys);
      toast({
        title: 'Succès',
        description: 'Clés API agence enregistrées',
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer',
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
          Clés API Agence
        </h1>
        <p className="text-muted-foreground mt-2">
          Configurez les clés API partagées pour tous les membres de l'agence
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Priorité</strong> : Les clés personnelles des utilisateurs sont utilisées en priorité.
          Ces clés agence servent de fallback.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="llm">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="llm">LLM</TabsTrigger>
          <TabsTrigger value="scraping">Scraping</TabsTrigger>
          <TabsTrigger value="other">Autres</TabsTrigger>
        </TabsList>

        {/* LLM */}
        <TabsContent value="llm">
          <Card>
            <CardHeader>
              <CardTitle>Providers LLM</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Même formulaire que api-keys.tsx */}
              <div>
                <Label>Anthropic Claude</Label>
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  value={keys.anthropicApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, anthropicApiKey: e.target.value })}
                />
              </div>
              {/* ... autres providers ... */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SCRAPING */}
        <TabsContent value="scraping">
          <Card>
            <CardHeader>
              <CardTitle>Services de Scraping & Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SerpAPI</Label>
                <Input
                  type="password"
                  value={keys.serpApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, serpApiKey: e.target.value })}
                />
              </div>
              <div>
                <Label>Firecrawl</Label>
                <Input
                  type="password"
                  value={keys.firecrawlApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, firecrawlApiKey: e.target.value })}
                />
              </div>
              <div>
                <Label>Pica API</Label>
                <Input
                  type="password"
                  value={keys.picaApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, picaApiKey: e.target.value })}
                />
              </div>
              <div>
                <Label>Jina Reader</Label>
                <Input
                  type="password"
                  value={keys.jinaReaderApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, jinaReaderApiKey: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OTHER */}
        <TabsContent value="other">
          <Card>
            <CardHeader>
              <CardTitle>Autres Intégrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>RapidAPI (Future)</Label>
                <Input
                  type="password"
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

### D. Composant Indicateur Crédits

Créer `/frontend/src/shared/components/AiCreditsIndicator.tsx` :

```tsx
import { useEffect, useState } from 'react';
import { AlertCircle, Zap } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import Link from 'next/link';
import apiClient from '@/shared/utils/api-client-backend';

interface AiCreditsIndicatorProps {
  showAlert?: boolean;
  threshold?: number;
}

export function AiCreditsIndicator({ showAlert = true, threshold = 100 }: AiCreditsIndicatorProps) {
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

  const isLow = credits !== null && credits < threshold;
  const isCritical = credits !== null && credits < 20;

  return (
    <div>
      <Badge variant={isCritical ? 'destructive' : isLow ? 'secondary' : 'default'} className="flex items-center gap-1">
        <Zap className="h-3 w-3" />
        {credits !== null ? `${credits} crédits IA` : 'Chargement...'}
      </Badge>

      {showAlert && isLow && (
        <Alert variant={isCritical ? 'destructive' : 'default'} className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isCritical
              ? 'Crédits IA épuisés ! '
              : 'Crédits IA bientôt épuisés. '}
            Configurez vos clés API pour éviter les interruptions.{' '}
            <Link href="/settings/api-keys" className="underline">
              Configurer maintenant
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

Ajouter dans le header `/frontend/src/components/layout/Header.tsx` :

```tsx
import { AiCreditsIndicator } from '@/shared/components/AiCreditsIndicator';

// Dans le header
<div className="flex items-center gap-4">
  <AiCreditsIndicator showAlert={false} />
  {/* ... autres éléments ... */}
</div>
```

---

## ✅ PHASE 2 - CHECKLIST

- [ ] Backend controller `SettingsAgencyKeysController` créé
- [ ] Backend controller `AiCreditsController` créé
- [ ] Frontend page `/settings/api-keys` (user) créée
- [ ] Frontend page `/settings/agency-keys` (agency, admin only) créée
- [ ] Composant `AiCreditsIndicator` créé et ajouté au header
- [ ] Tests : User indépendant peut configurer ses clés
- [ ] Tests : Admin agence peut configurer clés agence
- [ ] Tests : Clés masquées dans l'UI

---

# 📅 PHASE 3 – BILLING v1 (Activation sur 1 module)

**Durée** : 3-4 jours

**Objectif** : Activer le système de crédits sur la **Prospection IA** uniquement.

Comme le document est très long, je vais créer un fichier séparé pour les Phases 3-7.

Voulez-vous que je continue dans ce fichier ou créer un second fichier pour les phases 3-7 ?
