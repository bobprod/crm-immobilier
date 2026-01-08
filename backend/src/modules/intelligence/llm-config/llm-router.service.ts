import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { LLMProviderFactory } from './providers/llm-provider.factory';
import { LLMProvider, PRICING_PER_1M_TOKENS } from './providers/llm-provider.interface';

/**
 * Types d'opérations pour le routing intelligent
 */
export type OperationType =
  | 'seo'                      // Génération SEO (qualité max)
  | 'prospecting_mass'         // Prospection en masse (coût min)
  | 'prospecting_qualify'      // Qualification leads (équilibré)
  | 'analysis_quick'           // Analyse rapide (vitesse)
  | 'content_generation'       // Génération de contenu (qualité)
  | 'long_context'             // Documents longs (contexte)
  | 'scraping_analysis';       // Analyse de scraping (équilibré)

/**
 * Service de routing intelligent pour les providers LLM
 *
 * Sélectionne automatiquement le meilleur provider selon :
 * - Le type d'opération
 * - Les providers configurés par l'utilisateur
 * - Le budget disponible
 * - Les performances historiques
 */
@Injectable()
export class LLMRouterService {
  /**
   * Matrice de routing intelligente
   * Définit l'ordre de préférence des providers selon le type d'opération
   */
  private readonly ROUTING_RULES: Record<
    OperationType,
    {
      priority: string[];
      criteria: 'quality' | 'cost' | 'speed' | 'balanced' | 'context_window';
      description: string;
    }
  > = {
      seo: {
        priority: ['anthropic', 'openai', 'gemini', 'mistral'],
        criteria: 'quality',
        description: 'Qualité maximale pour le SEO',
      },
      prospecting_mass: {
        priority: ['deepseek', 'qwen', 'mistral', 'gemini'],
        criteria: 'cost',
        description: 'Coût minimal pour traitement en masse',
      },
      prospecting_qualify: {
        priority: ['gemini', 'mistral', 'qwen', 'anthropic'],
        criteria: 'balanced',
        description: 'Équilibre qualité/coût pour qualification',
      },
      analysis_quick: {
        priority: ['gemini', 'qwen', 'deepseek', 'mistral'],
        criteria: 'speed',
        description: 'Vitesse maximale',
      },
      content_generation: {
        priority: ['anthropic', 'mistral', 'openai', 'gemini'],
        criteria: 'quality',
        description: 'Qualité de contenu',
      },
      long_context: {
        priority: ['kimi', 'anthropic', 'openai', 'gemini'],
        criteria: 'context_window',
        description: 'Fenêtre de contexte large',
      },
      scraping_analysis: {
        priority: ['mistral', 'gemini', 'deepseek', 'qwen'],
        criteria: 'balanced',
        description: 'Bon rapport qualité/prix',
      },
    };

  constructor(
    private prisma: PrismaService,
    private providerFactory: LLMProviderFactory,
  ) { }

  /**
   * 🎯 MÉTHODE PRINCIPALE : Sélection intelligente du provider
   *
   * @param userId - ID de l'utilisateur
   * @param operationType - Type d'opération à effectuer
   * @param providerOverride - Provider spécifique choisi manuellement (optionnel)
   * @returns Instance du provider LLM prêt à utiliser
   */
  async selectBestProvider(
    userId: string,
    operationType: OperationType,
    providerOverride?: string,
  ): Promise<LLMProvider> {
    // 1. Si override manuel, utiliser ce provider directement
    if (providerOverride && providerOverride !== 'auto') {
      console.log(`🎯 Override manuel: ${providerOverride}`);
      return this.getSpecificProvider(userId, providerOverride);
    }

    // 2. Récupérer tous les providers actifs de l'utilisateur
    const userProviders = await this.getUserActiveProviders(userId);

    if (userProviders.length === 0) {
      throw new BadRequestException(
        'Aucun provider LLM configuré. Veuillez configurer au moins un provider dans les paramètres.',
      );
    }

    // 3. Appliquer les règles de routing intelligentes
    const selectedConfig = await this.applyIntelligentRouting(
      userProviders,
      operationType,
      userId,
    );

    console.log(
      `✅ Provider sélectionné: ${selectedConfig.provider} pour ${operationType}`,
    );

    // 4. Créer et retourner l'instance du provider
    const provider = await this.providerFactory.createProviderForUser(
      userId,
      selectedConfig.provider,
    );

    // 5. Logger la sélection (pour analytics)
    await this.logProviderSelection(
      userId,
      selectedConfig.provider,
      operationType,
    );

    return provider;
  }

