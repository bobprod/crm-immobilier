import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { ProviderType, ProviderCategory, ProviderStatus, ProviderConfig } from '@prisma/client';
import { CreateProviderConfigDto, UpdateProviderConfigDto, ProviderUsageDto } from '../dto';

/**
 * Service centralisé pour gérer tous les providers (Scraping, LLM, Storage, etc.)
 * Remplace la gestion fragmentée entre settings et userLlmProvider
 */
@Injectable()
export class ProviderRegistryService {
  private readonly logger = new Logger(ProviderRegistryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ═════════════════════════════════════════════════════════════════
  // CRUD OPERATIONS - Provider Config
  // ═════════════════════════════════════════════════════════════════

  /**
   * Créer un nouveau provider
   */
  async create(
    userId: string,
    dto: CreateProviderConfigDto,
    agencyId?: string,
  ): Promise<ProviderConfig> {
    this.logger.log(`Creating provider ${dto.provider} for user ${userId}`);

    // Vérifier si le provider existe déjà
    const existing = await this.prisma.providerConfig.findFirst({
      where: {
        userId,
        type: dto.type,
        provider: dto.provider,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Provider ${dto.provider} of type ${dto.type} already exists for this user`,
      );
    }

    // Créer le provider (l'encryption des clés API sera gérée par un middleware/service dédié)
    return this.prisma.providerConfig.create({
      data: {
        ...dto,
        userId,
        agencyId,
        status: ProviderStatus.active,
        isActive: true,
      },
    });
  }

  /**
   * Récupérer tous les providers d'un user
   */
  async findAllByUser(
    userId: string,
    filters?: {
      type?: ProviderType;
      isActive?: boolean;
      status?: ProviderStatus;
    },
  ): Promise<ProviderConfig[]> {
    return this.prisma.providerConfig.findMany({
      where: {
        userId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.status && { status: filters.status }),
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Récupérer un provider par ID
   */
  async findOne(id: string, userId: string): Promise<ProviderConfig> {
    const provider = await this.prisma.providerConfig.findFirst({
      where: { id, userId },
    });

    if (!provider) {
      throw new NotFoundException(`Provider ${id} not found`);
    }

    return provider;
  }

  /**
   * Mettre à jour un provider
   */
  async update(
    id: string,
    userId: string,
    dto: UpdateProviderConfigDto,
  ): Promise<ProviderConfig> {
    // Vérifier que le provider appartient à l'utilisateur
    await this.findOne(id, userId);

    return this.prisma.providerConfig.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Supprimer un provider
   */
  async delete(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.providerConfig.delete({ where: { id } });
    this.logger.log(`Provider ${id} deleted`);
  }

  // ═════════════════════════════════════════════════════════════════
  // PROVIDER SELECTION - Routing intelligent
  // ═════════════════════════════════════════════════════════════════

  /**
   * Sélectionner le meilleur provider selon le type et les critères
   */
  async selectBestProvider(
    userId: string,
    type: ProviderType,
    criteria: {
      operationType?: string;
      requiresApiKey?: boolean;
      minSuccessRate?: number;
      maxCost?: number;
      tags?: string[];
    } = {},
  ): Promise<ProviderConfig> {
    // Récupérer tous les providers actifs du type demandé
    const providers = await this.prisma.providerConfig.findMany({
      where: {
        userId,
        type,
        isActive: true,
        status: ProviderStatus.active,
        ...(criteria.minSuccessRate && {
          successRate: { gte: criteria.minSuccessRate },
        }),
        ...(criteria.requiresApiKey && {
          apiKey: { not: null },
        }),
      },
      orderBy: [
        { priority: 'asc' }, // Priorité la plus haute d'abord
        { successRate: 'desc' }, // Puis taux de succès
        { avgLatency: 'asc' }, // Puis latence la plus faible
      ],
    });

    if (providers.length === 0) {
      throw new NotFoundException(
        `No active provider found for type ${type} with the specified criteria`,
      );
    }

    // Filtrer par tags si spécifié
    let filteredProviders = providers;
    if (criteria.tags && criteria.tags.length > 0) {
      filteredProviders = providers.filter((p) =>
        criteria.tags.some((tag) => p.tags.includes(tag)),
      );
    }

    // Si aucun provider avec les tags, fallback sur tous les providers
    if (filteredProviders.length === 0) {
      this.logger.warn(
        `No provider with tags ${criteria.tags?.join(', ')}, using all available providers`,
      );
      filteredProviders = providers;
    }

    // Vérifier les budgets
    const bestProvider = filteredProviders.find((p) => {
      if (p.dailyBudget && p.dailyUsage >= p.dailyBudget) {
        this.logger.warn(`Provider ${p.provider} has exceeded daily budget`);
        return false;
      }
      if (p.monthlyBudget && p.monthlyUsage >= p.monthlyBudget) {
        this.logger.warn(`Provider ${p.provider} has exceeded monthly budget`);
        return false;
      }
      return true;
    });

    if (!bestProvider) {
      throw new BadRequestException(
        'All providers have exceeded their budget limits',
      );
    }

    this.logger.log(
      `Selected provider: ${bestProvider.provider} (priority: ${bestProvider.priority}, successRate: ${bestProvider.successRate}%)`,
    );

    return bestProvider;
  }

  /**
   * Récupérer les providers disponibles pour un type (pour affichage UI)
   */
  async getAvailableProviders(
    userId: string,
    type: ProviderType,
  ): Promise<{
    provider: string;
    name: string;
    category: ProviderCategory;
    isActive: boolean;
    status: ProviderStatus;
    successRate: number;
    avgLatency: number;
    totalCalls: number;
    monthlyUsage: number;
    monthlyBudget: number | null;
    hasApiKey: boolean;
  }[]> {
    const providers = await this.prisma.providerConfig.findMany({
      where: { userId, type },
      select: {
        provider: true,
        name: true,
        category: true,
        isActive: true,
        status: true,
        successRate: true,
        avgLatency: true,
        totalCalls: true,
        monthlyUsage: true,
        monthlyBudget: true,
        apiKey: true,
      },
      orderBy: { priority: 'asc' },
    });

    return providers.map((p) => ({
      ...p,
      hasApiKey: !!p.apiKey,
      apiKey: undefined, // Ne pas exposer la clé API
    })) as any;
  }

  // ═════════════════════════════════════════════════════════════════
  // USAGE TRACKING - Logs et métriques
  // ═════════════════════════════════════════════════════════════════

  /**
   * Logger une utilisation de provider
   */
  async logUsage(
    providerConfigId: string,
    userId: string,
    dto: ProviderUsageDto,
    agencyId?: string,
  ): Promise<void> {
    // Créer le log d'utilisation
    await this.prisma.providerUsageLog.create({
      data: {
        providerConfigId,
        userId,
        agencyId,
        ...dto,
      },
    });

    // Mettre à jour les métriques du provider
    await this.updateProviderMetrics(providerConfigId, dto);
  }

  /**
   * Mettre à jour les métriques d'un provider
   */
  private async updateProviderMetrics(
    providerConfigId: string,
    usage: ProviderUsageDto,
  ): Promise<void> {
    const provider = await this.prisma.providerConfig.findUnique({
      where: { id: providerConfigId },
    });

    if (!provider) return;

    const newTotalCalls = provider.totalCalls + 1;
    const newSuccessCalls = provider.successCalls + (usage.success ? 1 : 0);
    const newFailedCalls = provider.failedCalls + (usage.success ? 0 : 1);
    const newSuccessRate = (newSuccessCalls / newTotalCalls) * 100;

    // Calculer la nouvelle latence moyenne
    const newAvgLatency = usage.latencyMs
      ? (provider.avgLatency * provider.totalCalls + usage.latencyMs) / newTotalCalls
      : provider.avgLatency;

    // Incrémenter l'usage mensuel et journalier
    const newMonthlyUsage = provider.monthlyUsage + (usage.cost || 0);
    const newDailyUsage = provider.dailyUsage + (usage.cost || 0);

    await this.prisma.providerConfig.update({
      where: { id: providerConfigId },
      data: {
        totalCalls: newTotalCalls,
        successCalls: newSuccessCalls,
        failedCalls: newFailedCalls,
        successRate: newSuccessRate,
        avgLatency: newAvgLatency,
        monthlyUsage: newMonthlyUsage,
        dailyUsage: newDailyUsage,
        lastUsedAt: new Date(),
      },
    });

    // Créer ou mettre à jour les métriques journalières
    await this.updateDailyMetrics(providerConfigId, usage);
  }

  /**
   * Mettre à jour les métriques journalières
   */
  private async updateDailyMetrics(
    providerConfigId: string,
    usage: ProviderUsageDto,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.providerMetrics.findFirst({
      where: {
        providerConfigId,
        date: today,
        operationType: usage.operationType,
      },
    });

    if (existing) {
      // Mettre à jour les métriques existantes
      const newTotalCalls = existing.totalCalls + 1;
      const newSuccessCalls = existing.successCalls + (usage.success ? 1 : 0);
      const newFailedCalls = existing.failedCalls + (usage.success ? 0 : 1);
      const newAvgLatency = usage.latencyMs
        ? (existing.avgLatency * existing.totalCalls + usage.latencyMs) / newTotalCalls
        : existing.avgLatency;

      await this.prisma.providerMetrics.update({
        where: { id: existing.id },
        data: {
          totalCalls: newTotalCalls,
          successCalls: newSuccessCalls,
          failedCalls: newFailedCalls,
          avgLatency: newAvgLatency,
          minLatency: usage.latencyMs
            ? Math.min(existing.minLatency || Infinity, usage.latencyMs)
            : existing.minLatency,
          maxLatency: usage.latencyMs
            ? Math.max(existing.maxLatency || 0, usage.latencyMs)
            : existing.maxLatency,
          totalCost: existing.totalCost + (usage.cost || 0),
          totalTokens: existing.totalTokens + (usage.tokensInput || 0) + (usage.tokensOutput || 0),
        },
      });
    } else {
      // Créer de nouvelles métriques
      await this.prisma.providerMetrics.create({
        data: {
          providerConfigId,
          date: today,
          operationType: usage.operationType,
          totalCalls: 1,
          successCalls: usage.success ? 1 : 0,
          failedCalls: usage.success ? 0 : 1,
          avgLatency: usage.latencyMs || 0,
          minLatency: usage.latencyMs,
          maxLatency: usage.latencyMs,
          totalCost: usage.cost || 0,
          totalTokens: (usage.tokensInput || 0) + (usage.tokensOutput || 0),
        },
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // HEALTH CHECK & TESTING
  // ═════════════════════════════════════════════════════════════════

  /**
   * Tester la connexion d'un provider
   */
  async testProvider(id: string, userId: string): Promise<{
    success: boolean;
    latency?: number;
    message: string;
    error?: string;
  }> {
    const provider = await this.findOne(id, userId);

    const startTime = Date.now();

    try {
      // Logique de test selon le type de provider
      // Cette logique sera déléguée aux services spécifiques (WebDataService, LLMRouter, etc.)
      // Pour l'instant, un test basique de configuration

      if (!provider.apiKey && provider.category !== ProviderCategory.internal) {
        return {
          success: false,
          message: 'API key is required for this provider',
        };
      }

      // Mettre à jour le statut
      await this.prisma.providerConfig.update({
        where: { id },
        data: {
          lastHealthCheckAt: new Date(),
          status: ProviderStatus.active,
        },
      });

      const latency = Date.now() - startTime;

      return {
        success: true,
        latency,
        message: 'Provider configuration is valid',
      };
    } catch (error) {
      // Marquer le provider comme en erreur
      await this.prisma.providerConfig.update({
        where: { id },
        data: {
          status: ProviderStatus.error,
          lastHealthCheckAt: new Date(),
        },
      });

      return {
        success: false,
        message: 'Provider test failed',
        error: error.message,
      };
    }
  }

  /**
   * Reset les compteurs mensuels (à appeler via cron job)
   */
  async resetMonthlyCounters(): Promise<void> {
    this.logger.log('Resetting monthly usage counters for all providers');

    await this.prisma.providerConfig.updateMany({
      data: {
        monthlyUsage: 0,
      },
    });
  }

  /**
   * Reset les compteurs journaliers (à appeler via cron job)
   */
  async resetDailyCounters(): Promise<void> {
    this.logger.log('Resetting daily usage counters for all providers');

    await this.prisma.providerConfig.updateMany({
      data: {
        dailyUsage: 0,
      },
    });
  }
}
