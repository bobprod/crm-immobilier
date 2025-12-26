import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { LLMProviderFactory } from './providers/llm-provider.factory';
import { ApiCostTrackerService } from '../../../shared/services/api-cost-tracker.service';
import { ErrorHandler } from '../../../shared/utils/error-handler.utils';

/**
 * Service de gestion de la configuration LLM
 */
@Injectable()
export class LLMConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmFactory: LLMProviderFactory,
    private readonly costTracker: ApiCostTrackerService,
  ) {}

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
      ErrorHandler.notFound('Configuration LLM');
    }

    const isValid = await this.llmFactory.testProvider(config as any);

    return {
      success: isValid,
      provider: config.provider,
      model: config.model,
      message: isValid ? 'Configuration valide !' : 'Erreur : vérifiez votre clé API',
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
        models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
        description: 'GPT-4 de OpenAI - Polyvalent et efficace',
        pricing: '~$10 / 1M tokens (GPT-4)',
        keyFormat: 'sk-...',
        website: 'https://platform.openai.com',
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
        description: 'Gemini de Google - Rapide et économique',
        pricing: '~$1.25 / 1M tokens',
        keyFormat: 'AIza...',
        website: 'https://makersuite.google.com',
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        models: ['deepseek-chat', 'deepseek-coder'],
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
    return this.costTracker.getUsageStats(userId);
  }

  /**
   * Obtenir les métriques pour le dashboard
   */
  async getDashboardMetrics(userId: string) {
    return this.costTracker.getDashboardMetrics(userId);
  }

  /**
   * Vérifier le budget
   */
  async checkBudget(userId: string, monthlyBudget: number) {
    return this.costTracker.checkBudgetAlert(userId, monthlyBudget);
  }
}
