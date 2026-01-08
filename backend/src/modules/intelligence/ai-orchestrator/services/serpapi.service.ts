import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ApiKeysService } from '../../../../shared/services/api-keys.service';
import { withRetry } from '../utils/retry.util';

/**
 * Interface pour les résultats SerpAPI
 */
export interface SerpApiSearchResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  source?: string;
}

export interface SerpApiResponse {
  organic_results?: SerpApiSearchResult[];
  total_results?: number;
  search_metadata?: any;
}

/**
 * Service SerpAPI pour la recherche Google
 */
@Injectable()
export class SerpApiService {
  private readonly logger = new Logger(SerpApiService.name);
  private readonly baseUrl = 'https://serpapi.com/search.json';

  constructor(private readonly apiKeys: ApiKeysService) { }

  /**
   * Récupérer la clé API SerpAPI du tenant
   */
  private async getApiKey(userId: string, agencyId?: string): Promise<string> {
    try {
      this.logger.log(`🔑 Getting API key for userId=${userId}, agencyId=${agencyId}`);

      if (!this.apiKeys) {
        const errMsg = 'ApiKeysService is undefined - Dependency Injection failed!';
        this.logger.error(errMsg);
        throw new Error(errMsg);
      }

      this.logger.log(`About to call this.apiKeys.getApiKey...`);
      const apiKey = await this.apiKeys.getApiKey(userId, 'serp', agencyId);
      this.logger.log(`Got API key successfully: ${apiKey ? apiKey.substring(0, 10) + '...' : 'null'}`);

      if (!apiKey) {
        throw new Error('SerpAPI key not configured for tenant');
      }

      return apiKey;
    } catch (error) {
      this.logger.error(`❌ Error in getApiKey: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Rechercher sur Google via SerpAPI
   */
  async search(params: {
    tenantId?: string;
    userId: string;
    query: string;
    location?: string;
    numResults?: number;
    language?: string;
  }): Promise<SerpApiSearchResult[]> {
    const { userId, tenantId, query, location, numResults = 10, language = 'fr' } = params;

    try {
      this.logger.log(`SerpAPI search: "${query}"`);
      this.logger.log(`Params: userId=${userId}, tenantId=${tenantId}`);

      const apiKey = await this.getApiKey(userId, tenantId);
      this.logger.log(`✅ API key retrieved successfully`);

      // Appel avec retry automatique
      const response = await withRetry(
        () =>
          axios.get<SerpApiResponse>(this.baseUrl, {
            params: {
              q: query,
              api_key: apiKey,
              num: numResults,
              hl: language,
              gl: location || 'fr',
              engine: 'google',
            },
            timeout: 30000,
          }),
        {
          maxRetries: 2,
          initialDelay: 1000,
          onRetry: (attempt) => this.logger.warn(`SerpAPI retry attempt ${attempt}`),
        },
      );

      const results = response.data.organic_results || [];

      this.logger.log(`SerpAPI returned ${results.length} results`);

      return results.map((r, index) => ({
        position: r.position || index + 1,
        title: r.title,
        link: r.link,
        snippet: r.snippet,
        source: r.source,
      }));
    } catch (error) {
      this.logger.error('SerpAPI search failed:', error.message);
      this.logger.error('Stack:', error.stack);
      const wrappedError = new Error(`SerpAPI search failed: ${error.message}`);
      wrappedError.stack = error.stack;  // Preserve original stack
      throw wrappedError;
    }
  }

  /**
   * Recherche locale (pour trouver des professionnels dans une zone)
   */
  async localSearch(params: {
    tenantId?: string;
    userId: string;
    query: string;
    location: string;
    numResults?: number;
  }): Promise<any[]> {
    const { userId, tenantId, query, location, numResults = 20 } = params;

    try {
      this.logger.log(`SerpAPI local search: "${query}" in ${location}`);

      const apiKey = await this.getApiKey(userId, tenantId);

      const response = await axios.get(this.baseUrl, {
        params: {
          q: query,
          location: location,
          api_key: apiKey,
          num: numResults,
          engine: 'google_maps',
        },
        timeout: 30000,
      });

      return response.data.local_results || [];
    } catch (error) {
      this.logger.error('SerpAPI local search failed:', error.message);
      throw new Error(`SerpAPI local search failed: ${error.message}`);
    }
  }
}
