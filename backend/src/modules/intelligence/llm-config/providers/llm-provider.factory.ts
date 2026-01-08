import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { ApiKeysService } from '../../../../shared/services/api-keys.service';
import { LLMProvider, LLMConfig, PRICING_PER_1M_TOKENS } from './llm-provider.interface';
import { AnthropicProvider } from './anthropic.provider';
import { OpenAIProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { DeepSeekProvider } from './deepseek.provider';
import { QwenProvider } from './qwen.provider';
import { KimiProvider } from './kimi.provider';
import { MistralProvider } from './mistral.provider';

/**
 * Factory pour créer des instances de providers LLM
 */
@Injectable()
export class LLMProviderFactory {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeysService: ApiKeysService,
  ) { }

  /**
   * Créer un provider LLM selon la config de l'utilisateur
   */
  async createProvider(userId: string): Promise<LLMProvider> {
    const config = await this.prisma.llmConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new BadRequestException(
        'Configuration LLM manquante. Veuillez configurer vos clés API dans Paramètres > LLM.',
      );
    }

    if (!config.apiKey) {
      throw new BadRequestException(
        `Clé API ${config.provider} manquante. Veuillez la configurer dans les paramètres.`,
      );
    }

    return this.createProviderInstance({
      provider: config.provider as LLMConfig['provider'],
      apiKey: config.apiKey,
      model: config.model || undefined,
    });
  }

  /**
   * 🔑 Créer un provider pour un utilisateur avec un provider spécifique
   * Supporte BYOK (Bring Your Own Key) avec fallback user→agency→superadmin
   *
   * @param userId - ID de l'utilisateur
   * @param providerName - Nom du provider (openai, gemini, anthropic, etc.)
   * @returns Instance du provider configuré
   */
  async createProviderForUser(
    userId: string,
    providerName: string,
  ): Promise<LLMProvider> {
    // Valider que le provider est supporté
    const validProviders: LLMConfig['provider'][] = [
      'anthropic',
      'openai',
      'gemini',
      'openrouter',
      'deepseek',
      'qwen',
      'kimi',
      'mistral',
    ];

    if (!validProviders.includes(providerName as LLMConfig['provider'])) {
      throw new BadRequestException(
        `Provider ${providerName} non supporté. Providers valides: ${validProviders.join(', ')}`,
      );
    }

    // 1. Essayer de récupérer depuis UserLlmProvider
    const userProvider = await this.prisma.userLlmProvider.findUnique({
      where: {
        userId_provider: { userId, provider: providerName },
      },
    });

    // Si la clé API est présente dans UserLlmProvider, l'utiliser directement
    if (userProvider?.apiKey) {
      console.log(`🔑 Clé BYOK trouvée dans UserLlmProvider pour ${providerName}`);
      return this.createProviderInstance({
        provider: providerName as LLMConfig['provider'],
        apiKey: userProvider.apiKey,
        model: userProvider.model || undefined,
      });
    }

    // 2. Fallback sur ApiKeysService (user → agency → superadmin)
    console.log(`🔍 Fallback ApiKeysService pour ${providerName}...`);
    const apiKey = await this.apiKeysService.getApiKey(
      userId,
      providerName as LLMConfig['provider'],
    );

    if (!apiKey) {
      throw new BadRequestException(
        `Aucune clé API ${providerName} configurée. Veuillez ajouter votre clé dans Paramètres > LLM.`,
      );
    }

    console.log(`✅ Clé API récupérée via fallback pour ${providerName}`);

    // 3. Déterminer le modèle par défaut selon le provider
    const defaultModel = this.getDefaultModel(providerName);

    return this.createProviderInstance({
      provider: providerName as LLMConfig['provider'],
      apiKey,
      model: userProvider?.model || defaultModel,
    });
  }

  /**
   * Obtenir le modèle par défaut pour un provider
   */
  private getDefaultModel(provider: string): string | undefined {
    const defaults: Record<string, string> = {
      openai: 'gpt-4o',
      gemini: 'gemini-2.0-flash-exp',
      anthropic: 'claude-3-5-sonnet-20241022',
      openrouter: 'anthropic/claude-3.5-sonnet',
      deepseek: 'deepseek-chat',
      qwen: 'qwen-max',
      kimi: 'moonshot-v1-32k',
      mistral: 'mistral-large-latest',
    };
    return defaults[provider];
  }

  /**
   * Créer une instance de provider à partir d'une config explicite
   */
  createProviderFromConfig(config: LLMConfig): LLMProvider {
    return this.createProviderInstance(config);
  }

  /**
   * Créer une instance de provider selon le type
   */
  private createProviderInstance(config: LLMConfig): LLMProvider {
    let provider: LLMProvider;

    switch (config.provider) {
      case 'anthropic':
        provider = new AnthropicProvider(config.apiKey, config.model);
        break;

      case 'openai':
        provider = new OpenAIProvider(config.apiKey, config.model);
        break;

      case 'gemini':
        provider = new GeminiProvider(config.apiKey, config.model);
        break;

      case 'openrouter':
        provider = new OpenRouterProvider(config.apiKey, config.model);
        break;

      case 'deepseek':
        provider = new DeepSeekProvider(config.apiKey, config.model);
        break;

      case 'qwen':
        provider = new QwenProvider(config.apiKey, config.model);
        break;

      case 'kimi':
        provider = new KimiProvider(config.apiKey, config.model);
        break;

      case 'mistral':
        provider = new MistralProvider(config.apiKey, config.model);
        break;

      default:
        throw new BadRequestException(`Provider LLM non supporté : ${config.provider}`);
    }

    if (!provider.isConfigured()) {
      throw new BadRequestException(
        `Clé API ${config.provider} invalide. Veuillez vérifier votre configuration.`,
      );
    }

    return provider;
  }

  /**
   * Tester une configuration LLM
   */
  async testProvider(config: LLMConfig): Promise<boolean> {
    try {
      const provider = this.createProviderInstance(config);

      const result = await provider.generate('Réponds uniquement "OK"', {
        maxTokens: 10,
      });

      return result.toLowerCase().includes('ok');
    } catch (error) {
      console.error('Test provider failed:', error);
      return false;
    }
  }

  /**
   * Estimer le coût d'une requête
   */
  estimateCost(provider: string, inputTokens: number, outputTokens: number): number {
    const pricing = PRICING_PER_1M_TOKENS[provider] || { input: 5.0, output: 15.0 };
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;
    return inputCost + outputCost;
  }

  /**
   * Obtenir les informations de pricing pour un provider
   */
  getPricing(provider: string): { input: number; output: number } {
    return PRICING_PER_1M_TOKENS[provider] || { input: 5.0, output: 15.0 };
  }
}
