# 🚀 PLAN DE DÉVELOPPEMENT - PHASES 3 à 7

**Suite du document** : `PLAN_DEVELOPPEMENT_COMPLET_AI_BILLING.md`

---

# 📅 PHASE 3 – BILLING v1 (Activation sur 1 module)

**Durée** : 3-4 jours

**Objectif** : Activer le système de crédits sur UN SEUL module (Prospection IA) pour valider.

---

## 3.1 - MODIFIER PROSPECTING SERVICE

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
   * INTÉGRATION BILLING
   */
  async runProspectionSession(
    campaignId: string,
    userId: string,
    agencyId: string | null,
    source: 'pica' | 'serp' | 'firecrawl' | 'internal',
  ) {
    // 1. Déterminer l'action code
    const actionCodeMap = {
      pica: 'AI_PROSPECTION_PICA',
      serp: 'AI_PROSPECTION_SERP',
      firecrawl: 'AI_PROSPECTION_FIRECRAWL',
      internal: 'AI_PROSPECTION_INTERNAL',
    };
    const actionCode = actionCodeMap[source];

    // 2. Récupérer le coût
    const cost = await this.aiPricingService.getCost(actionCode);

    // 3. Vérifier si l'utilisateur a ses propres clés API
    const hasOwnKey = await this.apiKeysService.hasApiKey(userId, source, agencyId);

    // 4. Si pas de clé propre ET coût > 0 → consommer crédits
    if (!hasOwnKey && cost > 0) {
      try {
        await this.aiCreditsService.checkAndConsume(
          userId,
          agencyId,
          cost,
          actionCode,
          { campaignId, source },
        );
      } catch (error) {
        // Log erreur crédits insuffisants
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

    // 5. Récupérer la clé API (user → agency → super admin)
    let apiKey: string;
    try {
      apiKey = await this.apiKeysService.getRequiredApiKey(userId, source, agencyId);
    } catch (error) {
      // Log clé manquante
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

    // 6. Lancer la prospection
    try {
      const results = await this.executeProspectionWithProvider(
        source,
        apiKey,
        campaignId,
      );

      // Log succès dans ai_usage_metrics (existant)
      await this.prisma.aiUsageMetrics.create({
        data: {
          userId,
          provider: source,
          model: source,
          tokensUsed: results.tokensUsed || 0,
          cost: results.cost || 0,
          requestType: actionCode,
        },
      });

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
    // Retourner { tokensUsed, cost, results }
    return { tokensUsed: 0, cost: 0, results: [] };
  }
}
```

---

## 3.2 - FRONTEND : Afficher coût et crédits

Modifier `/frontend/src/modules/business/prospecting/components/ProspectingDashboard.tsx` :

```tsx
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { AlertCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/shared/utils/api-client-backend';

export function ProspectingDashboard() {
  const [engine, setEngine] = useState<'internal' | 'pica' | 'serp' | 'firecrawl'>('internal');
  const [hasOwnKeys, setHasOwnKeys] = useState({
    pica: false,
    serp: false,
    firecrawl: false,
  });
  const [pricing, setPricing] = useState<any>({});
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    checkApiKeys();
    fetchPricing();
    fetchCredits();
  }, []);

  const checkApiKeys = async () => {
    try {
      const [userKeys, agencyKeys] = await Promise.all([
        apiClient.get('/llm-config'), // Clés user (ai_settings)
        user?.agencyId ? apiClient.get('/settings/agency-keys') : Promise.resolve({ data: null }),
      ]);

      setHasOwnKeys({
        pica: !!(userKeys.data?.picaApiKey || agencyKeys.data?.picaApiKey),
        serp: !!(userKeys.data?.serpApiKey || agencyKeys.data?.serpApiKey),
        firecrawl: !!(userKeys.data?.firecrawlApiKey || agencyKeys.data?.firecrawlApiKey),
      });
    } catch (error) {
      console.error('Erreur vérification clés:', error);
    }
  };

  const fetchPricing = async () => {
    try {
      const response = await apiClient.get('/ai-pricing');
      const pricingMap = {};
      response.data.forEach((p: any) => {
        pricingMap[p.actionCode] = p.creditsCost;
      });
      setPricing(pricingMap);
    } catch (error) {
      console.error('Erreur pricing:', error);
    }
  };

  const fetchCredits = async () => {
    try {
      const response = await apiClient.get('/ai-credits/balance');
      setCredits(response.data.balance);
    } catch (error) {
      console.error('Erreur crédits:', error);
    }
  };

  const getEngineCost = (engineType: string) => {
    const codeMap = {
      internal: 'AI_PROSPECTION_INTERNAL',
      pica: 'AI_PROSPECTION_PICA',
      serp: 'AI_PROSPECTION_SERP',
      firecrawl: 'AI_PROSPECTION_FIRECRAWL',
    };
    return pricing[codeMap[engineType]] || 0;
  };

  const currentCost = getEngineCost(engine);
  const hasKey = hasOwnKeys[engine] || engine === 'internal';
  const willConsumeCredits = !hasKey && currentCost > 0;

  return (
    <div className="space-y-6">
      {/* SÉLECTEUR MOTEUR */}
      <Card>
        <CardHeader>
          <CardTitle>Moteur de Prospection</CardTitle>
          <CardDescription>
            Choisissez le moteur à utiliser pour la prospection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={engine} onValueChange={(v) => setEngine(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">
                <div className="flex items-center justify-between w-full">
                  <span>Moteur Interne (LLM)</span>
                  <Badge variant="outline" className="ml-2">
                    {getEngineCost('internal')} crédits
                  </Badge>
                </div>
              </SelectItem>

              <SelectItem value="pica" disabled={!hasOwnKeys.pica && credits < getEngineCost('pica')}>
                <div className="flex items-center justify-between w-full">
                  <span>Pica API</span>
                  <Badge variant={hasOwnKeys.pica ? 'default' : 'destructive'} className="ml-2">
                    {hasOwnKeys.pica ? '0 crédits (clé configurée)' : `${getEngineCost('pica')} crédits`}
                  </Badge>
                </div>
              </SelectItem>

              <SelectItem value="serp" disabled={!hasOwnKeys.serp && credits < getEngineCost('serp')}>
                <div className="flex items-center justify-between w-full">
                  <span>Google SERP</span>
                  <Badge variant={hasOwnKeys.serp ? 'default' : 'destructive'} className="ml-2">
                    {hasOwnKeys.serp ? '0 crédits' : `${getEngineCost('serp')} crédits`}
                  </Badge>
                </div>
              </SelectItem>

              <SelectItem value="firecrawl" disabled={!hasOwnKeys.firecrawl && credits < getEngineCost('firecrawl')}>
                <div className="flex items-center justify-between w-full">
                  <span>Firecrawl</span>
                  <Badge variant={hasOwnKeys.firecrawl ? 'default' : 'destructive'} className="ml-2">
                    {hasOwnKeys.firecrawl ? '0 crédits' : `${getEngineCost('firecrawl')} crédits`}
                  </Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* ALERTE CLÉ MANQUANTE */}
          {willConsumeCredits && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Cette action consomme <strong>{currentCost} crédits IA</strong> car vous n'avez pas configuré
                votre clé API {engine}.{' '}
                <Link href="/settings/api-keys" className="underline">
                  Configurer mes clés API
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* ALERTE CRÉDITS INSUFFISANTS */}
          {willConsumeCredits && credits < currentCost && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Crédits insuffisants ({credits} disponibles, {currentCost} requis).
                Configurez vos clés API ou contactez l'administrateur.
              </AlertDescription>
            </Alert>
          )}

          {/* INDICATEUR CRÉDITS */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm">Crédits IA restants</span>
            <Badge variant={credits < 50 ? 'destructive' : 'default'}>
              <Zap className="h-3 w-3 mr-1" />
              {credits}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ... Reste du dashboard ... */}
    </div>
  );
}
```

---

## 3.3 - ENDPOINT AI PRICING

Créer `/backend/src/modules/core/ai-pricing/ai-pricing.controller.ts` :

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiPricingService } from '../../../shared/services/ai-pricing.service';

@ApiTags('AI Pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-pricing')
export class AiPricingController {
  constructor(private aiPricingService: AiPricingService) {}

  @Get()
  async getAllPricing() {
    return this.aiPricingService.getAllPricing();
  }
}
```

Créer le module et l'importer dans `AppModule`.

---

## ✅ PHASE 3 - CHECKLIST

- [ ] `ProspectingService` modifié avec billing
- [ ] `AiPricingController` créé
- [ ] Frontend : Sélecteur moteur avec coûts
- [ ] Frontend : Alertes clés manquantes
- [ ] Frontend : Alerte crédits insuffisants
- [ ] Test : Lancer prospection → crédits consommés (si pas de clé)
- [ ] Test : Lancer prospection avec clé → 0 crédits consommés
- [ ] Test : Crédits insuffisants → erreur claire

---

# 📅 PHASE 4 – AI ORCHESTRATOR & GÉNÉRALISATION

**Durée** : 5-7 jours

**Objectif** : Créer un orchestrateur IA et généraliser à TOUS les modules.

---

## 4.1 - AI ORCHESTRATOR SERVICE

Créer `/backend/src/shared/services/ai-orchestrator.service.ts` :

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { AiCreditsService } from './ai-credits.service';
import { AiPricingService } from './ai-pricing.service';
import { AiErrorLogService } from './ai-error-log.service';

export interface AiActionContext {
  userId: string;
  agencyId?: string | null;
  actionCode: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
}

export interface AiActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  creditsUsed?: number;
  tokensUsed?: number;
  provider?: string;
}

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    private apiKeysService: ApiKeysService,
    private aiCreditsService: AiCreditsService,
    private aiPricingService: AiPricingService,
    private aiErrorLogService: AiErrorLogService,
  ) {}

  /**
   * ═══════════════════════════════════════════════════════════
   * WRAPPER GÉNÉRIQUE POUR TOUTE ACTION IA
   * ═══════════════════════════════════════════════════════════
   *
   * Usage:
   * ```
   * const result = await orchestrator.executeAiAction(
   *   context,
   *   'anthropic',
   *   async (apiKey) => {
   *     return await anthropicClient.generate(apiKey, prompt);
   *   }
   * );
   * ```
   */
  async executeAiAction<T>(
    context: AiActionContext,
    providerType: string,
    executor: (apiKey: string) => Promise<T>,
  ): Promise<AiActionResult<T>> {
    const startTime = Date.now();

    try {
      // 1. Récupérer le coût
      const cost = await this.aiPricingService.getCost(context.actionCode);

      // 2. Vérifier si clé propre existe
      const hasOwnKey = await this.apiKeysService.hasApiKey(
        context.userId,
        providerType as any,
        context.agencyId,
      );

      // 3. Consommer crédits si nécessaire
      if (!hasOwnKey && cost > 0) {
        await this.aiCreditsService.checkAndConsume(
          context.userId,
          context.agencyId || null,
          cost,
          context.actionCode,
          {
            entityType: context.entityType,
            entityId: context.entityId,
            ...context.metadata,
          },
        );
      }

      // 4. Récupérer la clé API
      const apiKey = await this.apiKeysService.getRequiredApiKey(
        context.userId,
        providerType as any,
        context.agencyId,
      );

      // 5. Exécuter l'action
      const result = await executor(apiKey);

      // 6. Logger succès
      this.logger.log(
        `✅ ${context.actionCode} OK (${context.userId}) - ${Date.now() - startTime}ms`
      );

      return {
        success: true,
        data: result,
        creditsUsed: hasOwnKey ? 0 : cost,
        provider: providerType,
      };
    } catch (error) {
      // 7. Logger erreur
      this.logger.error(
        `❌ ${context.actionCode} FAILED (${context.userId}): ${error.message}`
      );

      await this.aiErrorLogService.logError({
        agencyId: context.agencyId,
        userId: context.userId,
        actionCode: context.actionCode,
        provider: providerType,
        errorType: this.categorizeError(error),
        errorMessage: error.message,
        statusCode: error.response?.status,
        entityType: context.entityType,
        entityId: context.entityId,
        metadata: context.metadata,
      });

      return {
        success: false,
        error: error.message,
        provider: providerType,
      };
    }
  }

  /**
   * Catégorise une erreur
   */
  private categorizeError(error: any): string {
    if (error.message.includes('API key')) return 'api_key_invalid';
    if (error.message.includes('quota')) return 'quota_exceeded';
    if (error.message.includes('crédits')) return 'insufficient_credits';
    if (error.message.includes('network') || error.code === 'ECONNREFUSED') {
      return 'network_error';
    }
    if (error.response?.status === 401) return 'unauthorized';
    if (error.response?.status === 429) return 'rate_limit';
    if (error.response?.status >= 500) return 'server_error';
    return 'unknown_error';
  }

  /**
   * Version spécialisée pour LLM
   */
  async executeLlmAction<T>(
    context: AiActionContext,
    llmProvider: 'anthropic' | 'openai' | 'gemini' | 'deepseek' | 'openrouter',
    executor: (apiKey: string) => Promise<T>,
  ): Promise<AiActionResult<T>> {
    return this.executeAiAction(context, llmProvider, executor);
  }

  /**
   * Version spécialisée pour scraping
   */
  async executeScrapingAction<T>(
    context: AiActionContext,
    scrapingProvider: 'serp' | 'firecrawl' | 'pica' | 'jina' | 'scrapingbee',
    executor: (apiKey: string) => Promise<T>,
  ): Promise<AiActionResult<T>> {
    return this.executeAiAction(context, scrapingProvider, executor);
  }
}
```

Ajouter dans `AiBillingModule` :

```typescript
import { AiOrchestratorService } from '../services/ai-orchestrator.service';

