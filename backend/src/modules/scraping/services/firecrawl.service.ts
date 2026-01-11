import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ApiKeysService } from '../../../shared/services/api-keys.service';

export interface FirecrawlScrapingOptions {
  onlyMainContent?: boolean;
  includeHtml?: boolean;
  waitFor?: number;
  extractionPrompt?: string;
}

export interface FirecrawlScrapingResult {
  markdown?: string;
  html?: string;
  text: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
  };
  extractedData?: any;
}

/**
 * Service de scraping avec Firecrawl (API externe)
 * 
 * Avantages:
 * - Intelligence artificielle intégrée
 * - Extraction structurée avec LLM
 * - Gère les sites complexes
 * - Markdown formaté
 * 
 * Limitations:
 * - Nécessite une clé API
 * - Coût par requête (~$0.001 par page)
 * - Tier gratuit limité
 * 
 * Cas d'usage:
 * - Sites complexes (Bricks.co, Homunity)
 * - Extraction structurée avec IA
 * - Sites avec anti-bot
 * - Besoin de qualité élevée
 */
@Injectable()
export class FirecrawlService {
  private readonly logger = new Logger(FirecrawlService.name);
  private readonly baseUrl = 'https://api.firecrawl.dev';

  constructor(private apiKeysService: ApiKeysService) {}

