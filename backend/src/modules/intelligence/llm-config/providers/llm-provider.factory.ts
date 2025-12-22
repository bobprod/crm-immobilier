import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { LLMProvider, LLMConfig, PRICING_PER_1M_TOKENS } from './llm-provider.interface';
import { AnthropicProvider } from './anthropic.provider';
import { OpenAIProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { DeepSeekProvider } from './deepseek.provider';

/**
 * Factory pour créer des instances de providers LLM
 */
@Injectable()
export class LLMProviderFactory {
  constructor(private readonly prisma: PrismaService) {}

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