@Module({
  providers: [
    // ... services existants ...
    AiOrchestratorService,
  ],
  exports: [
    // ... exports existants ...
    AiOrchestratorService,
  ],
})
export class AiBillingModule {}
```

---

## 4.2 - MIGRER LES MODULES EXISTANTS

### A. Matching Service

Modifier `/backend/src/modules/intelligence/matching/matching.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { AiOrchestratorService } from '../../../shared/services/ai-orchestrator.service';
import { LlmProviderFactory } from '../llm-config/providers/llm-provider.factory';

@Injectable()
export class MatchingService {
  constructor(
    private orchestrator: AiOrchestratorService,
    private providerFactory: LlmProviderFactory,
    private prisma: PrismaService,
  ) {}

  async runAiMatching(
    userId: string,
    agencyId: string | null,
    propertyId: string,
    prospectId: string,
  ) {
    const result = await this.orchestrator.executeLlmAction(
      {
        userId,
        agencyId,
        actionCode: 'AI_MATCHING',
        entityType: 'property_prospect_match',
        entityId: `${propertyId}_${prospectId}`,
      },
      'anthropic',
      async (apiKey) => {
        // Récupérer données
        const property = await this.prisma.properties.findUnique({
          where: { id: propertyId },
        });
        const prospect = await this.prisma.prospects.findUnique({
          where: { id: prospectId },
        });

        // Construire prompt
        const prompt = this.buildMatchingPrompt(property, prospect);

        // Appeler LLM
        const llmProvider = this.providerFactory.createProvider('anthropic', apiKey);
        return await llmProvider.generate(prompt);
      },
    );

    if (!result.success) {
      throw new Error(`Erreur matching IA: ${result.error}`);
    }

    return this.parseMatchingResult(result.data);
  }

