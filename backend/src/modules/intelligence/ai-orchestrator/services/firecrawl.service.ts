import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ApiKeysService } from '../../../../shared/services/api-keys.service';
import { withRetry } from '../utils/retry.util';

/**
 * Interface pour les résultats Firecrawl
 */
export interface FirecrawlScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      sourceURL?: string;
    };
    links?: string[];
  };
  error?: string;
}

/**
 * Service Firecrawl pour le scraping web
 */
@Injectable()
export class FirecrawlService {
  private readonly logger = new Logger(FirecrawlService.name);
  private readonly baseUrl = 'https://api.firecrawl.dev/v1';

  constructor(private readonly apiKeys: ApiKeysService) { }

  /**
   * Récupérer la clé API Firecrawl du tenant
   */
  private async getApiKey(userId: string, agencyId?: string): Promise<string> {
    const apiKey = await this.apiKeys.getApiKey(userId, 'firecrawl', agencyId);

    if (!apiKey) {
      throw new Error('Firecrawl API key not configured for tenant');
    }

    return apiKey;
  }

  /**
   * Scraper une URL
   */
  async scrape(params: {
    tenantId?: string;
    userId: string;
    url: string;
    formats?: ('markdown' | 'html' | 'links')[];
    onlyMainContent?: boolean;
  }): Promise<FirecrawlScrapeResult> {
    const { userId, tenantId, url, formats = ['markdown'], onlyMainContent = true } = params;

    try {
      this.logger.log(`Firecrawl scraping: ${url}`);

      const apiKey = await this.getApiKey(userId, tenantId);

      // Appel avec retry automatique
      const response = await withRetry(
        () =>
          axios.post(
            `${this.baseUrl}/scrape`,
            {
              url,
              formats,
              onlyMainContent,
            },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 60000, // 60s timeout
            },
          ),
        {
          maxRetries: 2,
          initialDelay: 2000,
          onRetry: (attempt) => this.logger.warn(`Firecrawl retry attempt ${attempt} for ${url}`),
        },
      );

      this.logger.log(`Firecrawl scrape completed for ${url}`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(`Firecrawl scrape failed for ${url}:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Scraper plusieurs URLs en batch
   */
  async scrapeBatch(params: {
    tenantId?: string;
    userId: string;
    urls: string[];
    formats?: ('markdown' | 'html' | 'links')[];
  }): Promise<FirecrawlScrapeResult[]> {
    const { userId, tenantId, urls, formats } = params;

    this.logger.log(`Firecrawl batch scraping ${urls.length} URLs`);

    // Scraper en parallèle (max 5 à la fois pour ne pas surcharger)
    const batchSize = 5;
    const results: FirecrawlScrapeResult[] = [];

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((url) =>
          this.scrape({
            userId,
            tenantId,
            url,
            formats,
          }),
        ),
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Extraire uniquement le texte principal d'une URL
   */
  async extractMainContent(params: {
    tenantId?: string;
    userId: string;
    url: string;
  }): Promise<string | null> {
    const result = await this.scrape({
      userId: params.userId,
      tenantId: params.tenantId,
      url: params.url,
      formats: ['markdown'],
      onlyMainContent: true,
    });

    if (!result.success || !result.data?.markdown) {
      return null;
    }

    return result.data.markdown;
  }
}
