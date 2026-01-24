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
      {
        id: 'qwen',
        name: 'Qwen (Alibaba)',
        models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
        description: 'Qwen de Alibaba Cloud - Rapide et économique',
        pricing: '~$0.50 / 1M tokens',
        keyFormat: 'sk-...',
        website: 'https://dashscope.aliyun.com',
      },
      {
        id: 'kimi',
        name: 'Kimi (Moonshot)',
        models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
        description: 'Kimi de Moonshot AI - Long contexte disponible',
        pricing: '~$1.00 / 1M tokens',
        keyFormat: 'sk-...',
        website: 'https://platform.moonshot.cn',
      },
      {
        id: 'mistral',
        name: 'Mistral AI',
        models: ['mistral-tiny', 'mistral-small-latest', 'mistral-medium', 'mistral-large-latest'],
        description: 'Mistral AI - Open source et performant',
        pricing: '~$2.00 / 1M tokens (small)',
        keyFormat: 'Bearer token',
        website: 'https://mistral.ai',
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

  /**
   * Tester une clé API fournie directement (utilisé par l'UI pour tester une clé avant sauvegarde)
   */
  async testProviderKey(userId: string, provider: string, apiKey: string) {
    // Construire une config minimale pour le provider
    const config: any = {
      provider,
      apiKey,
    };

    const isValid = await this.llmFactory.testProvider(config);

    return {
      success: isValid,
      provider,
      message: isValid ? 'Clé valide' : 'Clé invalide ou erreur de connexion',
    };
  }

  /**
   * Sauvegarder la configuration par défaut (provider + model)
   */
  async saveDefaultConfig(userId: string, provider: string, model: string) {
    // Vérifier que le provider est configuré
    const userProvider = await this.prisma.userLlmProvider.findUnique({
      where: {
        userId_provider: { userId, provider },
      },
    });

    if (!userProvider) {
      throw new Error(`Provider ${provider} non configuré. Veuillez d'abord ajouter une clé API.`);
    }

    // Mettre à jour le provider avec le modèle sélectionné
    await this.prisma.userLlmProvider.update({
      where: {
        userId_provider: { userId, provider },
      },
      data: {
        model,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Mettre à jour aussi dans llmConfig (ancienne table)
    await this.prisma.llmConfig.upsert({
      where: { userId },
      create: {
        userId,
        provider,
        model,
      },
      update: {
        provider,
        model,
      },
    });

    return {
      success: true,
      provider,
      model,
      message: `Configuration par défaut sauvegardée: ${provider} - ${model}`,
    };
  }
}