  private buildMatchingPrompt(property: any, prospect: any): string {
    return `Analyse le matching entre cette propriété et ce prospect...`;
  }

  private parseMatchingResult(llmResponse: string): any {
    // Parsing
    return {};
  }
}
```

### B. SEO AI Service

Modifier `/backend/src/modules/content/seo-ai/seo-ai.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { AiOrchestratorService } from '../../../shared/services/ai-orchestrator.service';
import { LlmProviderFactory } from '../../intelligence/llm-config/providers/llm-provider.factory';

@Injectable()
export class SeoAiService {
  constructor(
    private orchestrator: AiOrchestratorService,
    private providerFactory: LlmProviderFactory,
    private prisma: PrismaService,
  ) {}

  async optimizeProperty(
    userId: string,
    agencyId: string | null,
    propertyId: string,
  ) {
    const result = await this.orchestrator.executeLlmAction(
      {
        userId,
        agencyId,
        actionCode: 'AI_SEO_OPTIMIZE',
        entityType: 'property',
        entityId: propertyId,
      },
      'anthropic',
      async (apiKey) => {
        const property = await this.prisma.properties.findUnique({
          where: { id: propertyId },
        });

        const prompt = `Optimise le SEO de cette propriété: ${JSON.stringify(property)}`;

        const llmProvider = this.providerFactory.createProvider('anthropic', apiKey);
        return await llmProvider.generate(prompt);
      },
    );

    if (!result.success) {
      throw new Error(`Erreur SEO AI: ${result.error}`);
    }

    // Sauvegarder optimisations
    await this.saveSeoOptimizations(propertyId, result.data);

    return result.data;
  }