  /**
   * 🔍 Récupérer tous les providers actifs d'un utilisateur
   */
  private async getUserActiveProviders(userId: string) {
    return this.prisma.userLlmProvider.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        priority: 'asc', // Ordre de priorité (0 = plus haute)
      },
    });
  }

  /**
   * 🧠 Logique de routing intelligente
   *
   * Applique les règles de routing selon le type d'opération
   * et vérifie le budget disponible
   */
  private async applyIntelligentRouting(
    userProviders: any[],
    operationType: OperationType,
    userId: string,
  ) {
    const rules = this.ROUTING_RULES[operationType];

    if (!rules) {
      // Fallback : retourner le premier provider actif
      console.log(`⚠️ Type d'opération inconnu: ${operationType}, fallback`);
      return userProviders[0];
    }

    // Pour chaque provider dans l'ordre de préférence
    for (const preferredProvider of rules.priority) {
      const found = userProviders.find((p) => p.provider === preferredProvider);

      if (found) {
        // Vérifier le budget avant de sélectionner
        const hasBudget = await this.checkProviderBudget(userId, found.provider);

        if (hasBudget) {
          console.log(
            `✅ Provider sélectionné: ${found.provider} (${rules.description})`,
          );
          return found;
        } else {
          console.log(
            `⚠️ Provider ${found.provider} : budget dépassé, passage au suivant`,
          );
        }
      }
    }

    // Si aucun provider trouvé dans les préférences, prendre le premier disponible
    const fallback = userProviders[0];
    console.log(`⚠️ Fallback sur: ${fallback.provider}`);
    return fallback;
  }

  /**
   * 💰 Vérifier si le budget du provider est disponible
   *
   * @returns true si le budget est OK, false si dépassé
   */
  private async checkProviderBudget(
    userId: string,
    provider: string,
  ): Promise<boolean> {
    const providerConfig = await this.prisma.userLlmProvider.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    if (!providerConfig?.monthlyBudget) {
      return true; // Pas de limite = OK
    }

    // Calculer l'utilisation du mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await this.prisma.llmUsageLog.aggregate({
      where: {
        userId,
        provider,
        createdAt: { gte: startOfMonth },
      },
      _sum: { cost: true },
    });

    const currentSpend = usage._sum.cost || 0;
    const budgetRemaining = providerConfig.monthlyBudget - currentSpend;

    console.log(
      `💰 Budget ${provider}: ${currentSpend.toFixed(4)}$ / ${providerConfig.monthlyBudget}$ (reste: ${budgetRemaining.toFixed(4)}$)`,
    );

    return currentSpend < providerConfig.monthlyBudget;
  }

  /**
   * 🎯 Obtenir un provider spécifique (override manuel)
   */
  async getSpecificProvider(
    userId: string,
    providerName: string,
  ): Promise<LLMProvider> {
    const config = await this.prisma.userLlmProvider.findUnique({
      where: {
        userId_provider: { userId, provider: providerName },
      },
    });

    if (!config) {
      throw new BadRequestException(
        `Provider ${providerName} non configuré. Veuillez l'ajouter dans les paramètres.`,
      );
    }

    if (!config.isActive) {
      throw new BadRequestException(
        `Provider ${providerName} est désactivé. Veuillez l'activer dans les paramètres.`,
      );
    }

    return this.providerFactory.createProviderForUser(userId, providerName);
  }

  /**
   * 📋 Liste des providers configurés par l'utilisateur
   *
   * Retourne tous les providers avec leurs stats enrichies
   */
  async getUserProviders(userId: string) {
    const providers = await this.prisma.userLlmProvider.findMany({
      where: { userId },
      orderBy: { priority: 'asc' },
    });

    // Enrichir avec les stats de performance
    const enriched = await Promise.all(
      providers.map(async (p) => {
        const perf = await this.prisma.providerPerformance.findUnique({
          where: { userId_provider: { userId, provider: p.provider } },
        });

        const monthlyUsage = await this.getMonthlyUsage(userId, p.provider);

        return {
          ...p,
          apiKey: '***' + (p.apiKey?.slice(-4) || ''), // Masquer la clé
          performance: perf,
          monthlyUsage,
          budgetRemaining: p.monthlyBudget
            ? Math.max(0, p.monthlyBudget - monthlyUsage)
            : null,
        };
      }),
    );

    return enriched;
  }

  /**
   * 💵 Utilisation mensuelle d'un provider
   */
  private async getMonthlyUsage(
    userId: string,
    provider: string,
  ): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await this.prisma.llmUsageLog.aggregate({
      where: {
        userId,
        provider,
        createdAt: { gte: startOfMonth },
      },
      _sum: { cost: true },
    });

    return usage._sum.cost || 0;
  }

  /**
   * 📊 Suggérer le meilleur provider pour une opération
   *
   * Retourne le provider recommandé sans le créer
   */
  async suggestProvider(userId: string, operationType: OperationType) {
    const userProviders = await this.getUserActiveProviders(userId);
    const rules = this.ROUTING_RULES[operationType];

    if (!rules || userProviders.length === 0) {
      return null;
    }

    for (const preferred of rules.priority) {
      const found = userProviders.find((p) => p.provider === preferred);
      if (found) {
        const hasBudget = await this.checkProviderBudget(userId, found.provider);
        if (hasBudget) {
          return {
            provider: found.provider,
            reason: rules.description,
            criteria: rules.criteria,
          };
        }
      }
    }

    return null;
  }

  /**
   * 📝 Logger la sélection de provider
   */
  private async logProviderSelection(
    userId: string,
    provider: string,
    operationType: string,
  ) {
    // Mettre à jour lastUsed dans UserLlmProvider
    await this.prisma.userLlmProvider.updateMany({
      where: { userId, provider },
      data: { updatedAt: new Date() },
    });
  }

  /**
   * 📈 Tracker un appel LLM (à appeler après chaque génération)
   *
   * Cette méthode doit être appelée après chaque appel LLM pour :
   * - Enregistrer l'utilisation
   * - Calculer les coûts
   * - Mettre à jour les métriques de performance
   */
  async trackUsage(
    userId: string,
    provider: string,
    operationType: OperationType,
    tokensInput: number,
    tokensOutput: number,
    latency: number,
    success: boolean = true,
    errorMessage?: string,
  ) {
    // Calculer le coût
    const cost = this.calculateCost(provider, tokensInput, tokensOutput);

    console.log(
      `📊 Tracking: ${provider} | ${operationType} | ${tokensInput + tokensOutput} tokens | ${cost.toFixed(6)}$ | ${latency}ms`,
    );

    // Logger l'appel
    await this.prisma.llmUsageLog.create({
      data: {
        userId,
        provider,
        operationType,
        tokensInput,
        tokensOutput,
        cost,
        latency,
        success,
        errorMessage,
      },
    });

    // Mettre à jour les performances
    await this.updatePerformanceMetrics(
      userId,
      provider,
      latency,
      success,
      cost,
      tokensInput + tokensOutput,
    );
  }

  /**
   * 💰 Calculer le coût d'un appel
   */
  private calculateCost(
    provider: string,
    tokensInput: number,
    tokensOutput: number,
  ): number {
    const pricing = PRICING_PER_1M_TOKENS[provider] || { input: 1.0, output: 3.0 };

    return (
      (tokensInput / 1_000_000) * pricing.input +
      (tokensOutput / 1_000_000) * pricing.output
    );
  }

  /**
   * 📊 Mettre à jour les métriques de performance
   */
  private async updatePerformanceMetrics(
    userId: string,
    provider: string,
    latency: number,
    success: boolean,
    cost: number,
    tokens: number,
  ) {
    const existing = await this.prisma.providerPerformance.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    if (existing) {
      // Mise à jour incrémentale
      const totalCalls = existing.totalCalls + 1;
      const successCount = success
        ? (existing.successRate / 100) * existing.totalCalls + 1
        : (existing.successRate / 100) * existing.totalCalls;

      await this.prisma.providerPerformance.update({
        where: { userId_provider: { userId, provider } },
        data: {
          avgLatency: Math.round(
            (existing.avgLatency * existing.totalCalls + latency) / totalCalls,
          ),
          successRate: (successCount / totalCalls) * 100,
          totalCalls,
          totalTokens: existing.totalTokens + tokens,
          totalCost: existing.totalCost + cost,
          lastUsed: new Date(),
        },
      });
    } else {
      // Création
      await this.prisma.providerPerformance.create({
        data: {
          userId,
          provider,
          avgLatency: latency,
          successRate: success ? 100 : 0,
          totalCalls: 1,
          totalTokens: tokens,
          totalCost: cost,
          lastUsed: new Date(),
        },
      });
    }
  }

  /**
   * 🔄 Migrer l'ancien LlmConfig vers UserLlmProvider
   *
   * Utilitaire pour migrer les configurations existantes
   */
  async migrateOldConfig(userId: string) {
    const oldConfig = await this.prisma.llmConfig.findUnique({
      where: { userId },
    });

    if (!oldConfig || !oldConfig.apiKey) {
      return null;
    }

    // Vérifier si déjà migré
    const existing = await this.prisma.userLlmProvider.findUnique({
      where: {
        userId_provider: { userId, provider: oldConfig.provider },
      },
    });

    if (existing) {
      return existing;
    }

    // Créer le nouveau provider
    return this.prisma.userLlmProvider.create({
      data: {
        userId,
        provider: oldConfig.provider,
        apiKey: oldConfig.apiKey,
        model: oldConfig.model,
        isActive: true,
        priority: 0,
      },
    });
  }

  // ═══════════════════════════════════════════════════════
  // CRUD METHODS FOR USER PROVIDERS
  // ═══════════════════════════════════════════════════════

  /**
   * ✅ Ajouter un nouveau provider
   */
  async addUserProvider(userId: string, data: {
    provider: string;
    apiKey: string;
    model?: string;
    isActive?: boolean;
    priority?: number;
    monthlyBudget?: number;
  }) {
    // Migration automatique si nécessaire
    await this.migrateOldConfig(userId);

    return this.prisma.userLlmProvider.create({
      data: {
        userId,
        provider: data.provider,
        apiKey: data.apiKey,
        model: data.model,
        isActive: data.isActive ?? true,
        priority: data.priority ?? 0,
        monthlyBudget: data.monthlyBudget,
      },
    });
  }

  /**
   * ✅ Mettre à jour un provider
   */
  async updateUserProvider(userId: string, provider: string, data: {
    apiKey?: string;
    model?: string;
    isActive?: boolean;
    priority?: number;
    monthlyBudget?: number;
  }) {
    const updateData: any = {};

    if (data.apiKey !== undefined) updateData.apiKey = data.apiKey;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.monthlyBudget !== undefined) updateData.monthlyBudget = data.monthlyBudget;

    return this.prisma.userLlmProvider.update({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      data: updateData,
    });
  }

  /**
   * ✅ Supprimer un provider
   */
  async deleteUserProvider(userId: string, provider: string) {
    return this.prisma.userLlmProvider.delete({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });
  }

  /**
   * ✅ Tester un provider
   */
  async testUserProvider(userId: string, provider: string) {
    const userProvider = await this.prisma.userLlmProvider.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (!userProvider) {
      throw new Error(`Provider ${provider} not configured for user ${userId}`);
    }

    // Créer une instance du provider et tester
    try {
      const providerInstance = this.providerFactory.createProviderFromConfig({
        provider: userProvider.provider,
        apiKey: userProvider.apiKey,
        model: userProvider.model,
      } as any);

      // Test simple avec un prompt minimal
      await providerInstance.generate('Test connection', {
        maxTokens: 10,
        temperature: 0,
      });

      return {
        success: true,
        message: `✅ ${provider} is configured correctly and working`,
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ ${provider} test failed: ${error.message}`,
      };
    }
  }
}
