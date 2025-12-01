import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { LLMProviderFactory } from './providers/llm-provider.factory';

/**
 * Service de gestion de la configuration LLM
 */
@Injectable()
export class LLMConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmFactory: LLMProviderFactory,
  ) { }

  /**
   * Récupérer la configuration LLM d'un utilisateur
   */
  async getConfig(userId: string) {
    let config = await this.prisma.llmConfig.findUnique({
      where: { userId },
    });

    // Créer config par défaut si n'existe pas
    if (!config) {
      config = await this.prisma.llmConfig.create({
        data: {
          userId,
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
        },
      });
    }

    // Masquer la clé API (montrer seulement 4 derniers caractères)
    if (config.apiKey) {
      config.apiKey = '***' + config.apiKey.slice(-4);
    }

    return config;
  }

  /**
   * Mettre à jour la configuration
   */
  async updateConfig(userId: string, data: any) {
    const existing = await this.prisma.llmConfig.findUnique({
      where: { userId },
    });

    if (existing) {
      return this.prisma.llmConfig.update({
        where: { userId },
        data,
      });
    }

    return this.prisma.llmConfig.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  /**
   * Tester la configuration
   */
  async testConfig(userId: string) {
    const config = await this.prisma.llmConfig.findUnique({
      where: { userId },
    });

    if (!config || !config.apiKey) {
      throw new NotFoundException('Configuration LLM non trouvée');
    }

    const isValid = await this.llmFactory.testProvider(config as any);

    return {
      success: isValid,
      provider: config.provider,
      model: config.model,
      message: isValid
        ? 'Configuration valide !'
        : 'Erreur : vérifiez votre clé API',
    };
  }

  /**
   * Liste des providers disponibles
   */
  getAvailableProviders() {
    return [
      {
        id: 'anthropic',
        name: 'Anthropic Claude',
        models: [
          'claude-sonnet-4-20250514',
          'claude-3-5-sonnet-20241022',
          'claude-3-opus-20240229',
        ],
        description: 'Claude de Anthropic - Excellent pour le SEO',
        pricing: '~$3 / 1M tokens',
        keyFormat: 'sk-ant-...',
        website: 'https://console.anthropic.com',
      },
      {
        id: 'openai',
        name: 'OpenAI GPT',
        models: [
          'gpt-4-turbo-preview',
          'gpt-4',
          'gpt-3.5-turbo',
        ],
        description: 'GPT-4 de OpenAI - Polyvalent et efficace',
        pricing: '~$10 / 1M tokens (GPT-4)',
        keyFormat: 'sk-...',
        website: 'https://platform.openai.com',
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        models: [
          'gemini-1.5-pro',
          'gemini-1.5-flash',
          'gemini-pro',
        ],
        description: 'Gemini de Google - Rapide et économique',
        pricing: '~$1.25 / 1M tokens',
        keyFormat: 'AIza...',
        website: 'https://makersuite.google.com',
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        models: [
          'deepseek-chat',
          'deepseek-coder',
        ],
        description: 'DeepSeek - Ultra économique et performant',
        pricing: '~$0.27 / 1M tokens',
        keyFormat: 'sk-...',
        website: 'https://platform.deepseek.com',
      },
      {
        id: 'openrouter',
        name: 'OpenRouter',
        models: [
          'anthropic/claude-3.5-sonnet',
          'openai/gpt-4-turbo-preview',
          'google/gemini-pro-1.5',
          'meta-llama/llama-3.1-405b',
        ],
        description: 'Accès à tous les modèles - Maximum de flexibilité',
        pricing: 'Variable selon le modèle',
        keyFormat: 'sk-or-...',
        website: 'https://openrouter.ai',
      },
    ];
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  async getUsageStats(userId: string) {
    // TODO: Implémenter le tracking des coûts réels
    return {
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
      lastUsed: null,
    };
  }

  /**
   * Obtenir les métriques pour le dashboard
   */
  async getDashboardMetrics(userId: string) {
    const config = await this.prisma.llmConfig.findUnique({
      where: { userId },
    });

    // TODO: En production, récupérer les vraies données depuis une table de tracking
    // Pour l'instant, retourner des données de démonstration
    const mockDailyStats = this.generateMockDailyStats();
    const totalTokens = mockDailyStats.reduce((sum, day) => sum + day.tokens, 0);
    const totalCost = mockDailyStats.reduce((sum, day) => sum + day.cost, 0);
    const requestCount = mockDailyStats.reduce((sum, day) => sum + day.requests, 0);

    return {
      totalTokens,
      totalCost,
      requestCount,
      averageCostPerRequest: requestCount > 0 ? totalCost / requestCount : 0,
      currentProvider: config?.provider || 'non configuré',
      currentModel: config?.model || 'non configuré',
      lastUsed: new Date(),
      dailyStats: mockDailyStats,
      providerDistribution: [
        { provider: config?.provider || 'anthropic', requests: requestCount, percentage: 100 },
      ],
    };
  }

  /**
   * Vérifier le budget
   */
  async checkBudget(userId: string, budgetLimit: number) {
    const metrics = await this.getDashboardMetrics(userId);
    const currentSpend = metrics.totalCost;
    const remaining = budgetLimit - currentSpend;
    const percentageUsed = budgetLimit > 0 ? (currentSpend / budgetLimit) * 100 : 0;

    // Projeter les dépenses mensuelles basées sur l'utilisation des 7 derniers jours
    const dailyAverage = currentSpend / 7;
    const projectedMonthlySpend = dailyAverage * 30;

    let status: 'safe' | 'warning' | 'danger';
    let message: string;

    if (percentageUsed >= 100) {
      status = 'danger';
      message = '⚠️ Budget dépassé ! Limitez votre utilisation.';
    } else if (percentageUsed >= 80) {
      status = 'danger';
      message = '🚨 Attention : Vous avez utilisé plus de 80% du budget.';
    } else if (percentageUsed >= 60) {
      status = 'warning';
      message = '⚡ Alerte : Vous approchez de votre limite budgétaire.';
    } else {
      status = 'safe';
      message = '✅ Budget sous contrôle.';
    }

    return {
      budgetLimit,
      currentSpend,
      remaining,
      percentageUsed: Math.round(percentageUsed * 100) / 100,
      status,
      message,
      isOverBudget: currentSpend > budgetLimit,
      projectedMonthlySpend,
    };
  }

  /**
   * Générer des statistiques quotidiennes mockées (pour démonstration)
   * TODO: Remplacer par de vraies données en production
   */
  private generateMockDailyStats() {
    const stats = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Générer des valeurs aléatoires pour la démo
      const requests = Math.floor(Math.random() * 50) + 10;
      const tokens = requests * (Math.floor(Math.random() * 1000) + 500);
      const cost = tokens * 0.000003; // ~$3 per 1M tokens

      stats.push({
        date: date.toISOString().split('T')[0],
        requests,
        tokens,
        cost: Math.round(cost * 100) / 100,
      });
    }

    return stats;
  }
}