  private async saveSeoOptimizations(propertyId: string, data: any) {
    // Sauvegarder dans PropertySeo
  }
}
```

### C. Email AI Response Service

Modifier `/backend/src/modules/communications/email-ai-response/email-ai-response.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { AiOrchestratorService } from '../../../shared/services/ai-orchestrator.service';
import { LlmProviderFactory } from '../../intelligence/llm-config/providers/llm-provider.factory';

@Injectable()
export class EmailAiResponseService {
  constructor(
    private orchestrator: AiOrchestratorService,
    private providerFactory: LlmProviderFactory,
  ) {}

  async analyzeEmail(
    userId: string,
    agencyId: string | null,
    emailId: string,
    emailContent: string,
  ) {
    const result = await this.orchestrator.executeLlmAction(
      {
        userId,
        agencyId,
        actionCode: 'AI_EMAIL_ANALYSIS',
        entityType: 'email',
        entityId: emailId,
      },
      'anthropic',
      async (apiKey) => {
        const prompt = `Analyse cet email: ${emailContent}`;
        const llmProvider = this.providerFactory.createProvider('anthropic', apiKey);
        return await llmProvider.generate(prompt);
      },
    );

    if (!result.success) {
      throw new Error(`Erreur analyse email: ${result.error}`);
    }

    return this.parseEmailAnalysis(result.data);
  }

  private parseEmailAnalysis(data: string): any {
    return {};
  }
}
```

### D. AI Chat Assistant Service

Modifier `/backend/src/modules/intelligence/ai-chat-assistant/ai-chat-assistant.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { AiOrchestratorService } from '../../../shared/services/ai-orchestrator.service';
import { LlmProviderFactory } from '../llm-config/providers/llm-provider.factory';

@Injectable()
export class AiChatAssistantService {
  constructor(
    private orchestrator: AiOrchestratorService,
    private providerFactory: LlmProviderFactory,
    private prisma: PrismaService,
  ) {}

  async sendMessage(
    userId: string,
    agencyId: string | null,
    conversationId: string,
    message: string,
  ) {
    const result = await this.orchestrator.executeLlmAction(
      {
        userId,
        agencyId,
        actionCode: 'AI_CHAT_MESSAGE',
        entityType: 'conversation',
        entityId: conversationId,
      },
      'anthropic',
      async (apiKey) => {
        const history = await this.getConversationHistory(conversationId);
        const prompt = this.buildChatPrompt(history, message);

        const llmProvider = this.providerFactory.createProvider('anthropic', apiKey);
        return await llmProvider.generate(prompt);
      },
    );

    if (!result.success) {
      throw new Error(`Erreur chat: ${result.error}`);
    }

    // Sauvegarder message
    await this.saveMessage(conversationId, 'assistant', result.data);

    return result.data;
  }

  private async getConversationHistory(conversationId: string) {
    return this.prisma.aiChatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private buildChatPrompt(history: any[], message: string): string {
    return `Conversation: ${JSON.stringify(history)}\nUser: ${message}`;
  }

  private async saveMessage(conversationId: string, role: string, content: string) {
    await this.prisma.aiChatMessage.create({
      data: { conversationId, role, content },
    });
  }
}
```

### E. Document AI Service

Modifier `/backend/src/modules/content/documents/ai.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { AiOrchestratorService } from '../../../shared/services/ai-orchestrator.service';
import { LlmProviderFactory } from '../../intelligence/llm-config/providers/llm-provider.factory';

@Injectable()
export class DocumentAiService {
  constructor(
    private orchestrator: AiOrchestratorService,
    private providerFactory: LlmProviderFactory,
  ) {}

