import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingsProviderFactory, EmbeddingsProvider } from '../llm-config/providers';
import { JinaConfigDto, TestJinaDto, JinaEmbeddingsDto, JinaRerankDto, JinaReadUrlDto } from './dto/jina-config.dto';

/**
 * Service pour intégrer Jina.ai dans la recherche sémantique
 */
@Injectable()
export class JinaService {
  private readonly logger = new Logger(JinaService.name);
  private jinaProvider: EmbeddingsProvider | null = null;

  constructor(
    private readonly embeddingsFactory: EmbeddingsProviderFactory,
  ) {}

  /**
   * Obtenir le provider Jina (avec cache)
   */
  private async getJinaProvider(userId: string): Promise<EmbeddingsProvider | null> {
    if (this.jinaProvider) {
      return this.jinaProvider;
    }

    try {
      this.jinaProvider = await this.embeddingsFactory.createProviderForUser(userId, 'jina');
      return this.jinaProvider;
    } catch (error) {
      this.logger.warn(`Jina provider not available for user ${userId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Tester la configuration Jina
   */
  async testConfiguration(userId: string, dto: TestJinaDto): Promise<{
    success: boolean;
    message: string;
    latency?: number;
  }> {
    try {
      const startTime = Date.now();

      // Créer un provider temporaire pour le test
      const testProvider = await this.embeddingsFactory.testProvider(dto.apiKey, 'jina');

      const latency = Date.now() - startTime;

      if (testProvider) {
        return {
          success: true,
          message: 'Configuration Jina valide',
          latency,
        };
      } else {
        return {
          success: false,
          message: 'Configuration Jina invalide',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Erreur de test: ${error.message}`,
      };
    }
  }

  /**
   * Créer des embeddings pour un texte
   */
  async createEmbeddings(userId: string, dto: JinaEmbeddingsDto): Promise<number[]> {
    const provider = await this.getJinaProvider(userId);
    if (!provider) {
      throw new Error('Provider Jina non configuré');
    }

    return provider.createEmbeddings(dto.text);
  }

  /**
   * Créer des embeddings pour plusieurs textes
   */
  async createEmbeddingsBatch(userId: string, texts: string[]): Promise<number[][]> {
    const provider = await this.getJinaProvider(userId);
    if (!provider) {
      throw new Error('Provider Jina non configuré');
    }

    return provider.createEmbeddingsBatch(texts);
  }

  /**
   * Reranker des résultats de recherche
   */
  async rerank(userId: string, dto: JinaRerankDto): Promise<number[]> {
    const provider = await this.getJinaProvider(userId);
    if (!provider) {
      throw new Error('Provider Jina non configuré');
    }

    return provider.rerank(dto.query, dto.documents);
  }

  /**
   * Lire le contenu d'une URL
   */
  async readUrl(userId: string, dto: JinaReadUrlDto): Promise<string> {
    const provider = await this.getJinaProvider(userId);
    if (!provider) {
      throw new Error('Provider Jina non configuré');
    }

    return provider.readUrl(dto.url);
  }

  /**
   * Vérifier si Jina est disponible pour un utilisateur
   */
  async isAvailable(userId: string): Promise<boolean> {
    const provider = await this.getJinaProvider(userId);
    return provider !== null && provider.isConfigured();
  }

  /**
   * Obtenir les informations du provider Jina
   */
  async getProviderInfo(userId: string): Promise<{
    available: boolean;
    configured: boolean;
    name?: string;
  }> {
    const provider = await this.getJinaProvider(userId);

    return {
      available: provider !== null,
      configured: provider?.isConfigured() || false,
      name: provider?.name,
    };
  }
}