  /**
   * Obtenir la clé API Firecrawl
   *
   * Stratégie hiérarchique:
   * 1. Clé au niveau USER (ai_settings) - PRIORITÉ 1
   * 2. Clé au niveau AGENCY (agencyApiKeys) - PRIORITÉ 2
   * 3. Clé SUPER ADMIN (globalSettings) - FALLBACK
   *
   * @param userId ID de l'utilisateur
   * @param agencyId ID de l'agence (optionnel)
   */
  private async getApiKey(userId: string, agencyId?: string): Promise<string> {
    this.logger.log(`🔑 Getting Firecrawl API key for userId=${userId}, agencyId=${agencyId}`);

    try {
      const apiKey = await this.apiKeysService.getApiKey(userId, 'firecrawl', agencyId);

      if (!apiKey) {
        throw new Error(
          'Clé API Firecrawl non configurée. ' +
          'Veuillez configurer votre clé Firecrawl dans les paramètres (Settings > API Keys) ' +
          'ou contactez votre administrateur d\'agence.',
        );
      }

      this.logger.log(`✅ Firecrawl API key retrieved successfully`);
      return apiKey;
    } catch (error) {
      this.logger.error(`❌ Error getting Firecrawl API key: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scraper une URL avec Firecrawl
   *
   * @param url URL à scraper
   * @param options Options de scraping
   * @param userId ID de l'utilisateur (requis pour récupérer la clé API)
   * @param agencyId ID de l'agence (optionnel, pour fallback agency)
   */
  async scrapeUrl(
    url: string,
    options?: FirecrawlScrapingOptions & { userId?: string; agencyId?: string },
    tenantId?: string, // Deprecated: use options.userId instead
  ): Promise<FirecrawlScrapingResult> {
    this.logger.log(`Scraping URL avec Firecrawl: ${url}`);

    try {
      // Extract userId and agencyId from options or use tenantId as fallback
      const userId = options?.userId || tenantId;
      const agencyId = options?.agencyId;

      if (!userId) {
        throw new Error('userId is required to fetch API key from settings');
      }

      const apiKey = await this.getApiKey(userId, agencyId);

      const response = await axios.post(
        `${this.baseUrl}/v0/scrape`,
        {
          url,
          pageOptions: {
            onlyMainContent: options?.onlyMainContent ?? true,
            includeHtml: options?.includeHtml ?? false,
            waitFor: options?.waitFor || 0,
          },
          extractorOptions: options?.extractionPrompt
            ? {
                mode: 'llm-extraction',
                extractionPrompt: options.extractionPrompt,
              }
            : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 secondes pour les sites lents
        },
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Échec du scraping Firecrawl');
      }

      const data = response.data.data;

      const result: FirecrawlScrapingResult = {
        markdown: data.markdown,
        html: data.html,
        text: data.content || data.markdown || data.html || '',
        metadata: {
          title: data.metadata?.title,
          description: data.metadata?.description,
          language: data.metadata?.language,
          sourceURL: data.metadata?.sourceURL || url,
        },
        extractedData: data.llm_extraction || data.extractedData,
      };

      this.logger.log(`Scraping réussi avec Firecrawl: ${url}`);

      return result;
    } catch (error) {
      this.logger.error(`Échec du scraping Firecrawl pour ${url}: ${error.message}`);
      
      // Si l'erreur est liée à la clé API, la remonter clairement
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Clé API Firecrawl invalide ou expirée');
      }
      
      throw new Error(`Échec du scraping Firecrawl: ${error.message}`);
    }
  }

  /**
   * Scraper plusieurs URLs en batch
   */
  async scrapeMultipleUrls(
    urls: string[],
    options?: FirecrawlScrapingOptions,
    tenantId?: string,
  ): Promise<FirecrawlScrapingResult[]> {
    this.logger.log(`Scraping de ${urls.length} URLs avec Firecrawl`);

    const results: FirecrawlScrapingResult[] = [];

    // Traiter séquentiellement pour éviter de dépasser les limites de rate
    for (const url of urls) {
      try {
        const result = await this.scrapeUrl(url, options, tenantId);
        results.push(result);
        
        // Petit délai entre chaque requête pour respecter les limites
        await this.sleep(500);
      } catch (error) {
        this.logger.warn(`Échec du scraping pour ${url}: ${error.message}`);
        // Continuer avec les autres URLs
      }
    }

    return results;
  }

  /**
   * Crawler un site web (explorer plusieurs pages)
   */
  async crawlWebsite(
    url: string,
    options?: {
      maxPages?: number;
      includeSubdomains?: boolean;
      extractionPrompt?: string;
    },
    tenantId?: string,
  ): Promise<any> {
    this.logger.log(`Crawling du site avec Firecrawl: ${url}`);

    try {
      const apiKey = this.getApiKey(tenantId);

      const response = await axios.post(
        `${this.baseUrl}/v0/crawl`,
        {
          url,
          crawlerOptions: {
            maxPages: options?.maxPages || 10,
            includeSubdomains: options?.includeSubdomains ?? false,
          },
          extractorOptions: options?.extractionPrompt
            ? {
                mode: 'llm-extraction',
                extractionPrompt: options.extractionPrompt,
              }
            : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2 minutes
        },
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Échec du crawling Firecrawl');
      }

      // Le crawling est asynchrone, retourner le job ID
      return {
        jobId: response.data.jobId,
        status: 'processing',
      };
    } catch (error) {
      this.logger.error(`Échec du crawling Firecrawl pour ${url}: ${error.message}`);
      throw new Error(`Échec du crawling Firecrawl: ${error.message}`);
    }
  }

  /**
   * Vérifier le statut d'un job de crawling
   */
  async getCrawlStatus(jobId: string, tenantId?: string): Promise<any> {
    try {
      const apiKey = this.getApiKey(tenantId);

      const response = await axios.get(`${this.baseUrl}/v0/crawl/status/${jobId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Échec de la récupération du statut du crawl: ${error.message}`);
      throw new Error(`Échec de la récupération du statut: ${error.message}`);
    }
  }

  /**
   * Extraire des données structurées avec un prompt LLM
   */
  async extractWithLLM(
    url: string,
    extractionPrompt: string,
    tenantId?: string,
  ): Promise<any> {
    this.logger.log(`Extraction LLM avec Firecrawl pour: ${url}`);

    const result = await this.scrapeUrl(
      url,
      {
        onlyMainContent: true,
        includeHtml: false,
        extractionPrompt,
      },
      tenantId,
    );

    return result.extractedData;
  }

  /**
   * Vérifier si la clé API est valide
   */
  async testApiKey(apiKey?: string, tenantId?: string): Promise<boolean> {
    try {
      const key = apiKey || this.getApiKey(tenantId);

      const response = await axios.get(`${this.baseUrl}/v0/health`, {
        headers: {
          Authorization: `Bearer ${key}`,
        },
        timeout: 5000,
      });

      return response.status === 200;
    } catch (error) {
      this.logger.warn(`Test de la clé API Firecrawl échoué: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtenir les informations de crédit/quota
   */
  async getCredits(tenantId?: string): Promise<any> {
    try {
      const apiKey = this.getApiKey(tenantId);

      const response = await axios.get(`${this.baseUrl}/v0/credits`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 5000,
      });

      return response.data;
    } catch (error) {
      this.logger.warn(`Échec de la récupération des crédits: ${error.message}`);
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