  async generateDocument(
    userId: string,
    agencyId: string | null,
    type: 'pdf' | 'docx' | 'excel',
    template: string,
    data: any,
  ) {
    const result = await this.orchestrator.executeLlmAction(
      {
        userId,
        agencyId,
        actionCode: 'AI_DOCUMENT_GENERATION',
        entityType: 'document',
        metadata: { type, template },
      },
      'anthropic',
      async (apiKey) => {
        const prompt = `Génère un document ${type} avec template: ${template}, data: ${JSON.stringify(data)}`;
        const llmProvider = this.providerFactory.createProvider('anthropic', apiKey);
        const content = await llmProvider.generate(prompt);
        return await this.createDocument(type, content);
      },
    );

    if (!result.success) {
      throw new Error(`Erreur génération document: ${result.error}`);
    }

    return result.data;
  }

  private async createDocument(type: string, content: string) {
    // Créer le fichier
    return { url: '/path/to/document' };
  }
}
```

---

## ✅ PHASE 4 - CHECKLIST

- [ ] `AiOrchestratorService` créé
- [ ] Tous les services IA migrés :
  - [ ] Prospecting (déjà fait en Phase 3)
  - [ ] Matching
  - [ ] SEO AI
  - [ ] Email AI
  - [ ] AI Chat Assistant
  - [ ] Document AI
- [ ] Tests : Chaque module consomme crédits si pas de clé
- [ ] Tests : Chaque module utilise clés user en priorité

---

# 📅 PHASE 5 – DASHBOARD SUPER ADMIN

**Durée** : 4-6 jours

**Objectif** : Vue globale pour le super admin.

---

## 5.1 - BACKEND SERVICES ADMIN

### A. AdminUsageService

Créer `/backend/src/modules/admin/admin-usage.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class AdminUsageService {
  constructor(private prisma: PrismaService) {}

  async getUsageByAgency(period: 'day' | 'week' | 'month' = 'month') {
    const startDate = this.getStartDate(period);

    // Consommation AGENCES
    const agencyUsage = await this.prisma.aiUsage.groupBy({
      by: ['agencyId'],
      where: {
        agencyId: { not: null },
        createdAt: { gte: startDate },
      },
      _sum: { creditsUsed: true },
      _count: { id: true },
    });

    const enrichedAgency = await Promise.all(
      agencyUsage.map(async (item) => {
        const agency = await this.prisma.agencies.findUnique({
          where: { id: item.agencyId },
        });
        const credits = await this.prisma.aiCredits.findUnique({
          where: { agencyId: item.agencyId },
        });

        return {
          type: 'agency',
          id: item.agencyId,
          name: agency?.name,
          creditsUsed: item._sum.creditsUsed || 0,
          requestCount: item._count.id,
          creditsRemaining: credits?.balance || 0,
          quota: credits?.quotaMonthly,
        };
      })
    );

    // Consommation USERS INDÉPENDANTS
    const userUsage = await this.prisma.aiUsage.groupBy({
      by: ['userId'],
      where: {
        agencyId: null,
        userId: { not: null },
        createdAt: { gte: startDate },
      },
      _sum: { creditsUsed: true },
      _count: { id: true },
    });

    const enrichedUser = await Promise.all(
      userUsage.map(async (item) => {
        const user = await this.prisma.users.findUnique({
          where: { id: item.userId },
        });
        const credits = await this.prisma.userAiCredits.findUnique({
          where: { userId: item.userId },
        });

        return {
          type: 'user',
          id: item.userId,
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
          creditsUsed: item._sum.creditsUsed || 0,
          requestCount: item._count.id,
          creditsRemaining: credits?.balance || 0,
          quota: credits?.quotaMonthly,
        };
      })
    );

    return [...enrichedAgency, ...enrichedUser];
  }

  async getGlobalStats() {
    const [
      totalAgencies,
      totalIndependentUsers,
      totalCreditsConsumed,
      totalActions,
      topActions,
    ] = await Promise.all([
      this.prisma.agencies.count(),
      this.prisma.users.count({ where: { agencyId: null } }),
      this.prisma.aiUsage.aggregate({ _sum: { creditsUsed: true } }),
      this.prisma.aiUsage.count(),
      this.prisma.aiUsage.groupBy({
        by: ['actionCode'],
        _sum: { creditsUsed: true },
        _count: { id: true },
        orderBy: { _sum: { creditsUsed: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalAgencies,
      totalIndependentUsers,
      totalCreditsConsumed: totalCreditsConsumed._sum.creditsUsed || 0,
      totalActions,
      topActions,
    };
  }

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.setDate(now.getDate() - 1));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  }
}
```

### B. AdminAgencyService

Créer `/backend/src/modules/admin/admin-agency.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AiCreditsService } from '../../shared/services/ai-credits.service';

@Injectable()
export class AdminAgencyService {
  constructor(
    private prisma: PrismaService,
    private aiCreditsService: AiCreditsService,
  ) {}

  async getAllAccounts() {
    // AGENCES
    const agencies = await this.prisma.agencies.findMany({
      include: {
        apiKeys: true,
        aiCredits: true,
        _count: { select: { users: true, aiUsages: true } },
      },
    });

    const agencyAccounts = agencies.map((agency) => ({
      type: 'agency',
      id: agency.id,
      name: agency.name,
      email: agency.email,
      usersCount: agency._count.users,
      aiActionsCount: agency._count.aiUsages,
      creditsBalance: agency.aiCredits?.balance || 0,
      creditsQuota: agency.aiCredits?.quotaMonthly,
      hasApiKeys: {
        llm: !!agency.apiKeys?.anthropicApiKey || !!agency.apiKeys?.openaiApiKey,
        serp: !!agency.apiKeys?.serpApiKey,
        firecrawl: !!agency.apiKeys?.firecrawlApiKey,
        pica: !!agency.apiKeys?.picaApiKey,
      },
    }));

    // USERS INDÉPENDANTS
    const users = await this.prisma.users.findMany({
      where: { agencyId: null },
      include: {
        userAiCredits: true,
        aiSettings: true,
        _count: { select: { aiUsages: true } },
      },
    });

    const userAccounts = users.map((user) => ({
      type: 'user',
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      aiActionsCount: user._count.aiUsages,
      creditsBalance: user.userAiCredits?.balance || 0,
      creditsQuota: user.userAiCredits?.quotaMonthly,
      hasApiKeys: {
        llm: !!user.aiSettings?.claudeApiKey || !!user.aiSettings?.openaiApiKey,
        serp: false,
        firecrawl: false,
        pica: false,
      },
    }));

    return [...agencyAccounts, ...userAccounts];
  }

  async addCredits(accountType: 'agency' | 'user', accountId: string, amount: number) {
    if (accountType === 'agency') {
      await this.aiCreditsService.addCreditsToAgency(accountId, amount);
    } else {
      await this.aiCreditsService.addCreditsToUser(accountId, amount);
    }
    return { message: `${amount} crédits ajoutés` };
  }

  async setQuota(
    accountType: 'agency' | 'user',
    accountId: string,
    quotaMonthly: number,
    quotaDaily?: number,
  ) {
    if (accountType === 'agency') {
      await this.aiCreditsService.setAgencyQuota(accountId, quotaMonthly, quotaDaily);
    } else {
      await this.aiCreditsService.setUserQuota(accountId, quotaMonthly, quotaDaily);
    }
    return { message: 'Quota défini' };
  }
}
```

### C. AdminNotificationsService

Créer `/backend/src/modules/admin/admin-notifications.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

interface Alert {
  accountType: 'agency' | 'user';
  accountId: string;
  accountName: string;
  type: 'low_credits' | 'missing_keys' | 'high_errors';
  severity: 'low' | 'medium' | 'high';
  message: string;
  data?: any;
}

@Injectable()
export class AdminNotificationsService {
  constructor(private prisma: PrismaService) {}

  async getAlertsAtRisk(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // 1. AGENCES avec crédits bas
    const lowCreditsAgencies = await this.prisma.aiCredits.findMany({
      where: { balance: { lt: 50 } },
      include: { agency: true },
    });

    for (const item of lowCreditsAgencies) {
      alerts.push({
        accountType: 'agency',
        accountId: item.agencyId,
        accountName: item.agency.name,
        type: 'low_credits',
        severity: item.balance < 10 ? 'high' : 'medium',
        message: `Crédits bas: ${item.balance}`,
        data: { balance: item.balance, quota: item.quotaMonthly },
      });
    }

    // 2. USERS avec crédits bas
    const lowCreditsUsers = await this.prisma.userAiCredits.findMany({
      where: { balance: { lt: 50 } },
      include: { user: true },
    });

    for (const item of lowCreditsUsers) {
      alerts.push({
        accountType: 'user',
        accountId: item.userId,
        accountName: `${item.user.firstName} ${item.user.lastName}`,
        type: 'low_credits',
        severity: item.balance < 10 ? 'high' : 'medium',
        message: `Crédits bas: ${item.balance}`,
        data: { balance: item.balance },
      });
    }

    // 3. AGENCES sans clés
    const agenciesWithoutKeys = await this.prisma.agencies.findMany({
      where: { apiKeys: null },
    });

    for (const agency of agenciesWithoutKeys) {
      alerts.push({
        accountType: 'agency',
        accountId: agency.id,
        accountName: agency.name,
        type: 'missing_keys',
        severity: 'medium',
        message: 'Aucune clé API configurée',
      });
    }

    // 4. Beaucoup d'erreurs
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const errorsByAccount = await this.prisma.aiErrorLog.groupBy({
      by: ['agencyId', 'userId'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
      having: { id: { _count: { gt: 10 } } },
    });

    for (const item of errorsByAccount) {
      if (item.agencyId) {
        const agency = await this.prisma.agencies.findUnique({
          where: { id: item.agencyId },
        });
        alerts.push({
          accountType: 'agency',
          accountId: item.agencyId,
          accountName: agency?.name || 'Unknown',
          type: 'high_errors',
          severity: item._count.id > 50 ? 'high' : 'medium',
          message: `${item._count.id} erreurs cette semaine`,
        });
      } else if (item.userId) {
        const user = await this.prisma.users.findUnique({
          where: { id: item.userId },
        });
        alerts.push({
          accountType: 'user',
          accountId: item.userId,
          accountName: `${user?.firstName} ${user?.lastName}`,
          type: 'high_errors',
          severity: item._count.id > 50 ? 'high' : 'medium',
          message: `${item._count.id} erreurs cette semaine`,
        });
      }
    }

    return alerts;
  }
}
```

### D. AdminController

Créer `/backend/src/modules/admin/admin.controller.ts` :

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminUsageService } from './admin-usage.service';
import { AdminAgencyService } from './admin-agency.service';
import { AdminNotificationsService } from './admin-notifications.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private adminUsageService: AdminUsageService,
    private adminAgencyService: AdminAgencyService,
    private adminNotificationsService: AdminNotificationsService,
  ) {}

  private checkSuperAdmin(user: any) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Accès réservé aux super admins');
    }
  }

  @Get('stats')
  async getGlobalStats(@CurrentUser() user: any) {
    this.checkSuperAdmin(user);
    return this.adminUsageService.getGlobalStats();
  }

  @Get('usage')
  async getUsage(
    @CurrentUser() user: any,
    @Query('period') period: 'day' | 'week' | 'month' = 'month',
  ) {
    this.checkSuperAdmin(user);
    return this.adminUsageService.getUsageByAgency(period);
  }

  @Get('accounts')
  async getAllAccounts(@CurrentUser() user: any) {
    this.checkSuperAdmin(user);
    return this.adminAgencyService.getAllAccounts();
  }

  @Post('credits')
  async addCredits(
    @CurrentUser() user: any,
    @Body() body: { accountType: 'agency' | 'user'; accountId: string; amount: number },
  ) {
    this.checkSuperAdmin(user);
    return this.adminAgencyService.addCredits(body.accountType, body.accountId, body.amount);
  }

  @Post('quota')
  async setQuota(
    @CurrentUser() user: any,
    @Body() body: {
      accountType: 'agency' | 'user';
      accountId: string;
      quotaMonthly: number;
      quotaDaily?: number;
    },
  ) {
    this.checkSuperAdmin(user);
    return this.adminAgencyService.setQuota(
      body.accountType,
      body.accountId,
      body.quotaMonthly,
      body.quotaDaily,
    );
  }

  @Get('alerts')
  async getAlerts(@CurrentUser() user: any) {
    this.checkSuperAdmin(user);
    return this.adminNotificationsService.getAlertsAtRisk();
  }
}
```

Créer le module et l'importer dans `AppModule`.

---

## 5.2 - FRONTEND DASHBOARD SUPER ADMIN

Créer `/frontend/pages/admin/dashboard.tsx` :

```tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Loader2, AlertCircle, TrendingUp, Users, Zap, Building, User } from 'lucide-react';
import apiClient from '@/shared/utils/api-client-backend';

export default function SuperAdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [usage, setUsage] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
        return;
      }
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      const [statsRes, accountsRes, alertsRes, usageRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/accounts'),
        apiClient.get('/admin/alerts'),
        apiClient.get('/admin/usage?period=month'),
      ]);

      setStats(statsRes.data);
      setAccounts(accountsRes.data);
      setAlerts(alertsRes.data);
      setUsage(usageRes.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
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
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard Super Admin</h1>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">{stats?.totalAgencies || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Users Indépendants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold">{stats?.totalIndependentUsers || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Crédits Consommés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div className="text-2xl font-bold">
                {stats?.totalCreditsConsumed?.toLocaleString() || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actions IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalActions?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ALERTES */}
      {alerts.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Alertes ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, i) => (
              <Alert
                key={i}
                variant={alert.severity === 'high' ? 'destructive' : 'default'}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {alert.accountType === 'agency' ? (
                        <Building className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      <strong>{alert.accountName}</strong>
                    </div>
                    <AlertDescription>{alert.message}</AlertDescription>
                  </div>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                    {alert.type}
                  </Badge>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TABS */}
      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Comptes</TabsTrigger>
          <TabsTrigger value="usage">Consommation</TabsTrigger>
        </TabsList>

        {/* ACCOUNTS */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>Liste des Comptes (Agences + Users)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Actions IA</TableHead>
                    <TableHead>Crédits</TableHead>
                    <TableHead>Quota</TableHead>
                    <TableHead>Clés API</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        {account.type === 'agency' ? (
                          <Badge variant="default">
                            <Building className="h-3 w-3 mr-1" />
                            Agence
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <User className="h-3 w-3 mr-1" />
                            User
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{account.name}</div>
                          {account.email && (
                            <div className="text-sm text-muted-foreground">
                              {account.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{account.aiActionsCount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={account.creditsBalance < 50 ? 'destructive' : 'default'}
                        >
                          {account.creditsBalance}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.creditsQuota || 'Illimité'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {account.hasApiKeys.llm && <Badge variant="outline">LLM</Badge>}
                          {account.hasApiKeys.serp && <Badge variant="outline">SERP</Badge>}
                          {account.hasApiKeys.pica && <Badge variant="outline">Pica</Badge>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USAGE */}
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Consommation (30 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Crédits Utilisés</TableHead>
                    <TableHead>Nb Requêtes</TableHead>
                    <TableHead>Crédits Restants</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usage.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.type === 'agency' ? (
                          <Badge variant="default">Agence</Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.creditsUsed.toLocaleString()}</TableCell>
                      <TableCell>{item.requestCount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.creditsRemaining < 50 ? 'destructive' : 'default'}
                        >
                          {item.creditsRemaining}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

Ajouter un lien dans le header pour les SUPER_ADMIN uniquement.

---

## ✅ PHASE 5 - CHECKLIST

- [ ] Backend services admin créés
- [ ] AdminController créé
- [ ] Page `/admin/dashboard` créée
- [ ] Tests : Accès réservé SUPER_ADMIN
- [ ] Tests : Stats globales affichées
- [ ] Tests : Alertes agences + users
- [ ] Tests : Ajout crédits à une agence
- [ ] Tests : Ajout crédits à un user

---

# 📅 PHASE 6 – NOTIFICATIONS & UX

**Durée** : 2-3 jours

**Objectif** : Améliorer l'expérience utilisateur.

## 6.1 - COMPOSANTS FRONTEND

### A. Hook useAiNotifications

Créer `/frontend/src/shared/hooks/useAiNotifications.ts` :

```typescript
import { useEffect } from 'react';
import { useToast } from './useToast';
import apiClient from '@/shared/utils/api-client-backend';

export function useAiNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    checkCredits();
  }, []);

  const checkCredits = async () => {
    try {
      const response = await apiClient.get('/ai-credits/balance');
      const balance = response.data.balance;

      if (balance < 20) {
        toast({
          title: 'Crédits IA presque épuisés',
          description: `Il vous reste ${balance} crédits. Configurez vos clés API pour éviter les interruptions.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      // Silent fail
    }
  };

  return { checkCredits };
}
```

### B. Alert Clé Manquante

Créer `/frontend/src/shared/components/MissingApiKeyAlert.tsx` :

```tsx
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Props {
  provider: string;
  creditCost: number;
}

export function MissingApiKeyAlert({ provider, creditCost }: Props) {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Cette action consomme <strong>{creditCost} crédits IA</strong> car vous n'avez pas
        configuré votre clé API {provider}.{' '}
        <Link href="/settings/api-keys" className="underline">
          Configurer mes clés API
        </Link>
      </AlertDescription>
    </Alert>
  );
}
```

---

## 6.2 - EMAILS (Optionnel)

Créer `/backend/src/modules/admin/admin-email.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class AdminEmailService {
  constructor(private prisma: PrismaService) {}

  async sendLowCreditsAlert(accountType: 'agency' | 'user', accountId: string) {
    // Récupérer les admins
    // Envoyer email via MailService
  }
}
```

CRON job quotidien.

---

## ✅ PHASE 6 - CHECKLIST

- [ ] Hook `useAiNotifications` créé
- [ ] Composant `MissingApiKeyAlert` créé
- [ ] (Optionnel) Emails automatiques
- [ ] (Optionnel) CRON job

---

# 📅 PHASE 7 – TESTS & RAPIDAPI

**Durée** : 3-4 jours

**Objectif** : Stabiliser et préparer RapidAPI.

## 7.1 - TESTS UNITAIRES

Créer `/backend/src/shared/services/__tests__/ai-credits.service.spec.ts` :

```typescript
import { Test } from '@nestjs/testing';
import { AiCreditsService } from '../ai-credits.service';
import { PrismaService } from '../../database/prisma.service';

describe('AiCreditsService', () => {
  let service: AiCreditsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AiCreditsService, PrismaService],
    }).compile();

    service = module.get(AiCreditsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO: Tests
});
```

Tests similaires pour ApiKeysService, AiPricingService, AiOrchestratorService.

---

## 7.2 - RAPIDAPI

Ajouter dans `ApiKeysService` (déjà prévu).

Créer `/backend/src/shared/services/rapid-api.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class RapidApiService {
  async call(apiKey: string, endpoint: string, params: any) {
    const response = await axios.get(`https://rapidapi.com/${endpoint}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'api.rapidapi.com',
      },
      params,
    });
    return response.data;
  }
}
```

Ajouter action IA dans `AiPricing`.

---

## ✅ PHASE 7 - CHECKLIST

- [ ] Tests unitaires (4+ services)
- [ ] Tests E2E (1+ scénario)
- [ ] RapidAPI intégré
- [ ] Documentation

---

# 🎉 RÉCAPITULATIF FINAL

## Architecture finale

```
SUPER ADMIN (dashboard global)
    ↓
┌────────────────────┬────────────────────┐
│  USERS INDÉPENDANTS │   AGENCES          │
│  - UserAiCredits   │   - AiCredits      │
│  - ai_settings     │   - AgencyApiKeys  │
└────────────────────┴────────────────────┘
    ↓
AI ORCHESTRATOR (gestion unifiée)
    ↓
11 PROVIDERS (LLM + Data)
```

## Modules IA intégrés

1. ✅ Prospection IA
2. ✅ Matching IA
3. ✅ SEO IA
4. ✅ Email AI
5. ✅ AI Chat Assistant
6. ✅ Document AI
7. ✅ Validation IA

**🚀 Système prêt pour production !**
