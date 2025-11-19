import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { LLMProvider, LLMConfig } from './llm-provider.interface';
import { AnthropicProvider } from './anthropic.provider';
import { OpenAIProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import { OpenRouterProvider } from './openrouter.provider';

/**
 * Factory pour créer le bon provider LLM selon la configuration
 */
@Injectable()
export class LLMProviderFactory {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un provider LLM selon la config de l'utilisateur
   */
  async createProvider(userId: string): Promise<LLMProvider> {
    // Récupérer la config LLM de l'utilisateur
    const config = await this.prisma.llmConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new BadRequestException(
        'Configuration LLM manquante. Veuillez configurer vos clés API dans Paramètres > LLM.'
      );
    }

    if (!config.apiKey) {
      throw new BadRequestException(
        `Clé API ${config.provider} manquante. Veuillez la configurer dans les paramètres.`
      );
    }

    // Créer le provider approprié
    return this.createProviderInstance(config as LLMConfig);
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

      default:
        throw new BadRequestException(
          `Provider LLM non supporté : ${config.provider}`
        );
    }

    // Vérifier que le provider est configuré
    if (!provider.isConfigured()) {
      throw new BadRequestException(
        `Clé API ${config.provider} invalide. Veuillez vérifier votre configuration.`
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
      
      // Test simple
      const result = await provider.generate('Réponds uniquement "OK"', {
        maxTokens: 10,
      });

      return result.toLowerCase().includes('ok');
    } catch (error) {
      console.error('Test provider failed:', error);
      return false;
    }
  }
}
